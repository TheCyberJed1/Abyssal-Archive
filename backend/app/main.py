from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.routers import archivist, graph, ingest, knowledge
from app.core.export import export_all


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown (nothing to clean up)


app = FastAPI(
    title=settings.APP_NAME,
    description="Offensive Security Knowledge Operating System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(knowledge.router, prefix=settings.API_PREFIX)
app.include_router(graph.router, prefix=settings.API_PREFIX)
app.include_router(archivist.router, prefix=settings.API_PREFIX)
app.include_router(ingest.router, prefix=settings.API_PREFIX)


@app.get(f"{settings.API_PREFIX}/export/ndjson")
async def export_ndjson(request: Any = None):
    """Export all knowledge entries as NDJSON."""
    from starlette.requests import Request
    return await export_all(request)


@app.get(f"{settings.API_PREFIX}/health")
async def health():
    return {"status": "operational", "system": settings.APP_NAME}


@app.get("/")
async def root():
    return {
        "system": settings.APP_NAME,
        "status": "ONLINE",
        "message": "The Archive is open. Knowledge is power.",
    }
