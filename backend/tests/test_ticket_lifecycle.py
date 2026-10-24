"""
BookLeaf Publishing - Ticket Lifecycle and Validation Tests
"""

def test_ticket_creation_validation(client, author1_headers):
    # Subject too short
    res = client.post("/api/v1/me/tickets", json={
        "subject": "Hi",
        "description": "Valid description with sufficient characters",
    }, headers=author1_headers)
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "VALIDATION_ERROR"

    # Description too short
    res2 = client.post("/api/v1/me/tickets", json={
        "subject": "Valid Subject Line",
        "description": "Short",
    }, headers=author1_headers)
    assert res2.status_code == 400
    assert res2.get_json()["error"]["code"] == "VALIDATION_ERROR"

def test_status_update_and_invalid_status_rejection(client, author1_headers, admin_headers):
    create_res = client.post("/api/v1/me/tickets", json={
        "subject": "Status Transition Test",
        "description": "Testing ticket status transitions from Open to In Progress to Resolved.",
    }, headers=author1_headers)
    ticket_id = create_res.get_json()["data"]["id"]

    # Invalid status rejection
    invalid_res = client.patch(f"/api/v1/admin/tickets/{ticket_id}", json={
        "status": "NonExistentStatus"
    }, headers=admin_headers)
    assert invalid_res.status_code == 400

    # Valid status update
    valid_res = client.patch(f"/api/v1/admin/tickets/{ticket_id}", json={
        "status": "In Progress"
    }, headers=admin_headers)
    assert valid_res.status_code == 200
    assert valid_res.get_json()["data"]["status"] == "In Progress"

def test_admin_assignment(client, author1_headers, admin_headers, admin_id):
    create_res = client.post("/api/v1/me/tickets", json={
        "subject": "Assignment Test Ticket",
        "description": "Testing assigning this ticket to the operations lead admin.",
    }, headers=author1_headers)
    ticket_id = create_res.get_json()["data"]["id"]

    assign_res = client.post(f"/api/v1/admin/tickets/{ticket_id}/assign", json={
        "admin_id": admin_id
    }, headers=admin_headers)
    assert assign_res.status_code == 200
    assert assign_res.get_json()["data"]["assigned_admin_id"] == admin_id

def test_public_reply_advances_open_status(client, author1_headers, admin_headers):
    create_res = client.post("/api/v1/me/tickets", json={
        "subject": "Auto Status Advance Check",
        "description": "Ticket submitted with Open status awaiting admin response.",
    }, headers=author1_headers)
    ticket = create_res.get_json()["data"]
    ticket_id = ticket["id"]
    assert ticket["status"] == "Open"

    # Admin sends public reply
    reply_res = client.post(f"/api/v1/admin/tickets/{ticket_id}/messages", json={
        "message": "Hello, our team has picked up your request."
    }, headers=admin_headers)
    assert reply_res.status_code == 201

    # Check that ticket status transitioned to In Progress
    updated_ticket_res = client.get(f"/api/v1/admin/tickets/{ticket_id}", headers=admin_headers)
    assert updated_ticket_res.get_json()["data"]["status"] == "In Progress"
