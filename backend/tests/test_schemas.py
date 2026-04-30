"""
Unit tests for Pydantic schemas defined in app.models.schemas.

These tests validate that our API request/response models enforce
the constraints we expect (min_length, max_length, required fields, etc.)
"""

import pytest
from pydantic import ValidationError
from app.models.schemas import (
    QueryRequest,
    QueryResponse,
    SourceCitation,
    UploadResponse,
    DocumentMetadata,
    DocumentInfo,
    HealthResponse,
)


# ── QueryRequest validation ─────────────────────────────────────────

class TestQueryRequest:
    """Validates the QueryRequest schema used by POST /api/v1/query/."""

    def test_valid_request(self):
        req = QueryRequest(question="What are the best Sony headphones?")
        assert req.question == "What are the best Sony headphones?"
        assert req.top_k is None  # optional, defaults to None
        assert req.filter_doc_id is None

    def test_question_too_short(self):
        """Questions shorter than 3 characters should be rejected."""
        with pytest.raises(ValidationError):
            QueryRequest(question="ab")

    def test_question_at_minimum_length(self):
        req = QueryRequest(question="abc")
        assert req.question == "abc"

    def test_optional_top_k(self):
        req = QueryRequest(question="noise cancelling", top_k=10)
        assert req.top_k == 10

    def test_top_k_out_of_range(self):
        """top_k must be between 1 and 20."""
        with pytest.raises(ValidationError):
            QueryRequest(question="test query", top_k=0)
        with pytest.raises(ValidationError):
            QueryRequest(question="test query", top_k=25)

    def test_filter_doc_id(self):
        req = QueryRequest(question="test", filter_doc_id="abc-123")
        assert req.filter_doc_id == "abc-123"


# ── SourceCitation ───────────────────────────────────────────────────

class TestSourceCitation:
    def test_valid_citation(self):
        cite = SourceCitation(
            doc_id="doc-1",
            filename="manual.pdf",
            chunk_index=0,
            relevance_score=87.5,
            excerpt="This is a test excerpt.",
            page_number=3,
        )
        assert cite.filename == "manual.pdf"
        assert cite.relevance_score == 87.5

    def test_page_number_optional(self):
        cite = SourceCitation(
            doc_id="doc-1",
            filename="notes.txt",
            chunk_index=1,
            relevance_score=50.0,
            excerpt="Some text",
        )
        assert cite.page_number is None


# ── UploadResponse ───────────────────────────────────────────────────

class TestUploadResponse:
    def test_success_response(self):
        resp = UploadResponse(
            success=True,
            doc_id="123",
            filename="report.pdf",
            chunks_created=12,
            message="OK",
        )
        assert resp.success is True
        assert resp.chunks_created == 12

    def test_failure_response(self):
        resp = UploadResponse(
            success=False,
            doc_id="456",
            filename="empty.txt",
            chunks_created=0,
            message="No text extracted.",
        )
        assert resp.success is False


# ── DocumentMetadata ─────────────────────────────────────────────────

class TestDocumentMetadata:
    def test_valid_metadata(self):
        meta = DocumentMetadata(
            doc_id="d1",
            filename="file.txt",
            file_type="txt",
            chunk_index=0,
            total_chunks=5,
            upload_time="2026-01-01T00:00:00",
        )
        assert meta.file_type == "txt"
        assert meta.source_page is None  # optional


# ── HealthResponse ───────────────────────────────────────────────────

class TestHealthResponse:
    def test_health_response(self):
        hr = HealthResponse(
            status="ok",
            vector_store_loaded=True,
            total_documents=2,
            total_chunks=40,
            embedding_model="all-MiniLM-L6-v2",
            llm_provider="gemini",
            llm_model="gemini-1.5-flash",
        )
        assert hr.status == "ok"
        assert hr.total_documents == 2
