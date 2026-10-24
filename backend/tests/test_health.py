"""
BookLeaf Publishing - Health Endpoint Tests
"""

def test_health_check_endpoint(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert data["service"] == "BookLeaf Publishing API"
    assert "integrations" in data
    assert "groq_model" in data["integrations"]
