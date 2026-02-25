import uuid
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.knowledge import IngestJob, KnowledgeEntry
from app.services.llm_service import LLMService
from app.services.vector_service import VectorService


class IngestService:
    async def process_job(
        self, job_id: str, knowledge_type: Optional[str] = None
    ) -> None:
        async with AsyncSessionLocal() as db:
            try:
                result = await db.execute(
                    select(IngestJob).where(IngestJob.id == uuid.UUID(job_id))
                )
                job = result.scalar_one_or_none()
                if not job:
                    return

                job.status = "processing"
                await db.commit()

                # Step 1: Fetch/clean content
                raw_text = await self._fetch_content(job)

                # Step 2: LLM summarization + structuring
                llm = LLMService()
                structured = await llm.summarize_for_ingest(raw_text, knowledge_type)

                # Step 3: Create knowledge entry
                entry = KnowledgeEntry(
                    title=structured.get("title", "Untitled"),
                    content=structured.get("content", raw_text),
                    summary=structured.get("summary"),
                    knowledge_type=structured.get("knowledge_type", "writeup"),
                    tags=structured.get("tags", []),
                    mitre_techniques=structured.get("mitre_techniques", []),
                    mitre_tactics=structured.get("mitre_tactics", []),
                    skill_level=int(structured.get("skill_level", 1)),
                    confidence_rating=float(structured.get("confidence_rating", 1.0)),
                    references=[job.source_url] if job.source_url else [],
                )
                db.add(entry)
                await db.flush()

                # Step 4: Vector indexing
                try:
                    vector_svc = VectorService()
                    await vector_svc.upsert(entry)
                except Exception:
                    pass

                job.status = "completed"
                job.result_entry_id = entry.id
                await db.commit()

            except Exception as exc:
                try:
                    job.status = "failed"
                    job.error = str(exc)[:500]
                    await db.commit()
                except Exception:
                    pass

    async def _fetch_content(self, job: IngestJob) -> str:
        if job.source_text:
            return job.source_text

        if job.source_url:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                resp = await client.get(job.source_url)
                resp.raise_for_status()
                content_type = resp.headers.get("content-type", "")
                if "html" in content_type:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    # Remove script/style tags
                    for tag in soup(["script", "style", "nav", "footer", "header"]):
                        tag.decompose()
                    return soup.get_text(separator="\n", strip=True)
                return resp.text

        raise ValueError("No source_url or source_text provided")
