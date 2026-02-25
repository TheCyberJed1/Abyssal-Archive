import uuid
from typing import Any, Dict, List, Optional

from qdrant_client import AsyncQdrantClient
from qdrant_client.http.models import (
    Distance,
    Filter,
    FieldCondition,
    MatchValue,
    PointStruct,
    VectorParams,
)

from app.config import settings
from app.models.knowledge import KnowledgeEntry
from app.services.llm_service import LLMService


class VectorService:
    def __init__(self):
        self._client: Optional[AsyncQdrantClient] = None

    @property
    def client(self) -> AsyncQdrantClient:
        if self._client is None:
            self._client = AsyncQdrantClient(
                host=settings.QDRANT_HOST,
                port=settings.QDRANT_PORT,
            )
        return self._client

    async def ensure_collection(self) -> None:
        collections = await self.client.get_collections()
        names = [c.name for c in collections.collections]
        if settings.QDRANT_COLLECTION not in names:
            await self.client.create_collection(
                collection_name=settings.QDRANT_COLLECTION,
                vectors_config=VectorParams(
                    size=settings.EMBEDDING_DIM, distance=Distance.COSINE
                ),
            )

    async def upsert(self, entry: KnowledgeEntry) -> None:
        await self.ensure_collection()

        text = f"{entry.title}\n{entry.summary or ''}\n{entry.content[:1000]}"
        llm = LLMService()
        vector = await llm.embed(text)

        point = PointStruct(
            id=str(entry.id),
            vector=vector,
            payload={
                "id": str(entry.id),
                "title": entry.title,
                "knowledge_type": entry.knowledge_type,
                "tags": entry.tags or [],
                "mitre_techniques": entry.mitre_techniques or [],
                "skill_level": entry.skill_level,
            },
        )
        await self.client.upsert(
            collection_name=settings.QDRANT_COLLECTION,
            points=[point],
        )

    async def delete(self, entry_id: str) -> None:
        await self.ensure_collection()
        await self.client.delete(
            collection_name=settings.QDRANT_COLLECTION,
            points_selector=[entry_id],
        )

    async def search(
        self,
        query: str,
        top_k: int = 10,
        knowledge_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        await self.ensure_collection()

        llm = LLMService()
        query_vector = await llm.embed(query)

        search_filter = None
        if knowledge_type:
            search_filter = Filter(
                must=[
                    FieldCondition(
                        key="knowledge_type",
                        match=MatchValue(value=knowledge_type),
                    )
                ]
            )

        results = await self.client.search(
            collection_name=settings.QDRANT_COLLECTION,
            query_vector=query_vector,
            query_filter=search_filter,
            limit=top_k,
        )

        return [
            {"id": str(r.id), "score": r.score, "payload": r.payload}
            for r in results
        ]
