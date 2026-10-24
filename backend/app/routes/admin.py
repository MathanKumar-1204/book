"""
BookLeaf Publishing - Admin Portal API Routes
Protected endpoints strictly restricted to authenticated administrators.
"""

from flask import Blueprint, request, jsonify, g
from app.middleware.authentication import require_auth
from app.middleware.authorization import require_admin
from app.services.supabase_service import supabase_service
from app.services.ticket_service import ticket_service
from app.services.ai_service import ai_service
from app.utils.errors import NotFoundError, ValidationError

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/dashboard", methods=["GET"])
@require_auth
@require_admin
def get_admin_dashboard():
    """Returns aggregated ticket metrics, priority/category breakdowns, and charts data."""
    stats = supabase_service.get_admin_dashboard_stats()
    return jsonify({
        "success": True,
        "data": stats
    }), 200

@admin_bp.route("/tickets", methods=["GET"])
@require_auth
@require_admin
def get_all_tickets():
    """Global ticket queue across all authors with multi-field search and filters."""
    status = request.args.get("status")
    category = request.args.get("category")
    priority = request.args.get("priority")
    search = request.args.get("search")
    sort_by = request.args.get("sort_by", "newest")

    tickets = supabase_service.get_tickets(
        status=status,
        category=category,
        priority=priority,
        search=search,
        sort_by=sort_by
    )

    return jsonify({
        "success": True,
        "data": tickets,
        "total": len(tickets)
    }), 200

@admin_bp.route("/tickets/<ticket_id>", methods=["GET"])
@require_auth
@require_admin
def get_admin_ticket_detail(ticket_id: str):
    """Returns full ticket details including both public replies and private internal notes."""
    ticket = supabase_service.get_ticket_by_id(ticket_id)
    if not ticket:
        raise NotFoundError(f"Ticket with ID '{ticket_id}' was not found.")

    # Admins see BOTH public and internal messages
    messages = supabase_service.get_ticket_messages(ticket_id, is_admin=True)

    return jsonify({
        "success": True,
        "data": {
            **ticket,
            "messages": messages
        }
    }), 200

@admin_bp.route("/tickets/<ticket_id>", methods=["PATCH"])
@require_auth
@require_admin
def update_admin_ticket(ticket_id: str):
    """Admin updates ticket status, overrides category/priority, or reassigns."""
    payload = request.get_json() or {}
    updated = ticket_service.update_ticket_by_admin(ticket_id, g.current_user["id"], payload)
    return jsonify({
        "success": True,
        "data": updated,
        "message": "Ticket updated successfully."
    }), 200

@admin_bp.route("/tickets/<ticket_id>/assign", methods=["POST"])
@require_auth
@require_admin
def assign_ticket(ticket_id: str):
    """Assigns ticket to the current admin or specified admin."""
    payload = request.get_json() or {}
    assignee_id = payload.get("admin_id", g.current_user["id"])

    updated = ticket_service.update_ticket_by_admin(
        ticket_id,
        g.current_user["id"],
        {"assigned_admin_id": assignee_id}
    )

    return jsonify({
        "success": True,
        "data": updated,
        "message": "Ticket assigned successfully."
    }), 200

@admin_bp.route("/tickets/<ticket_id>/messages", methods=["POST"])
@require_auth
@require_admin
def send_admin_reply(ticket_id: str):
    """Admin sends public reply to the author."""
    payload = request.get_json() or {}
    message_text = payload.get("message", "").strip()
    if not message_text:
        raise ValidationError("Reply message cannot be empty.")

    msg = ticket_service.send_public_reply(
        ticket_id=ticket_id,
        sender_id=g.current_user["id"],
        sender_role="admin",
        message=message_text
    )

    # Optional explicit status update
    if payload.get("status"):
        ticket_service.update_ticket_by_admin(ticket_id, g.current_user["id"], {"status": payload["status"]})

    return jsonify({
        "success": True,
        "data": msg,
        "message": "Response sent to author."
    }), 201

@admin_bp.route("/tickets/<ticket_id>/notes", methods=["POST"])
@require_auth
@require_admin
def add_admin_note(ticket_id: str):
    """Admin adds internal note (never disclosed to author)."""
    payload = request.get_json() or {}
    note_text = payload.get("message", "").strip()
    if not note_text:
        raise ValidationError("Internal note content cannot be empty.")

    msg = ticket_service.add_internal_note(
        ticket_id=ticket_id,
        admin_id=g.current_user["id"],
        message=note_text
    )

    return jsonify({
        "success": True,
        "data": msg,
        "message": "Internal note recorded."
    }), 201

@admin_bp.route("/tickets/<ticket_id>/ai-classify", methods=["POST"])
@require_auth
@require_admin
def reclassify_ticket_ai(ticket_id: str):
    """Triggers re-classification and priority scoring via Groq."""
    ticket = supabase_service.get_ticket_by_id(ticket_id)
    if not ticket:
        raise NotFoundError(f"Ticket with ID '{ticket_id}' was not found.")

    book_meta = None
    if ticket.get("book_id"):
        book_meta = supabase_service.get_book_by_id(ticket["book_id"])

    ai_res = ai_service.classify_ticket(
        subject=ticket["subject"],
        description=ticket["description"],
        book_metadata=book_meta,
        ticket_id=ticket_id
    )

    # Save to ticket
    updated = supabase_service.update_ticket(ticket_id, {
        "category": ai_res.get("category"),
        "ai_category": ai_res.get("category"),
        "priority": ai_res.get("priority"),
        "ai_priority": ai_res.get("priority"),
        "ai_reason": ai_res.get("reason"),
        "ai_confidence": ai_res.get("confidence"),
        "ai_status": ai_res.get("ai_status"),
    })

    return jsonify({
        "success": True,
        "data": updated,
        "ai_result": ai_res
    }), 200

@admin_bp.route("/tickets/<ticket_id>/ai-draft", methods=["POST"])
@require_auth
@require_admin
def generate_ai_draft_response(ticket_id: str):
    """Generates Groq AI response draft grounded with Pinecone RAG policy excerpts."""
    draft_data = ticket_service.generate_ai_draft(ticket_id)
    return jsonify({
        "success": True,
        "data": draft_data
    }), 200

@admin_bp.route("/authors", methods=["GET"])
@require_auth
@require_admin
def get_all_authors():
    """Returns list of registered authors for admin reference."""
    authors = supabase_service.get_all_authors()
    return jsonify({
        "success": True,
        "data": authors
    }), 200

@admin_bp.route("/admin-users", methods=["GET"])
@require_auth
@require_admin
def get_admin_users():
    """Returns list of admin team members for ticket assignment dropdowns."""
    admins = supabase_service.get_all_admins()
    return jsonify({
        "success": True,
        "data": admins
    }), 200
