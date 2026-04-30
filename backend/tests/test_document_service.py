"""
Unit tests for DocumentService — the core document ingestion pipeline.

We test text extraction for each supported format (TXT, PDF, DOCX),
the chunking strategy, and the end-to-end ingest flow.
"""

import pytest
from app.services.document_service import DocumentService
from app.services.vector_store_service import VectorStoreService


@pytest.fixture()
def vector_store(tmp_vector_dir, monkeypatch):
    """Create a VectorStoreService backed by a temp directory."""
    monkeypatch.setattr(
        "app.services.vector_store_service.settings",
        type("S", (), {"embedding_model": "test", "vector_store_path": tmp_vector_dir})(),
    )
    # Force the OfflineHashEmbedder fallback (no model download)
    vs = VectorStoreService.__new__(VectorStoreService)
    from app.services.vector_store_service import OfflineHashEmbedder
    import faiss

    vs.embedder = OfflineHashEmbedder()
    vs.dimension = vs.embedder.get_sentence_embedding_dimension()
    vs.index = faiss.IndexFlatIP(vs.dimension)
    vs._metadata = {}
    vs._next_id = 0
    return vs


@pytest.fixture()
def doc_service(vector_store):
    """Create a DocumentService wrapping the test vector store."""
    return DocumentService(vector_store)


# ── TXT parsing ──────────────────────────────────────────────────────

class TestTxtParsing:
    def test_parse_plain_text(self, doc_service):
        """Plain UTF-8 text should return a single (text, page=1) tuple."""
        content = b"Sony WH-1000XM5 is a premium noise-cancelling headphone."
        pages = doc_service._parse_txt(content)
        assert len(pages) == 1
        assert pages[0][1] == 1  # page number
        assert "WH-1000XM5" in pages[0][0]

    def test_parse_empty_text(self, doc_service):
        """Empty files should return an empty list (no crash)."""
        pages = doc_service._parse_txt(b"")
        assert pages == []

    def test_parse_latin1_text(self, doc_service):
        """Latin-1 encoded text should be decoded gracefully."""
        # \xe9 = 'é' in latin-1
        content = b"Caf\xe9 au lait"
        pages = doc_service._parse_txt(content)
        assert len(pages) == 1


# ── Chunking strategy ────────────────────────────────────────────────

class TestChunking:
    def test_short_text_single_chunk(self, doc_service):
        """Short text (< chunk_size) should produce exactly 1 chunk."""
        pages = [("Short document text.", 1)]
        chunks = doc_service._chunk_pages(pages)
        assert len(chunks) == 1
        assert chunks[0][1] == 1  # preserves page number

    def test_long_text_multiple_chunks(self, doc_service):
        """Text longer than chunk_size should be split into multiple chunks."""
        long_text = "word " * 500  # ~2500 chars, default chunk_size=1000
        pages = [(long_text, 1)]
        chunks = doc_service._chunk_pages(pages)
        assert len(chunks) > 1


# ── End-to-end ingestion ─────────────────────────────────────────────

class TestIngestion:
    @pytest.mark.asyncio
    async def test_ingest_txt_document(self, doc_service, vector_store):
        """Full ingest pipeline: bytes → parse → chunk → embed → store."""
        content = b"Sony headphones are great for music and calls."
        result = await doc_service.ingest_document(content, "test.txt")

        assert result.success is True
        assert result.chunks_created >= 1
        assert result.filename == "test.txt"

        # Verify the vector store received the chunks
        stats = vector_store.get_stats()
        assert stats["total_chunks"] >= 1
        assert stats["total_documents"] >= 1

    @pytest.mark.asyncio
    async def test_ingest_empty_returns_failure(self, doc_service):
        """Ingesting an empty file should return success=False."""
        result = await doc_service.ingest_document(b"", "empty.txt")
        assert result.success is False

    @pytest.mark.asyncio
    async def test_delete_document(self, doc_service, vector_store):
        """Documents can be deleted after ingestion."""
        result = await doc_service.ingest_document(b"Some content", "deleteme.txt")
        assert result.success is True

        deleted = doc_service.delete_document(result.doc_id)
        assert deleted is True

        stats = vector_store.get_stats()
        assert stats["total_chunks"] == 0


# ── File extension detection ─────────────────────────────────────────

class TestFileExtension:
    """Tests the extension detection used by the documents API router."""

    def test_pdf_extension(self):
        from app.api.documents import _get_extension
        assert _get_extension("report.pdf") == "pdf"

    def test_docx_extension(self):
        from app.api.documents import _get_extension
        assert _get_extension("notes.docx") == "docx"

    def test_no_extension(self):
        from app.api.documents import _get_extension
        assert _get_extension("README") == ""

    def test_uppercase_extension(self):
        from app.api.documents import _get_extension
        assert _get_extension("FILE.TXT") == "txt"
