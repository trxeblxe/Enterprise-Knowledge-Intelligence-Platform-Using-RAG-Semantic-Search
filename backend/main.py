import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.services.vector_store_service import VectorStoreService
from app.services.document_service import DocumentService
from app.services.rag_service import RAGService
from app.api.documents import router as documents_router
from app.api.query import router as query_router

settings = get_settings()
logger = logging.getLogger("uvicorn")

# Catalog file to auto-ingest on first startup
CATALOG_FILE = os.path.join(os.path.dirname(__file__), "sony_headphones_catalog.txt")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing Enterprise Knowledge Intelligence Platform...")
    
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(settings.vector_store_path, exist_ok=True)
    
    vector_store = VectorStoreService()
    app.state.vector_store = vector_store
    
    document_service = DocumentService(vector_store)
    app.state.document_service = document_service
    
    rag_service = RAGService(vector_store)
    app.state.rag_service = rag_service
    
    stats = vector_store.get_stats()
    logger.info(f"Loaded {stats['total_chunks']} chunks from {stats['total_documents']} documents.")
    logger.info(f"LLM Provider: {settings.llm_provider}, Model: {settings.llm_model}")
    
    # Auto-ingest the built-in catalog if no documents are indexed yet
    if stats["total_chunks"] == 0 and os.path.exists(CATALOG_FILE):
        logger.info("No documents found — auto-ingesting sony_headphones_catalog.txt ...")
        try:
            with open(CATALOG_FILE, "rb") as f:
                file_bytes = f.read()
            result = await document_service.ingest_document(file_bytes, "sony_headphones_catalog.txt")
            if result.success:
                logger.info(f"Auto-ingested catalog: {result.chunks_created} chunks created.")
            else:
                logger.warning(f"Auto-ingest failed: {result.message}")
        except Exception as exc:
            logger.error(f"Error during auto-ingest: {exc}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Platform...")


app = FastAPI(
    title="Sony Enterprise Intelligence",
    description="RAG & Semantic Search over Sony Corporate Documents",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router, prefix="/api/v1")
app.include_router(query_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {
        "name": "Sony Enterprise Intelligence",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_url": "/api/v1/query/health"
    }

@app.get("/api/v1/ping")
def ping():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
