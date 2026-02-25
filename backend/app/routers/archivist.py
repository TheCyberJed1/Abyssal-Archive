import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.knowledge import KnowledgeEntry
from app.schemas.knowledge import (
    ArchivistChatRequest,
    ArchivistChatResponse,
    AutoTagRequest,
    AutoTagResponse,
    SkillGapRequest,
    SkillGapResponse,
)
from app.services.llm_service import LLMService

router = APIRouter(prefix="/archivist", tags=["archivist"])


@router.post("/chat", response_model=ArchivistChatResponse)
async def chat(
    payload: ArchivistChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """Chat with The Archivist — context-aware LLM assistant."""
    context = ""
    if payload.context_entry_id:
        result = await db.execute(
            select(KnowledgeEntry).where(
                KnowledgeEntry.id == payload.context_entry_id
            )
        )
        entry = result.scalar_one_or_none()
        if entry:
            context = f"\n\nCurrent entry context:\nTitle: {entry.title}\nType: {entry.knowledge_type}\nContent:\n{entry.content[:2000]}"

    llm = LLMService()
    try:
        reply = await llm.chat(message=payload.message, context=context)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"LLM service unavailable: {exc}. Ensure Ollama is running.",
        )

    return ArchivistChatResponse(reply=reply)


@router.post("/auto-tag", response_model=AutoTagResponse)
async def auto_tag(payload: AutoTagRequest):
    """Auto-extract tags, MITRE techniques, and generate a summary from raw content."""
    llm = LLMService()
    try:
        result = await llm.auto_tag(payload.content)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"LLM service unavailable: {exc}. Ensure Ollama is running.",
        )
    return result


@router.post("/skill-gap", response_model=SkillGapResponse)
async def skill_gap_analysis(
    payload: SkillGapRequest,
    db: AsyncSession = Depends(get_db),
):
    """Identify MITRE ATT&CK coverage gaps based on existing knowledge entries."""
    result = await db.execute(select(KnowledgeEntry))
    entries = result.scalars().all()

    covered_techniques: set[str] = set()
    for e in entries:
        for t in e.mitre_techniques or []:
            covered_techniques.add(t)

    target_set = set(payload.mitre_techniques)
    covered = list(target_set & covered_techniques)
    gaps = list(target_set - covered_techniques)

    llm = LLMService()
    try:
        recommendations = await llm.skill_gap_recommendations(gaps)
    except Exception:
        recommendations = [
            f"Research and document technique: {t}" for t in gaps[:5]
        ]

    return SkillGapResponse(
        covered=covered,
        gaps=gaps,
        recommendations=recommendations,
    )


@router.post("/convert", response_model=dict)
async def convert_notes(payload: AutoTagRequest):
    """Convert raw notes into a structured knowledge entry draft."""
    llm = LLMService()
    try:
        structured = await llm.convert_notes(payload.content)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"LLM service unavailable: {exc}. Ensure Ollama is running.",
        )
    return structured
