"""
BookLeaf Publishing - Author Portal API Routes
Protected endpoints strictly isolated to the authenticated author.
"""

from flask import Blueprint, request, jsonify, g
from app.middleware.authentication import require_auth
from app.middleware.authorization import require_author
from app.services.supabase_service import supabase_service
from app.services.ticket_service import ticket_service
from app.services.ai_service import ai_service
from app.utils.errors import NotFoundError, AuthorizationError, ValidationError

author_bp = Blueprint("author", __name__)

@author_bp.route("/auth/register", methods=["POST"])
def register_author():
    """Registers a new author and returns an active session token."""
    payload = request.get_json() or {}
    full_name = payload.get("full_name", "").strip()
    email = payload.get("email", "").strip()
    password = payload.get("password", "")

    if not full_name or len(full_name) < 2:
        raise ValidationError("Full name is required and must be at least 2 characters.")
    if not email or "@" not in email:
        raise ValidationError("A valid email address is required.")
    if not password or len(password) < 6:
        raise ValidationError("Password must be at least 6 characters long.")

    result = supabase_service.register_user(full_name=full_name, email=email, password=password, role="author")
    return jsonify({
        "success": True,
        "data": result,
        "message": "Author registered successfully."
    }), 201

@author_bp.route("/auth/login", methods=["POST"])
def login_author():
    """Authenticates an author or administrator."""
    payload = request.get_json() or {}
    email = payload.get("email", "").strip()
    password = payload.get("password", "")

    if not email or not password:
        raise ValidationError("Both email and password are required.")

    result = supabase_service.login_user(email=email, password=password)
    return jsonify({
        "success": True,
        "data": result,
        "message": "Login successful."
    }), 200

@author_bp.route("/me", methods=["GET"])
@require_auth
def get_current_user():
    """Returns authenticated user profile."""
    return jsonify({
        "success": True,
        "data": g.current_user
    }), 200

@author_bp.route("/me/dashboard", methods=["GET"])
@require_auth
@require_author
def get_author_dashboard():
    """Returns author dashboard statistics calculated from real DB records."""
    stats = supabase_service.get_author_dashboard_stats(g.current_user["id"])
    return jsonify({
        "success": True,
        "data": stats
    }), 200

@author_bp.route("/me/books", methods=["GET"])
@require_auth
@require_author
def get_author_books():
    """Returns only books belonging to the authenticated author."""
    books = supabase_service.get_author_books(g.current_user["id"])
    return jsonify({
        "success": True,
        "data": books
    }), 200

@author_bp.route("/me/books/<book_id>", methods=["GET"])
@require_auth
@require_author
def get_author_book_detail(book_id: str):
    """Returns specific book detail ensuring author ownership."""
    book = supabase_service.get_book_by_id(book_id)
    if not book:
        raise NotFoundError(f"Book with ID '{book_id}' was not found.")

    if book.get("author_id") != g.current_user["id"] and g.current_user.get("role") != "admin":
        raise AuthorizationError("Access denied. You can only view your own books.")

    # Attach related tickets for this book
    tickets = supabase_service.get_tickets(author_id=g.current_user["id"])
    book_tickets = [t for t in tickets if t.get("book_id") == book_id]

    return jsonify({
        "success": True,
        "data": {
            **book,
            "tickets": book_tickets
        }
    }), 200

@author_bp.route("/me/tickets", methods=["GET"])
@require_auth
@require_author
def get_author_tickets():
    """Returns tickets belonging only to the authenticated author with filters."""
    status = request.args.get("status")
    category = request.args.get("category")
    search = request.args.get("search")
    sort_by = request.args.get("sort_by", "newest")

    tickets = supabase_service.get_tickets(
        author_id=g.current_user["id"],
        status=status,
        category=category,
        search=search,
        sort_by=sort_by
    )

    return jsonify({
        "success": True,
        "data": tickets
    }), 200

@author_bp.route("/me/tickets", methods=["POST"])
@require_auth
@require_author
def create_author_ticket():
    """Submits a new support ticket."""
    payload = request.get_json() or {}
    created = ticket_service.create_ticket(g.current_user["id"], payload)
    return jsonify({
        "success": True,
        "data": created,
        "message": "Ticket submitted successfully."
    }), 201

@author_bp.route("/me/ai-clarify", methods=["POST"])
@require_auth
@require_author
def clarify_ticket_inquiry():
    """Author AI Assistant endpoint: clarifies policies and helps formulate query before submitting."""
    payload = request.get_json() or {}
    message = payload.get("message", "").strip()
    book_id = payload.get("book_id")
    history = payload.get("history", [])

    if not message:
        raise ValidationError("Message content is required.")

    book_metadata = None
    if book_id:
        book_metadata = supabase_service.get_book_by_id(book_id)

    res = ai_service.clarify_inquiry(message=message, book_metadata=book_metadata, conversation_history=history)
    return jsonify(res), 200

@author_bp.route("/me/tickets/<ticket_id>", methods=["GET"])
@require_auth
@require_author
def get_author_ticket_detail(ticket_id: str):
    """Returns ticket details ensuring author ownership and filtering out internal notes."""
    ticket = supabase_service.get_ticket_by_id(ticket_id)
    if not ticket:
        raise NotFoundError(f"Ticket with ID '{ticket_id}' was not found.")

    if ticket.get("author_id") != g.current_user["id"] and g.current_user.get("role") != "admin":
        raise AuthorizationError("Access denied. You can only access your own tickets.")

    # Authors see ONLY public messages
    messages = supabase_service.get_ticket_messages(ticket_id, is_admin=False)

    return jsonify({
        "success": True,
        "data": {
            **ticket,
            "messages": messages
        }
    }), 200

@author_bp.route("/me/tickets/<ticket_id>/messages", methods=["GET"])
@require_auth
@require_author
def get_author_ticket_messages(ticket_id: str):
    """Returns public messages for an author's ticket."""
    ticket = supabase_service.get_ticket_by_id(ticket_id)
    if not ticket:
        raise NotFoundError(f"Ticket '{ticket_id}' not found.")

    if ticket.get("author_id") != g.current_user["id"] and g.current_user.get("role") != "admin":
        raise AuthorizationError("Access denied. You can only view messages on your own tickets.")

    messages = supabase_service.get_ticket_messages(ticket_id, is_admin=False)
    return jsonify({
        "success": True,
        "data": messages
    }), 200

@author_bp.route("/me/tickets/<ticket_id>/messages", methods=["POST"])
@require_auth
@require_author
def send_author_message(ticket_id: str):
    """Allows author to reply to their own ticket (public message only)."""
    ticket = supabase_service.get_ticket_by_id(ticket_id)
    if not ticket:
        raise NotFoundError(f"Ticket '{ticket_id}' not found.")

    if ticket.get("author_id") != g.current_user["id"] and g.current_user.get("role") != "admin":
        raise AuthorizationError("Access denied. You cannot reply to another author's ticket.")

    payload = request.get_json() or {}
    message_text = payload.get("message", "").strip()
    if not message_text:
        raise ValidationError("Message content is required.")

    msg = ticket_service.send_public_reply(
        ticket_id=ticket_id,
        sender_id=g.current_user["id"],
        sender_role="author",
        message=message_text
    )

    return jsonify({
        "success": True,
        "data": msg,
        "message": "Reply sent successfully."
    }), 201
