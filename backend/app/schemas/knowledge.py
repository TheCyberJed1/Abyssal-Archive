import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ─── Knowledge Entry Schemas ─────────────────────────────────────────────────

KNOWLEDGE_TYPES = [
    "recon",
    "exploit",
    "post-exploitation",
    "tool",
    "payload",
    "writeup",
    "poc",
    "zero-day",
    "case-study",
    "mitre-technique",
]


class KnowledgeEntryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=512)
    content: str = Field(..., min_length=1)
    summary: Optional[str] = None
    knowledge_type: str = Field(..., description=f"One of: {KNOWLEDGE_TYPES}")
    phase: Optional[str] = None
    skill_level: int = Field(1, ge=1, le=5)
    confidence_rating: float = Field(1.0, ge=0.0, le=5.0)
    author: Optional[str] = None
    tags: Optional[List[str]] = None
    references: Optional[List[str]] = None
    code_blocks: Optional[Dict[str, Any]] = None
    mitre_techniques: Optional[List[str]] = None
    mitre_tactics: Optional[List[str]] = None
    dependencies: Optional[List[str]] = None
    related_techniques: Optional[List[str]] = None


class KnowledgeEntryCreate(KnowledgeEntryBase):
    pass


class KnowledgeEntryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=512)
    content: Optional[str] = None
    summary: Optional[str] = None
    knowledge_type: Optional[str] = None
    phase: Optional[str] = None
    skill_level: Optional[int] = Field(None, ge=1, le=5)
    confidence_rating: Optional[float] = Field(None, ge=0.0, le=5.0)
    author: Optional[str] = None
    tags: Optional[List[str]] = None
    references: Optional[List[str]] = None
    code_blocks: Optional[Dict[str, Any]] = None
    mitre_techniques: Optional[List[str]] = None
    mitre_tactics: Optional[List[str]] = None
    dependencies: Optional[List[str]] = None
    related_techniques: Optional[List[str]] = None


class KnowledgeEntryRead(KnowledgeEntryBase):
    id: uuid.UUID
    vector_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class KnowledgeEntryList(BaseModel):
    items: List[KnowledgeEntryRead]
    total: int
    page: int
    page_size: int


# ─── Search / Query Schemas ───────────────────────────────────────────────────

class SemanticSearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    top_k: int = Field(10, ge=1, le=50)
    knowledge_type: Optional[str] = None
    tags: Optional[List[str]] = None


class SemanticSearchResult(BaseModel):
    entry: KnowledgeEntryRead
    score: float


class SemanticSearchResponse(BaseModel):
    query: str
    results: List[SemanticSearchResult]


# ─── Archivist (AI) Schemas ───────────────────────────────────────────────────

class ArchivistChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    context_entry_id: Optional[uuid.UUID] = None


class ArchivistChatResponse(BaseModel):
    reply: str
    suggested_tags: Optional[List[str]] = None
    suggested_mitre: Optional[List[str]] = None


class AutoTagRequest(BaseModel):
    content: str


class AutoTagResponse(BaseModel):
    tags: List[str]
    mitre_techniques: List[str]
    mitre_tactics: List[str]
    knowledge_type: str
    summary: str


class SkillGapRequest(BaseModel):
    mitre_techniques: List[str]


class SkillGapResponse(BaseModel):
    covered: List[str]
    gaps: List[str]
    recommendations: List[str]


# ─── Ingest Schemas ───────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    source_url: Optional[str] = None
    source_text: Optional[str] = None
    knowledge_type: Optional[str] = None


class IngestJobRead(BaseModel):
    id: uuid.UUID
    source_url: Optional[str] = None
    status: str
    result_entry_id: Optional[uuid.UUID] = None
    error: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Graph Schemas ────────────────────────────────────────────────────────────

class GraphNode(BaseModel):
    id: str
    label: str
    knowledge_type: str
    skill_level: int
    tags: Optional[List[str]] = None
    mitre_techniques: Optional[List[str]] = None


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship: str  # dependency, related, mitre_chain


class GraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
