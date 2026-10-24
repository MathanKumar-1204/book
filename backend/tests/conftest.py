"""
BookLeaf Publishing - Pytest Configuration & Test Fixtures
"""

import os
import sys
import pytest

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import create_app
from app.services.supabase_service import supabase_service

@pytest.fixture(scope="session")
def app():
    app = create_app()
    app.config["TESTING"] = True
    return app

@pytest.fixture(scope="session")
def client(app):
    return app.test_client()

@pytest.fixture(scope="session")
def author1_id():
    return "00000000-0000-0000-0000-000000000002"

@pytest.fixture(scope="session")
def author2_id():
    return "00000000-0000-0000-0000-000000000003"

@pytest.fixture(scope="session")
def admin_id():
    return "00000000-0000-0000-0000-000000000001"

@pytest.fixture(scope="session")
def author1_headers(author1_id):
    return {"Authorization": f"Bearer demo-author-{author1_id}"}

@pytest.fixture(scope="session")
def author2_headers(author2_id):
    return {"Authorization": f"Bearer demo-author-{author2_id}"}

@pytest.fixture(scope="session")
def admin_headers():
    return {"Authorization": "Bearer demo-admin"}
