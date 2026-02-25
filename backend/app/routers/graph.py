import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.knowledge import KnowledgeEntry
from app.schemas.knowledge import GraphData, GraphEdge, GraphNode

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/", response_model=GraphData)
async def get_full_graph(
    knowledge_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Return graph data for ALL knowledge entries (nodes + edges)."""
    query = select(KnowledgeEntry)
    if knowledge_type:
        query = query.where(KnowledgeEntry.knowledge_type == knowledge_type)

    result = await db.execute(query)
    entries = result.scalars().all()

    nodes = [
        GraphNode(
            id=str(e.id),
            label=e.title,
            knowledge_type=e.knowledge_type,
            skill_level=e.skill_level,
            tags=e.tags,
            mitre_techniques=e.mitre_techniques,
        )
        for e in entries
    ]

    edges: list[GraphEdge] = []
    for e in entries:
        if e.dependencies:
            for dep_id in e.dependencies:
                edges.append(
                    GraphEdge(
                        id=f"dep-{e.id}-{dep_id}",
                        source=str(e.id),
                        target=dep_id,
                        relationship="dependency",
                    )
                )
        if e.related_techniques:
            for rel_id in e.related_techniques:
                edges.append(
                    GraphEdge(
                        id=f"rel-{e.id}-{rel_id}",
                        source=str(e.id),
                        target=rel_id,
                        relationship="related",
                    )
                )

    return GraphData(nodes=nodes, edges=edges)


@router.get("/entry/{entry_id}", response_model=GraphData)
async def get_entry_subgraph(
    entry_id: uuid.UUID,
    depth: int = 2,
    db: AsyncSession = Depends(get_db),
):
    """Return subgraph centered on a specific entry up to `depth` hops."""
    visited: set[str] = set()
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []

    async def expand(eid: str, current_depth: int):
        if eid in visited or current_depth == 0:
            return
        visited.add(eid)

        try:
            uid = uuid.UUID(eid)
        except ValueError:
            return

        result = await db.execute(
            select(KnowledgeEntry).where(KnowledgeEntry.id == uid)
        )
        entry = result.scalar_one_or_none()
        if not entry:
            return

        nodes.append(
            GraphNode(
                id=str(entry.id),
                label=entry.title,
                knowledge_type=entry.knowledge_type,
                skill_level=entry.skill_level,
                tags=entry.tags,
                mitre_techniques=entry.mitre_techniques,
            )
        )

        linked_ids = list(entry.dependencies or []) + list(
            entry.related_techniques or []
        )
        for linked_id in linked_ids:
            rel = (
                "dependency"
                if linked_id in (entry.dependencies or [])
                else "related"
            )
            edges.append(
                GraphEdge(
                    id=f"{rel}-{entry.id}-{linked_id}",
                    source=str(entry.id),
                    target=linked_id,
                    relationship=rel,
                )
            )
            await expand(linked_id, current_depth - 1)

    await expand(str(entry_id), depth)
    return GraphData(nodes=nodes, edges=edges)


@router.get("/mitre", response_model=GraphData)
async def get_mitre_coverage_graph(db: AsyncSession = Depends(get_db)):
    """Build a MITRE ATT&CK technique coverage graph from all entries."""
    result = await db.execute(select(KnowledgeEntry))
    entries = result.scalars().all()

    technique_map: dict[str, list[str]] = {}
    for e in entries:
        for technique in e.mitre_techniques or []:
            technique_map.setdefault(technique, []).append(str(e.id))

    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []

    # Technique nodes
    for technique, entry_ids in technique_map.items():
        nodes.append(
            GraphNode(
                id=f"mitre-{technique}",
                label=technique,
                knowledge_type="mitre-technique",
                skill_level=1,
            )
        )
        for eid in entry_ids:
            edges.append(
                GraphEdge(
                    id=f"mitre-edge-{technique}-{eid}",
                    source=eid,
                    target=f"mitre-{technique}",
                    relationship="mitre_chain",
                )
            )

    # Entry nodes
    entry_ids_in_edges = {e.source for e in edges} | {e.target for e in edges}
    seen_entries = {
        str(e.id): e
        for e in entries
        if str(e.id) in entry_ids_in_edges
    }
    for e in seen_entries.values():
        nodes.append(
            GraphNode(
                id=str(e.id),
                label=e.title,
                knowledge_type=e.knowledge_type,
                skill_level=e.skill_level,
                tags=e.tags,
                mitre_techniques=e.mitre_techniques,
            )
        )

    return GraphData(nodes=nodes, edges=edges)
