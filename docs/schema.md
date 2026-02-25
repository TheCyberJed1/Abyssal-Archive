# Database Schema

## PostgreSQL Tables

### `knowledge_entries`

Primary table for all knowledge entries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, default uuid4 | Unique identifier |
| `title` | VARCHAR(512) | NOT NULL, indexed | Entry title |
| `content` | TEXT | NOT NULL | Full markdown content |
| `summary` | TEXT | nullable | AI-generated or manual summary |
| `knowledge_type` | VARCHAR(64) | NOT NULL, indexed | Entry classification |
| `phase` | VARCHAR(128) | nullable | Attack phase (e.g., Initial Access) |
| `skill_level` | INTEGER | default 1 | Skill difficulty 1–5 |
| `confidence_rating` | FLOAT | default 1.0 | Confidence score 0.0–5.0 |
| `author` | VARCHAR(256) | nullable | Author handle or name |
| `tags` | TEXT[] | nullable, GIN indexed | Searchable tag array |
| `references` | TEXT[] | nullable | URLs or citation strings |
| `code_blocks` | JSONB | nullable | Structured code blocks `{"lang": "code"}` |
| `mitre_techniques` | TEXT[] | nullable, GIN indexed | MITRE ATT&CK technique IDs (e.g. T1003) |
| `mitre_tactics` | TEXT[] | nullable | MITRE tactic names |
| `dependencies` | TEXT[] | nullable | UUIDs of prerequisite entries |
| `related_techniques` | TEXT[] | nullable | UUIDs of related entries |
| `vector_id` | VARCHAR(128) | nullable | Qdrant point ID reference |
| `created_at` | TIMESTAMPTZ | server default now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | server default now(), auto-update | Last update timestamp |

**Indexes:**
- `ix_knowledge_entries_title` — B-tree on `title`
- `ix_knowledge_entries_knowledge_type` — B-tree on `knowledge_type`
- `ix_knowledge_entries_tags` — GIN on `tags`
- `ix_knowledge_entries_mitre` — GIN on `mitre_techniques`

**Valid `knowledge_type` values:**
`recon`, `exploit`, `post-exploitation`, `tool`, `payload`, `writeup`, `poc`, `zero-day`, `case-study`, `mitre-technique`

---

### `ingest_jobs`

Tracks automated content ingestion jobs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, default uuid4 | Job identifier |
| `source_url` | TEXT | nullable | Source URL if URL ingestion |
| `source_text` | TEXT | nullable | Raw text if text ingestion |
| `status` | VARCHAR(32) | default 'pending' | Job state |
| `result_entry_id` | UUID | FK → knowledge_entries.id, nullable | Created entry on completion |
| `error` | TEXT | nullable | Error message on failure |
| `created_at` | TIMESTAMPTZ | server default now() | Submission timestamp |
| `updated_at` | TIMESTAMPTZ | server default now(), auto-update | Last state change |

**Valid `status` values:**
`pending`, `processing`, `completed`, `failed`

---

## Qdrant Collection

### `knowledge_entries`

Vector store collection for semantic search.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID string | Matches PostgreSQL `knowledge_entries.id` |
| `vector` | float[768] | Embedding from `nomic-embed-text` model |
| `payload.id` | string | Entry UUID |
| `payload.title` | string | Entry title |
| `payload.knowledge_type` | string | Entry type for filtering |
| `payload.tags` | string[] | Tags for filtering |
| `payload.mitre_techniques` | string[] | MITRE technique IDs |
| `payload.skill_level` | integer | Skill level 1–5 |

**Distance metric:** Cosine similarity
**Index:** HNSW (default)
**Dimension:** 768 (nomic-embed-text) — configurable via `EMBEDDING_DIM` env var

---

## Graph Data Model

The graph is computed on-the-fly from PostgreSQL relationships:

### Nodes
Derived from `knowledge_entries`. Each entry becomes a graph node.

| Property | Source |
|----------|--------|
| `id` | `knowledge_entries.id` |
| `label` | `knowledge_entries.title` |
| `knowledge_type` | `knowledge_entries.knowledge_type` |
| `skill_level` | `knowledge_entries.skill_level` |
| `tags` | `knowledge_entries.tags` |
| `mitre_techniques` | `knowledge_entries.mitre_techniques` |

### Edges
Derived from array relationship columns:

| Relationship | Source Column | Edge Type |
|-------------|---------------|-----------|
| A depends on B | `knowledge_entries.dependencies` | `dependency` |
| A relates to B | `knowledge_entries.related_techniques` | `related` |
| A uses MITRE technique T | `knowledge_entries.mitre_techniques` | `mitre_chain` |
