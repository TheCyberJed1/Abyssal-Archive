# Abyssal Archive

> **CLASSIFIED // LOCAL DEPLOYMENT ONLY**
> Offensive Security Knowledge Operating System for Red Teams, Pentesters, and Bug Bounty Hunters.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        ABYSSAL ARCHIVE                          │
│                   Offensive Security KOS                        │
├──────────────┬──────────────────────────┬───────────────────────┤
│   Frontend   │        Backend           │     Data Layer        │
│  React +     │       FastAPI            │  PostgreSQL (rel.)    │
│  Tailwind    │  (Python 3.12)           │  Qdrant (vector)      │
│  Cytoscape   │                          │  Ollama (LLM)         │
│  Port: 5173  │     Port: 8000           │  Ports: 5432/6333/    │
│  (dev)       │                          │         11434         │
└──────────────┴──────────────────────────┴───────────────────────┘
```

## Folder Structure

```
abyssal-archive/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + lifespan
│   │   ├── config.py            # Settings via pydantic-settings
│   │   ├── database.py          # Async SQLAlchemy + init_db
│   │   ├── models/
│   │   │   └── knowledge.py     # KnowledgeEntry, IngestJob ORM models
│   │   ├── schemas/
│   │   │   └── knowledge.py     # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── knowledge.py     # CRUD + semantic search
│   │   │   ├── graph.py         # Graph data endpoints
│   │   │   ├── archivist.py     # AI assistant endpoints
│   │   │   └── ingest.py        # Automated ingestion pipeline
│   │   ├── services/
│   │   │   ├── llm_service.py   # Ollama integration
│   │   │   ├── vector_service.py# Qdrant integration
│   │   │   └── ingest_service.py# Content fetch + parse + structure
│   │   └── core/
│   │       └── export.py        # NDJSON export streaming
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar, TopBar, Layout
│   │   │   ├── knowledge/       # KnowledgeCard, List, Editor
│   │   │   ├── graph/           # Cytoscape.js graph
│   │   │   └── archivist/       # AI chat panel
│   │   ├── pages/               # Dashboard, Knowledge, Graph, Archivist, Ingest
│   │   ├── api/client.js        # Axios API client
│   │   ├── App.jsx              # Routes
│   │   └── index.css            # Dark cyberpunk theme
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
├── docs/
│   └── schema.md                # Database schema reference
├── docker-compose.yml
├── .env.example
└── README.md
```

## Quick Start

### Prerequisites
- Docker + Docker Compose
- (Optional) Ollama installed locally for GPU inference

### 1. Clone & Configure

```bash
git clone https://github.com/TheCyberJed1/Abyssal-Archive.git
cd Abyssal-Archive
cp .env.example .env
# Edit .env if needed (defaults are fine for local use)
```

### 2. Start Services

```bash
docker-compose up -d
```

### 3. Pull Ollama Models

```bash
# Pull LLM for AI assistant
docker exec abyssal_ollama ollama pull llama3

# Pull embedding model for semantic search
docker exec abyssal_ollama ollama pull nomic-embed-text
```

### 4. Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Qdrant UI | http://localhost:6333/dashboard |

---

## Development Mode

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start PostgreSQL + Qdrant + Ollama via Docker
docker-compose up postgres qdrant ollama -d

# Run backend dev server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## API Endpoints

### Knowledge Base
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/knowledge/` | List entries (paginated, filterable) |
| POST | `/api/v1/knowledge/` | Create new entry |
| GET | `/api/v1/knowledge/{id}` | Get entry by ID |
| PATCH | `/api/v1/knowledge/{id}` | Update entry |
| DELETE | `/api/v1/knowledge/{id}` | Delete entry |
| POST | `/api/v1/knowledge/search/semantic` | Semantic vector search |

### Graph
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/graph/` | Full knowledge graph |
| GET | `/api/v1/graph/entry/{id}` | Subgraph around entry |
| GET | `/api/v1/graph/mitre` | MITRE ATT&CK coverage graph |

### The Archivist (AI)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/archivist/chat` | Chat with AI assistant |
| POST | `/api/v1/archivist/auto-tag` | Auto-extract tags + MITRE |
| POST | `/api/v1/archivist/skill-gap` | Skill gap analysis |
| POST | `/api/v1/archivist/convert` | Convert raw notes → structured entry |

### Ingest Pipeline
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/ingest/` | Submit URL or text for ingestion |
| GET | `/api/v1/ingest/jobs` | List all ingest jobs |
| GET | `/api/v1/ingest/jobs/{id}` | Get job status |

### Export
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/export/ndjson` | Export all entries as NDJSON |

---

## Knowledge Types

| Type | Description |
|------|-------------|
| `recon` | Reconnaissance techniques and notes |
| `exploit` | Exploitation techniques and PoCs |
| `post-exploitation` | Post-compromise tactics |
| `tool` | Tools and utilities |
| `payload` | Payloads and shellcode |
| `writeup` | CTF/bug bounty writeups |
| `poc` | Proof of concept code |
| `zero-day` | 0-day research |
| `case-study` | Real-world case studies |
| `mitre-technique` | MITRE ATT&CK technique documentation |

---

## Database Schema

See [`docs/schema.md`](docs/schema.md) for the complete database schema.

---

## Security Notes

- **Zero authentication** — designed for local, air-gapped use only
- **No telemetry** — all data stays on your machine
- **No cloud dependencies** — LLM inference via local Ollama
- Do NOT expose this system to the internet

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | FastAPI (Python 3.12) |
| Frontend | React 18 + Tailwind CSS v3 |
| Graph Viz | Cytoscape.js |
| Relational DB | PostgreSQL 16 |
| Vector DB | Qdrant |
| LLM Runtime | Ollama |
| Async ORM | SQLAlchemy 2.0 (asyncpg) |
| Containerization | Docker Compose |

---

*The Archive is always watching. Knowledge is the weapon.*
