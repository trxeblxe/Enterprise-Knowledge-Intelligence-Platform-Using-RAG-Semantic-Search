from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import uuid4

class DocumentMetadata(BaseModel):
    doc_id: str
    filename: str
    file_type: str
    chunk_index: int
    total_chunks: int
    upload_time: str
    source_page: Optional[int] = None

class DocumentInfo(BaseModel):
    doc_id: str
    filename: str
    file_type: str
    total_chunks: int
    upload_time: str
    status: str = "indexed"

class UploadResponse(BaseModel):
    success: bool
    doc_id: str
    filename: str
    chunks_created: int
    message: str

class DocumentListResponse(BaseModel):
    documents: List[DocumentInfo]
    total: int

class DeleteResponse(BaseModel):
    success: bool
    message: str

class QueryRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=2000)
    top_k: Optional[int] = Field(None, ge=1, le=20)
    filter_doc_id: Optional[str] = None

class SourceCitation(BaseModel):
    doc_id: str
    filename: str
    chunk_index: int
    relevance_score: float
    excerpt: str
    page_number: Optional[int] = None

class QueryResponse(BaseModel):
    query_id: str = Field(default_factory=lambda: str(uuid4()))
    question: str
    answer: str
    sources: List[SourceCitation]
    total_sources_found: int
    model_used: str
    processing_time_ms: float

class HealthResponse(BaseModel):
    status: str
    vector_store_loaded: bool
    total_documents: int
    total_chunks: int
    embedding_model: str
    llm_provider: str
    llm_model: str
