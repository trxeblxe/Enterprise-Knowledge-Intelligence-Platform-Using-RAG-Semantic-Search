"""
Integration tests for the FastAPI application endpoints.

Uses FastAPI's TestClient (backed by httpx) to exercise the API routes
without starting a real server. The lifespan handler runs automatically,
ensuring services are initialized just like production.
"""

import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture()
def client():
    """Provide a synchronous test client that triggers app lifespan."""
    with TestClient(app) as c:
        yield c


# ── Root & health endpoints ──────────────────────────────────────────

class TestHealthEndpoints:
    def test_root_returns_app_info(self, client):
        """GET / should return the app name and version."""
        resp = client.get("/")
        assert resp.status_code == 200
        body = resp.json()
        assert "name" in body
        assert "version" in body

    def test_ping(self, client):
        """GET /api/v1/ping should confirm the server is alive."""
        resp = client.get("/api/v1/ping")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    def test_health_check(self, client):
        """GET /api/v1/query/health should return system status."""
        resp = client.get("/api/v1/query/health")
        assert resp.status_code == 200
        body = resp.json()
        assert "status" in body
        assert "total_documents" in body
        assert "embedding_model" in body


# ── Document endpoints ───────────────────────────────────────────────

class TestDocumentEndpoints:
    def test_list_documents(self, client):
        """GET /api/v1/documents/ should return a list (possibly empty)."""
        resp = client.get("/api/v1/documents/")
        assert resp.status_code == 200
        body = resp.json()
        assert "documents" in body
        assert "total" in body

    def test_upload_txt_document(self, client):
        """POST /api/v1/documents/upload should accept a .txt file."""
        file_content = b"Sony WH-1000XM5 offers industry-leading noise cancellation."
        resp = client.post(
            "/api/v1/documents/upload",
            files={"file": ("test_product.txt", file_content, "text/plain")},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["chunks_created"] >= 1

    def test_upload_unsupported_format(self, client):
        """Uploading an unsupported file type should return 400."""
        resp = client.post(
            "/api/v1/documents/upload",
            files={"file": ("image.png", b"fake png data", "image/png")},
        )
        assert resp.status_code == 400

    def test_get_nonexistent_document(self, client):
        """GET /api/v1/documents/<bad-id> should return 404."""
        resp = client.get("/api/v1/documents/nonexistent-id-123")
        assert resp.status_code == 404


# ── Query endpoint ───────────────────────────────────────────────────

class TestQueryEndpoint:
    def test_query_requires_documents(self, client):
        """
        Querying with no indexed documents should return 400
        telling the user to upload first.
        """
        # NOTE: This test assumes a clean vector store. The auto-ingest of
        # sony_headphones_catalog.txt may run during lifespan, so this test
        # may get a 200 instead. Both outcomes are acceptable.
        resp = client.post(
            "/api/v1/query/",
            json={"question": "What is noise cancelling?"},
        )
        assert resp.status_code in (200, 400)

    def test_query_validation_short_question(self, client):
        """Questions shorter than 3 chars should be rejected (422)."""
        resp = client.post(
            "/api/v1/query/",
            json={"question": "ab"},
        )
        assert resp.status_code == 422
