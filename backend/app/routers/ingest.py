import uuid
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.knowledge import IngestJob
from app.schemas.knowledge import IngestJobRead, IngestRequest
from app.services.ingest_service import IngestService

router = APIRouter(prefix="/ingest", tags=["ingest"])


@router.post("/", response_model=IngestJobRead, status_code=202)
async def ingest(
    payload: IngestRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Submit a URL or raw text for automated ingestion and knowledge entry creation."""
    if not payload.source_url and not payload.source_text:
        raise HTTPException(
            status_code=400, detail="Must provide source_url or source_text"
        )

    job = IngestJob(
        source_url=payload.source_url,
        source_text=payload.source_text,
        status="pending",
    )
    db.add(job)
    await db.flush()

    background_tasks.add_task(
        IngestService().process_job,
        job_id=str(job.id),
        knowledge_type=payload.knowledge_type,
    )

    return IngestJobRead.model_validate(job)


@router.get("/jobs", response_model=List[IngestJobRead])
async def list_jobs(db: AsyncSession = Depends(get_db)):
    """List all ingestion jobs."""
    result = await db.execute(
        select(IngestJob).order_by(IngestJob.created_at.desc()).limit(100)
    )
    return [IngestJobRead.model_validate(j) for j in result.scalars().all()]


@router.get("/jobs/{job_id}", response_model=IngestJobRead)
async def get_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get the status of a specific ingestion job."""
    result = await db.execute(
        select(IngestJob).where(IngestJob.id == job_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return IngestJobRead.model_validate(job)
