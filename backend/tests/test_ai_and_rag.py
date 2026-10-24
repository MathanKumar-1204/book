"""
BookLeaf Publishing - AI Classification, Pinecone RAG & Graceful Fallback Tests
"""

from app.constants import TICKET_CATEGORIES, TICKET_PRIORITIES
from app.services.ai_service import ai_service
from app.services.rag_service import rag_service

def test_deterministic_ai_classification_fallback():
    # 1. Royalty Query
    res1 = ai_service._classify_deterministic_fallback(
        "Missing royalty payment for 6 months",
        "I published my book but have not received any payout."
    )
    assert res1["category"] == "Royalty & Payments"
    assert res1["priority"] in TICKET_PRIORITIES
    assert res1["category"] in TICKET_CATEGORIES

    # 2. ISBN Query
    res2 = ai_service._classify_deterministic_fallback(
        "ISBN mismatch on Amazon listing",
        "The ISBN shown on Amazon does not match the physical copy."
    )
    assert res2["category"] == "ISBN & Metadata Issues"
    assert res2["priority"] == "High"

    # 3. Print Defect Query
    res3 = ai_service._classify_deterministic_fallback(
        "Received damaged author copies with binding defects",
        "The cover is misaligned and several pages are blurry."
    )
    assert res3["category"] == "Printing & Quality"

    # 4. Distribution Query
    res4 = ai_service._classify_deterministic_fallback(
        "Book showing currently unavailable on Amazon",
        "My book is published but shows out of stock."
    )
    assert res4["category"] == "Distribution & Availability"

def test_rag_service_retrieval_and_fallback():
    # Retrieval for royalty query
    chunks = rag_service.retrieve_relevant_chunks("quarterly royalty payout calculation 80 20 split")
    assert len(chunks) > 0
    top_chunk = chunks[0]
    assert "content" in top_chunk
    assert "source" in top_chunk
    assert top_chunk["score"] > 0

    # Ensure royalty policy is retrieved
    has_royalty = any("80/20" in c["content"] or "royalty" in c["content"].lower() for c in chunks)
    assert has_royalty is True

def test_ai_draft_response_grounding(client, author1_headers, admin_headers):
    # Create ticket
    res = client.post("/api/v1/me/tickets", json={
        "subject": "Royalty calculation question",
        "description": "How is the 80% net profit calculated for my copies?",
    }, headers=author1_headers)
    ticket_id = res.get_json()["data"]["id"]

    # Generate draft response
    draft_res = client.post(f"/api/v1/admin/tickets/{ticket_id}/ai-draft", headers=admin_headers)
    assert draft_res.status_code == 200
    data = draft_res.get_json()["data"]
    assert "draft_response" in data
    assert len(data["draft_response"]) > 20
    assert "retrieved_excerpts" in data
    assert len(data["retrieved_excerpts"]) > 0

def test_admin_can_override_ai_classification(client, author1_headers, admin_headers):
    create_res = client.post("/api/v1/me/tickets", json={
        "subject": "General Query",
        "description": "General question about publishing process.",
    }, headers=author1_headers)
    ticket_id = create_res.get_json()["data"]["id"]

    # Admin overrides category and priority
    override_res = client.patch(f"/api/v1/admin/tickets/{ticket_id}", json={
        "category": "Royalty & Payments",
        "priority": "Critical"
    }, headers=admin_headers)
    assert override_res.status_code == 200
    updated = override_res.get_json()["data"]
    assert updated["category"] == "Royalty & Payments"
    assert updated["priority"] == "Critical"
    assert updated["admin_override"] is True
