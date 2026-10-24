"""
BookLeaf Publishing - Authentication and RBAC Tests
"""

def test_missing_authentication_header(client):
    res = client.get("/api/v1/me")
    assert res.status_code == 401
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "AUTHENTICATION_REQUIRED"

def test_invalid_bearer_token(client):
    res = client.get("/api/v1/me", headers={"Authorization": "Bearer invalid-token-xyz"})
    assert res.status_code == 401
    data = res.get_json()
    assert data["success"] is False

def test_valid_author_authentication(client, author1_headers):
    res = client.get("/api/v1/me", headers=author1_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["role"] == "author"

def test_author_access_to_admin_route_forbidden(client, author1_headers):
    # Author attempting to access admin dashboard
    res = client.get("/api/v1/admin/dashboard", headers=author1_headers)
    assert res.status_code == 403
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "FORBIDDEN"

def test_admin_access_to_admin_route_allowed(client, admin_headers):
    res = client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "total_tickets" in data["data"]
