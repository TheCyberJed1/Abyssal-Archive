import json
import uuid
from datetime import datetime
from typing import Any

from fastapi import Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.knowledge import KnowledgeEntry


async def export_all(request: Request) -> StreamingResponse:
    """Export all knowledge entries as NDJSON."""
    async def generator():
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(KnowledgeEntry))
            for entry in result.scalars().all():
                row = {
                    "id": str(entry.id),
                    "title": entry.title,
                    "content": entry.content,
                    "summary": entry.summary,
                    "knowledge_type": entry.knowledge_type,
                    "phase": entry.phase,
                    "skill_level": entry.skill_level,
                    "confidence_rating": entry.confidence_rating,
                    "author": entry.author,
                    "tags": entry.tags,
                    "references": entry.references,
                    "code_blocks": entry.code_blocks,
                    "mitre_techniques": entry.mitre_techniques,
                    "mitre_tactics": entry.mitre_tactics,
                    "dependencies": entry.dependencies,
                    "related_techniques": entry.related_techniques,
                    "created_at": entry.created_at.isoformat() if entry.created_at else None,
                    "updated_at": entry.updated_at.isoformat() if entry.updated_at else None,
                }
                yield json.dumps(row) + "\n"

    return StreamingResponse(
        generator(),
        media_type="application/x-ndjson",
        headers={"Content-Disposition": "attachment; filename=abyssal_archive_export.ndjson"},
    )
