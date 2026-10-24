"""
BookLeaf Publishing - Author Data Isolation & Internal Notes Security Tests
"""

def test_author_can_view_only_own_books(client, author1_headers, author2_headers):
    res1 = client.get("/api/v1/me/books", headers=author1_headers)
    assert res1.status_code == 200
    books1 = res1.get_json()["data"]
    assert len(books1) > 0
    book_ids_1 = [b["id"] for b in books1]

    # Author 2 books
    res2 = client.get("/api/v1/me/books", headers=author2_headers)
    assert res2.status_code == 200
    books2 = res2.get_json()["data"]
    assert len(books2) > 0
    book_ids_2 = [b["id"] for b in books2]

    # Ensure completely disjoint sets
    assert set(book_ids_1).isdisjoint(set(book_ids_2))

def test_author_cannot_access_another_authors_book_detail(client, author1_headers, author2_headers):
    # Fetch author 2's book
    res2 = client.get("/api/v1/me/books", headers=author2_headers)
    author2_book_id = res2.get_json()["data"][0]["id"]

    # Author 1 attempts to access author 2's book directly
    res = client.get(f"/api/v1/me/books/{author2_book_id}", headers=author1_headers)
    assert res.status_code == 403
    assert res.get_json()["error"]["code"] == "FORBIDDEN"

def test_author_cannot_create_ticket_for_another_authors_book(client, author1_headers, author2_headers):
    res2 = client.get("/api/v1/me/books", headers=author2_headers)
    author2_book_id = res2.get_json()["data"][0]["id"]

    payload = {
        "subject": "Inquiry about unauthorized book",
        "description": "Attempting to create ticket for another author book.",
        "book_id": author2_book_id,
    }
    res = client.post("/api/v1/me/tickets", json=payload, headers=author1_headers)
    assert res.status_code == 403
    assert res.get_json()["error"]["code"] == "FORBIDDEN"

def test_author_cannot_access_another_authors_ticket(client, author1_headers, author2_headers):
    # Author 1 creates a ticket
    create_payload = {
        "subject": "Author 1 Private Query",
        "description": "This is a private support ticket belonging exclusively to author 1.",
    }
    create_res = client.post("/api/v1/me/tickets", json=create_payload, headers=author1_headers)
    assert create_res.status_code == 201
    ticket_id = create_res.get_json()["data"]["id"]

    # Author 1 can view it
    get_res1 = client.get(f"/api/v1/me/tickets/{ticket_id}", headers=author1_headers)
    assert get_res1.status_code == 200

    # Author 2 attempts to view author 1's ticket
    get_res2 = client.get(f"/api/v1/me/tickets/{ticket_id}", headers=author2_headers)
    assert get_res2.status_code == 403
    assert get_res2.get_json()["error"]["code"] == "FORBIDDEN"

def test_author_never_receives_internal_notes(client, author1_headers, admin_headers):
    # Author creates ticket
    create_res = client.post("/api/v1/me/tickets", json={
        "subject": "Royalty Delay Concern",
        "description": "I have not received my quarterly payout for my book.",
    }, headers=author1_headers)
    assert create_res.status_code == 201
    ticket_id = create_res.get_json()["data"]["id"]

    # Admin adds internal note
    note_res = client.post(f"/api/v1/admin/tickets/{ticket_id}/notes", json={
        "message": "INTERNAL NOTE: Escalate to finance team, do not mention banking issue yet."
    }, headers=admin_headers)
    assert note_res.status_code == 201

    # Admin also sends public reply
    reply_res = client.post(f"/api/v1/admin/tickets/{ticket_id}/messages", json={
        "message": "Dear Author, we are currently checking your royalty payout schedule."
    }, headers=admin_headers)
    assert reply_res.status_code == 201

    # Author views ticket detail
    author_view = client.get(f"/api/v1/me/tickets/{ticket_id}", headers=author1_headers)
    assert author_view.status_code == 200
    messages = author_view.get_json()["data"]["messages"]

    # Assert that NO internal note is present in messages
    for msg in messages:
        assert msg["visibility"] == "public"
        assert "INTERNAL NOTE" not in msg["message"]

    # Admin views ticket detail and CAN see the internal note
    admin_view = client.get(f"/api/v1/admin/tickets/{ticket_id}", headers=admin_headers)
    assert admin_view.status_code == 200
    admin_messages = admin_view.get_json()["data"]["messages"]
    internal_notes = [m for m in admin_messages if m["visibility"] == "internal"]
    assert len(internal_notes) >= 1
    assert "INTERNAL NOTE" in internal_notes[0]["message"]
