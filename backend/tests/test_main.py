"""
Campus Recover — System Health & Root Endpoint Tests
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Verify root endpoint returns API info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "CampusRecover"
    assert "version" in data
    assert data["health"] == "/health"


def test_health_check_endpoint():
    """Verify health check endpoint returns 200 and healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "CampusRecover"
    assert "timestamp" in data
