"""
Unit tests for VectorStoreService — the FAISS-backed vector search engine.

Uses the OfflineHashEmbedder fallback so no model download is needed,
making these tests fast and CI-friendly.
"""

import pytest
import faiss
from app.services.vector_store_service import VectorStoreService, OfflineHashEmbedder


@pytest.fixture()
def store():
    """Build a fresh VectorStoreService using the hash-based embedder."""
    vs = VectorStoreService.__new__(VectorStoreService)
    vs.embedder = OfflineHashEmbedder()
    vs.dimension = vs.embedder.get_sentence_embedding_dimension()
    vs.index = faiss.IndexFlatIP(vs.dimension)
    vs._metadata = {}
    vs._next_id = 0
    return vs


# ── Basic add & search ───────────────────────────────────────────────

class TestAddAndSearch:
    def test_add_single_document(self, store):
        """Adding one document should increase total_chunks to 1."""
        store.add_documents(
            ["Sony WH-1000XM5 headphones"],
            [{"doc_id": "d1", "filename": "catalog.txt", "text": "Sony WH-1000XM5 headphones"}],
        )
        stats = store.get_stats()
        assert stats["total_chunks"] == 1
        assert stats["total_documents"] == 1

    def test_add_multiple_documents(self, store):
        """Adding multiple chunks should be reflected in stats."""
        texts = ["chunk one", "chunk two", "chunk three"]
        metas = [
            {"doc_id": "d1", "filename": "a.txt", "text": t}
            for t in texts
        ]
        store.add_documents(texts, metas)
        stats = store.get_stats()
        assert stats["total_chunks"] == 3

    def test_similarity_search_returns_results(self, store):
        """Search should return relevant chunks sorted by score."""
        store.add_documents(
            ["noise cancelling headphones", "wireless earbuds", "wired speakers"],
            [
                {"doc_id": "d1", "filename": "a.txt", "text": "noise cancelling headphones"},
                {"doc_id": "d1", "filename": "a.txt", "text": "wireless earbuds"},
                {"doc_id": "d2", "filename": "b.txt", "text": "wired speakers"},
            ],
        )
        results = store.similarity_search("noise cancelling", top_k=2)
        assert len(results) == 2
        # Each result should have a score
        assert "score" in results[0]

    def test_search_empty_store_returns_empty(self, store):
        """Searching an empty index should return an empty list, not crash."""
        results = store.similarity_search("anything", top_k=5)
        assert results == []


# ── Filter by doc_id ─────────────────────────────────────────────────

class TestFilterSearch:
    def test_filter_by_doc_id(self, store):
        """Results should only include chunks from the specified doc_id."""
        store.add_documents(
            ["apple fruit", "apple computer"],
            [
                {"doc_id": "fruit", "filename": "fruits.txt", "text": "apple fruit"},
                {"doc_id": "tech", "filename": "tech.txt", "text": "apple computer"},
            ],
        )
        results = store.similarity_search("apple", top_k=5, filter_doc_id="fruit")
        assert all(r["doc_id"] == "fruit" for r in results)


# ── Deletion ─────────────────────────────────────────────────────────

class TestDeletion:
    def test_delete_removes_chunks(self, store):
        """Deleting a doc_id should remove all its chunks from the index."""
        store.add_documents(
            ["chunk a", "chunk b"],
            [
                {"doc_id": "d1", "filename": "a.txt", "text": "chunk a"},
                {"doc_id": "d1", "filename": "a.txt", "text": "chunk b"},
            ],
        )
        deleted = store.delete_by_doc_id("d1")
        assert deleted == 2
        assert store.get_stats()["total_chunks"] == 0

    def test_delete_nonexistent_doc(self, store):
        """Deleting a non-existent doc_id should return 0."""
        deleted = store.delete_by_doc_id("does-not-exist")
        assert deleted == 0

    def test_delete_preserves_other_docs(self, store):
        """Deleting one doc should leave other docs intact."""
        store.add_documents(
            ["doc1 chunk", "doc2 chunk"],
            [
                {"doc_id": "d1", "filename": "a.txt", "text": "doc1 chunk"},
                {"doc_id": "d2", "filename": "b.txt", "text": "doc2 chunk"},
            ],
        )
        store.delete_by_doc_id("d1")
        stats = store.get_stats()
        assert stats["total_chunks"] == 1
        assert stats["total_documents"] == 1


# ── Stats ────────────────────────────────────────────────────────────

class TestStats:
    def test_stats_empty(self, store):
        stats = store.get_stats()
        assert stats["total_chunks"] == 0
        assert stats["total_documents"] == 0
        assert stats["dimension"] == 384

    def test_stats_after_adds(self, store):
        store.add_documents(
            ["a", "b"],
            [
                {"doc_id": "d1", "filename": "x.txt", "text": "a"},
                {"doc_id": "d2", "filename": "y.txt", "text": "b"},
            ],
        )
        stats = store.get_stats()
        assert stats["total_chunks"] == 2
        assert stats["total_documents"] == 2


# ── OfflineHashEmbedder ─────────────────────────────────────────────

class TestOfflineHashEmbedder:
    """Verify the deterministic hash-based embedder used as a fallback."""

    def test_dimension(self):
        emb = OfflineHashEmbedder()
        assert emb.get_sentence_embedding_dimension() == 384

    def test_deterministic(self):
        """Same input should always produce the same vector."""
        emb = OfflineHashEmbedder()
        v1 = emb.encode(["hello world"])
        v2 = emb.encode(["hello world"])
        assert (v1 == v2).all()

    def test_different_inputs_differ(self):
        """Different inputs should produce different vectors."""
        emb = OfflineHashEmbedder()
        v1 = emb.encode(["hello"])
        v2 = emb.encode(["world"])
        assert not (v1 == v2).all()
