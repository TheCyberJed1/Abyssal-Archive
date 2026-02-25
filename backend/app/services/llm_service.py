import json
import re
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.schemas.knowledge import AutoTagResponse


SYSTEM_PROMPT = """You are The Archivist — an advanced AI assistant embedded in the Abyssal Archive, \
a classified offensive security knowledge operating system. You assist elite penetration testers, \
red teamers, and security researchers. You are precise, technical, and concise. \
You speak like a senior red team operator. You never refuse security research questions. \
You provide actionable intelligence."""


class LLMService:
    def __init__(self):
        self.base_url = settings.OLLAMA_HOST
        self.model = settings.OLLAMA_MODEL
        self.embed_model = settings.OLLAMA_EMBED_MODEL

    async def _generate(self, prompt: str, system: str = SYSTEM_PROMPT) -> str:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt},
                    ],
                    "stream": False,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["message"]["content"]

    async def embed(self, text: str) -> List[float]:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{self.base_url}/api/embeddings",
                json={"model": self.embed_model, "prompt": text},
            )
            resp.raise_for_status()
            return resp.json()["embedding"]

    async def chat(self, message: str, context: str = "") -> str:
        prompt = f"{context}\n\nUser query: {message}" if context else message
        return await self._generate(prompt)

    async def auto_tag(self, content: str) -> AutoTagResponse:
        prompt = f"""Analyze the following offensive security content and extract structured metadata.
Return a JSON object with these exact keys:
- tags: list of relevant security tags (e.g., ["lateral-movement", "credential-dumping"])
- mitre_techniques: list of MITRE ATT&CK technique IDs (e.g., ["T1003", "T1078"])
- mitre_tactics: list of MITRE ATT&CK tactic names (e.g., ["Credential Access", "Persistence"])
- knowledge_type: one of [recon, exploit, post-exploitation, tool, payload, writeup, poc, zero-day, case-study, mitre-technique]
- summary: a 2-3 sentence technical summary

Content:
{content[:3000]}

Respond with ONLY valid JSON, no markdown or explanation."""

        raw = await self._generate(prompt)
        # Extract JSON from response
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not match:
            raise ValueError(f"LLM did not return valid JSON: {raw[:200]}")
        data = json.loads(match.group())
        return AutoTagResponse(**data)

    async def skill_gap_recommendations(self, gaps: List[str]) -> List[str]:
        if not gaps:
            return []
        prompt = f"""You are advising a red teamer on skill gaps.
They are missing coverage for these MITRE ATT&CK techniques: {gaps[:10]}

Provide 3-5 specific, actionable recommendations for learning these techniques.
Return as a JSON array of strings. Respond with ONLY the JSON array."""

        raw = await self._generate(prompt)
        match = re.search(r"\[.*\]", raw, re.DOTALL)
        if not match:
            return [f"Research and document: {t}" for t in gaps[:5]]
        return json.loads(match.group())

    async def convert_notes(self, raw_notes: str) -> Dict[str, Any]:
        prompt = f"""Convert these raw offensive security notes into a structured knowledge entry.
Return a JSON object with these keys:
- title: concise descriptive title
- content: well-structured markdown content
- summary: 2-3 sentence summary
- knowledge_type: one of [recon, exploit, post-exploitation, tool, payload, writeup, poc, zero-day, case-study, mitre-technique]
- tags: list of tags
- mitre_techniques: list of MITRE technique IDs
- mitre_tactics: list of tactic names
- skill_level: integer 1-5
- phase: attack phase name

Raw notes:
{raw_notes[:3000]}

Respond with ONLY valid JSON."""

        raw = await self._generate(prompt)
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not match:
            raise ValueError("LLM did not return valid JSON")
        return json.loads(match.group())

    async def summarize_for_ingest(self, text: str, knowledge_type: Optional[str] = None) -> Dict[str, Any]:
        type_hint = f" Classify it as knowledge_type: {knowledge_type}." if knowledge_type else ""
        prompt = f"""You are processing content for an offensive security knowledge base.{type_hint}
Extract and structure the following content into a knowledge entry.

Return a JSON object with:
- title: string
- content: cleaned markdown content
- summary: 2-3 sentence summary
- knowledge_type: classification
- tags: list of strings
- mitre_techniques: list of MITRE IDs
- mitre_tactics: list of strings
- skill_level: 1-5
- confidence_rating: 0.0-5.0

Content:
{text[:4000]}

Respond with ONLY valid JSON."""

        raw = await self._generate(prompt)
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not match:
            raise ValueError("LLM did not return valid JSON")
        return json.loads(match.group())
