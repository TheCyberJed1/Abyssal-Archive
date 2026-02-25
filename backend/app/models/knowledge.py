import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class KnowledgeEntry(Base):
    __tablename__ = "knowledge_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Classification
    knowledge_type: Mapped[str] = mapped_column(
        String(64), nullable=False, index=True
    )  # recon, exploit, post-exploitation, tool, payload, writeup, poc, zero-day, case-study, mitre-technique
    phase: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    skill_level: Mapped[int] = mapped_column(Integer, default=1)  # 1-5
    confidence_rating: Mapped[float] = mapped_column(Float, default=1.0)  # 0.0-5.0

    # Metadata
    author: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    tags: Mapped[Optional[list]] = mapped_column(ARRAY(String), nullable=True)
    references: Mapped[Optional[list]] = mapped_column(ARRAY(Text), nullable=True)
    code_blocks: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # MITRE ATT&CK
    mitre_techniques: Mapped[Optional[list]] = mapped_column(
        ARRAY(String), nullable=True
    )
    mitre_tactics: Mapped[Optional[list]] = mapped_column(
        ARRAY(String), nullable=True
    )

    # Relationships / Graph
    dependencies: Mapped[Optional[list]] = mapped_column(
        ARRAY(String), nullable=True
    )  # UUIDs of dependency entries
    related_techniques: Mapped[Optional[list]] = mapped_column(
        ARRAY(String), nullable=True
    )  # UUIDs of related entries

    # Vector embedding reference
    vector_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        Index("ix_knowledge_entries_tags", tags, postgresql_using="gin"),
        Index(
            "ix_knowledge_entries_mitre",
            mitre_techniques,
            postgresql_using="gin",
        ),
    )

    def __repr__(self) -> str:
        return f"<KnowledgeEntry {self.id}: {self.title}>"


class IngestJob(Base):
    __tablename__ = "ingest_jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    source_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), default="pending"
    )  # pending, processing, completed, failed
    result_entry_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("knowledge_entries.id"), nullable=True
    )
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
