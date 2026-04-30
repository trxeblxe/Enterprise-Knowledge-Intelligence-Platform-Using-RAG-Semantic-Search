"""
Shared pytest fixtures for the Enterprise Knowledge Intelligence Platform tests.

We override the vector store path and upload dir to use temp directories
so that tests never pollute the real data folders.
"""

import os
import sys
import tempfile
import pytest

# Ensure the backend root is on sys.path so `app.*` imports resolve correctly.
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Set environment variables BEFORE any app code is imported so that
# pydantic-settings picks up isolated paths.
_tmp = tempfile.mkdtemp(prefix="ekip_test_")
os.environ.setdefault("VECTOR_STORE_PATH", os.path.join(_tmp, "vector_store"))
os.environ.setdefault("UPLOAD_DIR", os.path.join(_tmp, "uploads"))
os.environ.setdefault("LLM_PROVIDER", "gemini")
os.environ.setdefault("GEMINI_API_KEY", "test-key-not-real")


@pytest.fixture()
def tmp_vector_dir(tmp_path):
    """Return a fresh temporary directory for vector store tests."""
    d = tmp_path / "vector_store"
    d.mkdir()
    return str(d)


@pytest.fixture()
def tmp_upload_dir(tmp_path):
    """Return a fresh temporary directory for upload tests."""
    d = tmp_path / "uploads"
    d.mkdir()
    return str(d)
