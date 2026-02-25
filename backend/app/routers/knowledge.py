import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.knowledge import KnowledgeEntry
from app.schemas.knowledge import (
    KnowledgeEntryCreate,
    KnowledgeEntryList,
    KnowledgeEntryRead,
    KnowledgeEntryUpdate,
    SemanticSearchRequest,
    SemanticSearchResponse,
)
from app.services.vector_service import VectorService

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.get("/", response_model=KnowledgeEntryList)
async def list_entries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    knowledge_type: Optional[str] = Query(None),
    tags: Optional[List[str]] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List knowledge entries with optional filtering."""
    query = select(KnowledgeEntry)

    if knowledge_type:
        query = query.where(KnowledgeEntry.knowledge_type == knowledge_type)
    if tags:
        query = query.where(KnowledgeEntry.tags.overlap(tags))
    if search:
        query = query.where(
            KnowledgeEntry.title.ilike(f"%{search}%")
            | KnowledgeEntry.content.ilike(f"%{search}%")
        )

    total_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(total_query)
    total = total_result.scalar_one()

    query = (
        query.order_by(KnowledgeEntry.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    entries = result.scalars().all()

    return KnowledgeEntryList(
        items=[KnowledgeEntryRead.model_validate(e) for e in entries],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/", response_model=KnowledgeEntryRead, status_code=status.HTTP_201_CREATED)
async def create_entry(
    payload: KnowledgeEntryCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new knowledge entry and index it in the vector store."""
    entry = KnowledgeEntry(**payload.model_dump())
    db.add(entry)
    await db.flush()

    # Index in Qdrant
    try:
        vector_svc = VectorService()
        await vector_svc.upsert(entry)
    except Exception:
        pass  # Vector indexing is best-effort; don't fail the whole request

    return KnowledgeEntryRead.model_validate(entry)


@router.get("/{entry_id}", response_model=KnowledgeEntryRead)
async def get_entry(entry_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get a single knowledge entry by ID."""
    result = await db.execute(
        select(KnowledgeEntry).where(KnowledgeEntry.id == entry_id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return KnowledgeEntryRead.model_validate(entry)


@router.patch("/{entry_id}", response_model=KnowledgeEntryRead)
async def update_entry(
    entry_id: uuid.UUID,
    payload: KnowledgeEntryUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Partially update a knowledge entry."""
    result = await db.execute(
        select(KnowledgeEntry).where(KnowledgeEntry.id == entry_id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)

    await db.flush()

    # Re-index in Qdrant
    try:
        vector_svc = VectorService()
        await vector_svc.upsert(entry)
    except Exception:
        pass

    return KnowledgeEntryRead.model_validate(entry)


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(entry_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Delete a knowledge entry."""
    result = await db.execute(
        select(KnowledgeEntry).where(KnowledgeEntry.id == entry_id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    # Remove from vector store
    try:
        vector_svc = VectorService()
        await vector_svc.delete(str(entry.id))
    except Exception:
        pass

    await db.delete(entry)


@router.post("/search/semantic", response_model=SemanticSearchResponse)
async def semantic_search(
    payload: SemanticSearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """Perform semantic (vector) search over knowledge entries."""
    try:
        vector_svc = VectorService()
        results = await vector_svc.search(
            query=payload.query,
            top_k=payload.top_k,
            knowledge_type=payload.knowledge_type,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=503, detail=f"Vector search unavailable: {exc}"
        )

    # Fetch full entries from DB
    ids = [uuid.UUID(r["id"]) for r in results]
    scores = {r["id"]: r["score"] for r in results}

    db_result = await db.execute(
        select(KnowledgeEntry).where(KnowledgeEntry.id.in_(ids))
    )
    entries = {str(e.id): e for e in db_result.scalars().all()}

    from app.schemas.knowledge import SemanticSearchResult

    return SemanticSearchResponse(
        query=payload.query,
        results=[
            SemanticSearchResult(
                entry=KnowledgeEntryRead.model_validate(entries[eid]),
                score=scores[eid],
            )
            for eid in [str(i) for i in ids]
            if eid in entries
        ],
    )
