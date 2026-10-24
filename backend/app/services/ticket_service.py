"""
BookLeaf Publishing - Ticket Service
Manages ticket creation, validation, status transitions, messaging, and AI orchestration.
"""

from typing import Dict, Any, Optional, List
from app.utils.errors import ValidationError, NotFoundError, AuthorizationError
from app.constants import TICKET_STATUSES, TICKET_CATEGORIES, TICKET_PRIORITIES
from app.services.supabase_service import supabase_service
from app.services.ai_service import ai_service

class TicketService:
    def create_ticket(self, author_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new author ticket and runs AI classification."""
        subject = data.get("subject", "").strip()
        description = data.get("description", "").strip()
        book_id = data.get("book_id")

        if not subject or len(subject) < 3:
            raise ValidationError("Subject must be at least 3 characters long.")
        if not description or len(description) < 10:
            raise ValidationError("Description must be at least 10 characters long.")

        book_metadata = None
        if book_id:
            book = supabase_service.get_book_by_id(book_id)
            if not book:
                raise NotFoundError(f"Book with ID '{book_id}' was not found.")
            # Author ownership validation
            if book.get("author_id") != author_id:
                raise AuthorizationError("You cannot submit a ticket for a book that does not belong to you.")
            book_metadata = book

        # AI Classification & Priority Scoring (with graceful fallback)
        ai_res = ai_service.classify_ticket(subject, description, book_metadata)

        ticket_data = {
            "author_id": author_id,
            "book_id": book_id,
            "subject": subject,
            "description": description,
            "category": ai_res.get("category", "General Inquiry"),
            "ai_category": ai_res.get("category"),
            "priority": ai_res.get("priority", "Medium"),
            "ai_priority": ai_res.get("priority"),
            "ai_reason": ai_res.get("reason"),
            "ai_confidence": ai_res.get("confidence", 0.9),
            "ai_status": ai_res.get("ai_status", "completed"),
        }

        created = supabase_service.create_ticket(ticket_data)
        return created

    def update_ticket_by_admin(self, ticket_id: str, admin_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        ticket = supabase_service.get_ticket_by_id(ticket_id)
        if not ticket:
            raise NotFoundError(f"Ticket '{ticket_id}' not found.")

        valid_updates: Dict[str, Any] = {}

        if "status" in updates and updates["status"]:
            new_status = updates["status"]
            if new_status not in TICKET_STATUSES:
                raise ValidationError(f"Invalid status '{new_status}'. Allowed: {', '.join(TICKET_STATUSES)}")
            valid_updates["status"] = new_status

        if "category" in updates and updates["category"]:
            new_cat = updates["category"]
            if new_cat not in TICKET_CATEGORIES:
                raise ValidationError(f"Invalid category '{new_cat}'. Allowed: {', '.join(TICKET_CATEGORIES)}")
            valid_updates["category"] = new_cat
            valid_updates["admin_override"] = True

        if "priority" in updates and updates["priority"]:
            new_prio = updates["priority"]
            if new_prio not in TICKET_PRIORITIES:
                raise ValidationError(f"Invalid priority '{new_prio}'. Allowed: {', '.join(TICKET_PRIORITIES)}")
            valid_updates["priority"] = new_prio
            valid_updates["admin_override"] = True

        if "assigned_admin_id" in updates:
            assignee = updates["assigned_admin_id"]
            if assignee:
                admin_profile = supabase_service.get_profile(assignee)
                if not admin_profile or admin_profile.get("role") != "admin":
                    raise ValidationError("Assignee must be an authorized admin user.")
            valid_updates["assigned_admin_id"] = assignee

        updated = supabase_service.update_ticket(ticket_id, valid_updates)
        return updated or ticket

    def send_public_reply(
        self,
        ticket_id: str,
        sender_id: str,
        sender_role: str,
        message: str
    ) -> Dict[str, Any]:
        """Sends a public reply visible to the author and advances status to In Progress."""
        ticket = supabase_service.get_ticket_by_id(ticket_id)
        if not ticket:
            raise NotFoundError(f"Ticket '{ticket_id}' not found.")

        msg = supabase_service.create_ticket_message(
            ticket_id=ticket_id,
            sender_id=sender_id,
            sender_role=sender_role,
            message=message.strip(),
            visibility="public"
        )

        # Update status if Open
        if ticket.get("status") == "Open":
            supabase_service.update_ticket(ticket_id, {"status": "In Progress"})

        return msg

    def add_internal_note(self, ticket_id: str, admin_id: str, message: str) -> Dict[str, Any]:
        """Creates an internal note strictly hidden from authors."""
        ticket = supabase_service.get_ticket_by_id(ticket_id)
        if not ticket:
            raise NotFoundError(f"Ticket '{ticket_id}' not found.")

        msg = supabase_service.create_ticket_message(
            ticket_id=ticket_id,
            sender_id=admin_id,
            sender_role="admin",
            message=message.strip(),
            visibility="internal"
        )
        return msg

    def generate_ai_draft(self, ticket_id: str) -> Dict[str, Any]:
        ticket = supabase_service.get_ticket_by_id(ticket_id)
        if not ticket:
            raise NotFoundError(f"Ticket '{ticket_id}' not found.")

        book_meta = None
        if ticket.get("book_id"):
            book_meta = supabase_service.get_book_by_id(ticket["book_id"])

        author_profile = supabase_service.get_profile(ticket["author_id"])
        return ai_service.generate_draft_response(ticket, book_meta, author_profile)

ticket_service = TicketService()
