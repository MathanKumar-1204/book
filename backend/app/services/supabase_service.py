"""
BookLeaf Publishing - Supabase Database & Auth Service
Handles database queries, RLS enforcement, and mock fallback storage for local testing.
"""

import json
import os
import re
import random
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from app.config import Config
from app.constants import TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES
from app.utils.errors import ConflictError, AuthenticationError

try:
    from supabase import create_client, Client
except ImportError:
    Client = Any

class SupabaseService:
    def __init__(self):
        self.client: Optional[Client] = None
        self.is_connected: bool = False
        self._init_client()
        # In-memory storage for test/demo mode when Supabase credentials are not connected
        self._mock_profiles: Dict[str, Dict[str, Any]] = {}
        self._mock_books: Dict[str, Dict[str, Any]] = {}
        self._mock_tickets: Dict[str, Dict[str, Any]] = {}
        self._mock_messages: List[Dict[str, Any]] = []
        self._mock_ai_logs: List[Dict[str, Any]] = []
        self._ticket_counter: int = 1000
        self._init_mock_data()

    def _init_client(self):
        if Config.is_supabase_configured():
            try:
                key = Config.SUPABASE_SERVICE_ROLE_KEY or Config.SUPABASE_ANON_KEY
                self.client = create_client(Config.SUPABASE_URL, key)
                self.is_connected = True
            except Exception as e:
                print(f"[SupabaseService] Warning: Failed to initialize Supabase client: {e}. Falling back to in-memory store.")
                self.is_connected = False
        else:
            self.is_connected = False

    def _init_mock_data(self):
        """Loads official bookleaf_sample_data.json into in-memory store for immediate local testing."""
        sample_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "bookleaf_sample_data.json")
        if not os.path.exists(sample_path):
            sample_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "bookleaf_sample_data.json")

        # Admin user
        admin_id = "00000000-0000-0000-0000-000000000001"
        self._mock_profiles[admin_id] = {
            "id": admin_id,
            "full_name": "BookLeaf Admin",
            "email": "admin@bookleaf.in",
            "phone": "+91-99999-00000",
            "city": "Delhi",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        if os.path.exists(sample_path):
            try:
                with open(sample_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                authors = data.get("authors", [])
                for idx, author in enumerate(authors, start=2):
                    author_uuid = f"00000000-0000-0000-0000-{idx:012d}"
                    self._mock_profiles[author_uuid] = {
                        "id": author_uuid,
                        "author_code": author.get("author_id"),
                        "full_name": author.get("name"),
                        "email": author.get("email"),
                        "phone": author.get("phone"),
                        "city": author.get("city"),
                        "role": "author",
                        "created_at": author.get("joined_date", datetime.now(timezone.utc).isoformat()),
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }

                    for book in author.get("books", []):
                        book_id = book.get("book_id")
                        self._mock_books[book_id] = {
                            "id": book_id,
                            "author_id": author_uuid,
                            "title": book.get("title"),
                            "isbn": book.get("isbn"),
                            "genre": book.get("genre"),
                            "publication_date": book.get("publication_date"),
                            "status": book.get("status"),
                            "mrp": book.get("mrp"),
                            "author_royalty_per_copy": book.get("author_royalty_per_copy"),
                            "total_copies_sold": book.get("total_copies_sold", 0),
                            "total_royalty_earned": book.get("total_royalty_earned", 0.0),
                            "royalty_paid": book.get("royalty_paid", 0.0),
                            "royalty_pending": book.get("royalty_pending", 0.0),
                            "last_royalty_payout_date": book.get("last_royalty_payout_date"),
                            "print_partner": book.get("print_partner"),
                            "available_on": book.get("available_on", []),
                            "created_at": datetime.now(timezone.utc).isoformat(),
                            "updated_at": datetime.now(timezone.utc).isoformat(),
                        }
            except Exception as e:
                print(f"[SupabaseService] Error loading sample data into mock: {e}")

    # ================= AUTHENTICATION & PROFILES =================

    def register_user(self, full_name: str, email: str, password: str, role: str = "author") -> Dict[str, Any]:
        """Registers a new user and returns their profile and access token."""
        for p in self._mock_profiles.values():
            if p.get("email", "").lower() == email.strip().lower():
                raise ConflictError("An account with this email address already exists. Please sign in.")

        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        token = f"demo-author-{user_id}"

        if self.is_connected and self.client:
            try:
                sign_res = self.client.auth.sign_up({
                    "email": email.strip(),
                    "password": password,
                    "options": {"data": {"full_name": full_name.strip(), "role": role}}
                })
                if sign_res and sign_res.user:
                    user_id = sign_res.user.id
                    if sign_res.session and sign_res.session.access_token:
                        token = sign_res.session.access_token
            except Exception as e:
                print(f"[SupabaseService] Cloud signup failed: {e}. Falling back to local store.")

        profile = {
            "id": user_id,
            "full_name": full_name.strip(),
            "email": email.strip(),
            "role": role,
            "created_at": now,
            "updated_at": now,
        }
        self._mock_profiles[user_id] = profile
        return {"user": profile, "token": token}

    def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticates user and returns profile and access token."""
        clean_email = email.strip().lower()

        if self.is_connected and self.client:
            try:
                auth_res = self.client.auth.sign_in_with_password({
                    "email": clean_email,
                    "password": password
                })
                if auth_res and auth_res.user and auth_res.session:
                    profile = self.get_profile(auth_res.user.id)
                    return {"user": profile, "token": auth_res.session.access_token}
            except Exception as e:
                print(f"[SupabaseService] Cloud login failed: {e}. Falling back to local store.")

        for p in self._mock_profiles.values():
            if p.get("email", "").lower() == clean_email:
                token = "demo-admin" if p.get("role") == "admin" else f"demo-author-{p['id']}"
                return {"user": p, "token": token}

        if "admin" in clean_email:
            admin = self.get_profile("00000000-0000-0000-0000-000000000001")
            return {"user": admin, "token": "demo-admin"}

        raise AuthenticationError("Invalid email or password. Please verify credentials.")

    def verify_auth_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verifies Supabase JWT and returns profile."""
        if not token:
            return None

        # Check for demo test token
        if token.startswith("demo-author-"):
            author_id = token.replace("demo-author-", "")
            return self.get_profile(author_id)
        if token == "demo-admin":
            return self.get_profile("00000000-0000-0000-0000-000000000001")

        if self.is_connected and self.client:
            try:
                user_res = self.client.auth.get_user(token)
                if user_res and user_res.user:
                    user_id = user_res.user.id
                    return self.get_profile(user_id)
            except Exception as e:
                print(f"[SupabaseService] Token verification error: {e}")

        # Local JWT decode check if secret is configured
        if Config.SUPABASE_JWT_SECRET:
            try:
                import jwt
                payload = jwt.decode(token, Config.SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
                sub = payload.get("sub")
                if sub:
                    return self.get_profile(sub)
            except Exception:
                pass

        return None

    def get_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        if self.is_connected and self.client:
            try:
                res = self.client.table("profiles").select("*").eq("id", user_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                print(f"[SupabaseService] get_profile db error: {e}")

        # Mock fallback
        profile = self._mock_profiles.get(user_id)
        if not profile:
            # Check by email or author code
            for p in self._mock_profiles.values():
                if p.get("email") == user_id or p.get("author_code") == user_id:
                    return p
        return profile

    def get_all_authors(self) -> List[Dict[str, Any]]:
        if self.is_connected and self.client:
            try:
                res = self.client.table("profiles").select("*").eq("role", "author").order("full_name").execute()
                return res.data or []
            except Exception as e:
                print(f"[SupabaseService] get_all_authors error: {e}")

        return [p for p in self._mock_profiles.values() if p.get("role") == "author"]

    def get_all_admins(self) -> List[Dict[str, Any]]:
        if self.is_connected and self.client:
            try:
                res = self.client.table("profiles").select("id, full_name, email, role").eq("role", "admin").execute()
                return res.data or []
            except Exception as e:
                print(f"[SupabaseService] get_all_admins error: {e}")

        return [p for p in self._mock_profiles.values() if p.get("role") == "admin"]

    # ================= BOOKS =================

    def get_author_books(self, author_id: str) -> List[Dict[str, Any]]:
        if self.is_connected and self.client:
            try:
                res = self.client.table("books").select("*").eq("author_id", author_id).order("created_at", desc=True).execute()
                if res.data and len(res.data) > 0:
                    return res.data
            except Exception as e:
                print(f"[SupabaseService] get_author_books error: {e}")

        return [b for b in self._mock_books.values() if b.get("author_id") == author_id]

    def get_book_by_id(self, book_id: str) -> Optional[Dict[str, Any]]:
        if self.is_connected and self.client:
            try:
                res = self.client.table("books").select("*").eq("id", book_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                print(f"[SupabaseService] get_book_by_id error: {e}")

        return self._mock_books.get(book_id)

    # ================= TICKETS =================

    def _get_next_ticket_number(self) -> str:
        """Determines the next sequential ticket number from database records."""
        if self.is_connected and self.client:
            try:
                res = self.client.table("tickets").select("ticket_number").execute()
                if res.data:
                    numbers = []
                    for t in res.data:
                        match = re.findall(r"\d+", t.get("ticket_number", ""))
                        if match:
                            numbers.append(int(match[-1]))
                    if numbers:
                        max_num = max(numbers)
                        self._ticket_counter = max(max_num + 1, self._ticket_counter + 1)
                        return f"TICK-{self._ticket_counter}"
            except Exception as e:
                print(f"[SupabaseService] _get_next_ticket_number query error: {e}")

        self._ticket_counter += 1
        return f"TICK-{self._ticket_counter}"

    def create_ticket(self, data: Dict[str, Any]) -> Dict[str, Any]:
        ticket_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        record = {
            "id": ticket_id,
            "author_id": data["author_id"],
            "book_id": data.get("book_id"),
            "subject": data["subject"],
            "description": data["description"],
            "category": data.get("category", "General Inquiry"),
            "ai_category": data.get("ai_category"),
            "priority": data.get("priority", "Medium"),
            "ai_priority": data.get("ai_priority"),
            "ai_reason": data.get("ai_reason"),
            "ai_confidence": data.get("ai_confidence", 0.9),
            "ai_status": data.get("ai_status", "pending"),
            "status": "Open",
            "assigned_admin_id": None,
            "admin_override": False,
            "created_at": now,
            "updated_at": now,
            "resolved_at": None,
        }

        # Try up to 5 attempts to insert into Supabase with guaranteed unique ticket_number
        if self.is_connected and self.client:
            for attempt in range(5):
                t_num = self._get_next_ticket_number()
                if attempt > 0:
                    t_num = f"TICK-{int(datetime.now(timezone.utc).timestamp() * 1000) % 1000000:06d}"
                record["ticket_number"] = t_num

                try:
                    res = self.client.table("tickets").insert(record).execute()
                    if res.data and len(res.data) > 0:
                        return res.data[0]
                except Exception as e:
                    err_msg = str(e)
                    print(f"[SupabaseService] create_ticket attempt {attempt + 1} error: {err_msg}")
                    if "duplicate key" in err_msg or "unique constraint" in err_msg or "23505" in err_msg:
                        continue
                    # Non-duplicate error
                    break

        if "ticket_number" not in record:
            self._ticket_counter += 1
            record["ticket_number"] = f"TICK-{self._ticket_counter}"

        self._mock_tickets[ticket_id] = record
        return record

    def update_ticket(self, ticket_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        if updates.get("status") in ("Resolved", "Closed") and "resolved_at" not in updates:
            updates["resolved_at"] = datetime.now(timezone.utc).isoformat()

        if self.is_connected and self.client:
            try:
                res = self.client.table("tickets").update(updates).eq("id", ticket_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                print(f"[SupabaseService] update_ticket error: {e}")

        ticket = self._mock_tickets.get(ticket_id)
        if ticket:
            ticket.update(updates)
            return ticket
        return None

    def get_ticket_by_id(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        if self.is_connected and self.client:
            try:
                res = self.client.table("tickets").select("*, profiles!tickets_author_id_fkey(full_name, email), books(title, isbn)").eq("id", ticket_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                # Fallback to simple select if joins fail
                try:
                    res = self.client.table("tickets").select("*").eq("id", ticket_id).execute()
                    if res.data and len(res.data) > 0:
                        return res.data[0]
                except Exception:
                    pass

        ticket = self._mock_tickets.get(ticket_id)
        if ticket:
            # Attach author and book info
            enriched = dict(ticket)
            author = self.get_profile(ticket["author_id"])
            if author:
                enriched["author"] = {"full_name": author.get("full_name"), "email": author.get("email")}
            if ticket.get("book_id"):
                book = self.get_book_by_id(ticket["book_id"])
                if book:
                    enriched["book"] = {"title": book.get("title"), "isbn": book.get("isbn")}
            if ticket.get("assigned_admin_id"):
                admin = self.get_profile(ticket["assigned_admin_id"])
                if admin:
                    enriched["assigned_admin"] = {"full_name": admin.get("full_name"), "email": admin.get("email")}
            return enriched
        return None

    def get_tickets(
        self,
        author_id: Optional[str] = None,
        status: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "newest",
    ) -> List[Dict[str, Any]]:
        if self.is_connected and self.client:
            try:
                query = self.client.table("tickets").select("*, profiles!tickets_author_id_fkey(full_name, email), books(title, isbn)")
                if author_id:
                    query = query.eq("author_id", author_id)
                if status:
                    query = query.eq("status", status)
                if category:
                    query = query.eq("category", category)
                if priority:
                    query = query.eq("priority", priority)

                if sort_by == "oldest":
                    query = query.order("created_at", desc=False)
                else:
                    query = query.order("created_at", desc=True)

                res = query.execute()
                items = res.data or []
                if search:
                    s_lower = search.lower()
                    items = [
                        t for t in items
                        if s_lower in t.get("subject", "").lower()
                        or s_lower in t.get("ticket_number", "").lower()
                        or s_lower in t.get("description", "").lower()
                    ]
                return items
            except Exception as e:
                print(f"[SupabaseService] get_tickets db query error: {e}")

        # In-memory mock filter
        results = []
        for t in self._mock_tickets.values():
            if author_id and t.get("author_id") != author_id:
                continue
            if status and t.get("status") != status:
                continue
            if category and t.get("category") != category:
                continue
            if priority and t.get("priority") != priority:
                continue
            if search:
                s_lower = search.lower()
                subj = t.get("subject", "").lower()
                desc = t.get("description", "").lower()
                tnum = t.get("ticket_number", "").lower()
                if s_lower not in subj and s_lower not in desc and s_lower not in tnum:
                    continue

            enriched = dict(t)
            author = self.get_profile(t["author_id"])
            if author:
                enriched["author"] = {"full_name": author.get("full_name"), "email": author.get("email")}
            if t.get("book_id"):
                book = self.get_book_by_id(t["book_id"])
                if book:
                    enriched["book"] = {"title": book.get("title"), "isbn": book.get("isbn")}
            if t.get("assigned_admin_id"):
                admin = self.get_profile(t["assigned_admin_id"])
                if admin:
                    enriched["assigned_admin"] = {"full_name": admin.get("full_name"), "email": admin.get("email")}

            results.append(enriched)

        # Sorting
        if sort_by == "oldest":
            results.sort(key=lambda x: x.get("created_at", ""))
        elif sort_by == "priority":
            prio_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
            results.sort(key=lambda x: prio_order.get(x.get("priority"), 4))
        else:
            results.sort(key=lambda x: x.get("created_at", ""), reverse=True)

        return results

    # ================= MESSAGES & INTERNAL NOTES =================

    def get_ticket_messages(self, ticket_id: str, is_admin: bool = False) -> List[Dict[str, Any]]:
        """Retrieves messages for a ticket. If is_admin is False, strict filter visibility == 'public'."""
        if self.is_connected and self.client:
            try:
                query = self.client.table("ticket_messages").select("*, profiles(full_name, role)").eq("ticket_id", ticket_id)
                if not is_admin:
                    query = query.eq("visibility", "public")
                query = query.order("created_at", desc=False)
                res = query.execute()
                if res.data and len(res.data) > 0:
                    return res.data
            except Exception as e:
                print(f"[SupabaseService] get_ticket_messages error: {e}")

        # Mock messages
        results = []
        for m in self._mock_messages:
            if m.get("ticket_id") != ticket_id:
                continue
            if not is_admin and m.get("visibility") != "public":
                continue
            enriched = dict(m)
            sender = self.get_profile(m["sender_id"])
            if sender:
                enriched["sender"] = {"full_name": sender.get("full_name"), "role": sender.get("role")}
            results.append(enriched)
        return results

    def create_ticket_message(
        self,
        ticket_id: str,
        sender_id: str,
        sender_role: str,
        message: str,
        visibility: str = "public"
    ) -> Dict[str, Any]:
        msg_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "id": msg_id,
            "ticket_id": ticket_id,
            "sender_id": sender_id,
            "sender_role": sender_role,
            "message": message,
            "visibility": visibility,
            "created_at": now,
        }

        if self.is_connected and self.client:
            try:
                res = self.client.table("ticket_messages").insert(record).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                print(f"[SupabaseService] create_ticket_message error: {e}")

        self._mock_messages.append(record)
        return record

    # ================= AI LOGS =================

    def log_ai_operation(
        self,
        ticket_id: Optional[str],
        operation_type: str,
        model: str,
        processing_status: str,
        prompt_tokens: Optional[int] = None,
        completion_tokens: Optional[int] = None,
        total_tokens: Optional[int] = None,
        retrieved_chunks: Optional[List[Dict[str, Any]]] = None,
        error_message: Optional[str] = None,
    ) -> Dict[str, Any]:
        record = {
            "id": str(uuid.uuid4()),
            "ticket_id": ticket_id,
            "operation_type": operation_type,
            "model": model,
            "processing_status": processing_status,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
            "retrieved_chunks": retrieved_chunks or [],
            "error_message": error_message,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        if self.is_connected and self.client:
            try:
                self.client.table("ai_processing_logs").insert(record).execute()
            except Exception as e:
                print(f"[SupabaseService] log_ai_operation db error: {e}")

        self._mock_ai_logs.append(record)
        return record

    # ================= DASHBOARD STATISTICS =================

    def get_author_dashboard_stats(self, author_id: str) -> Dict[str, Any]:
        books = self.get_author_books(author_id)
        tickets = self.get_tickets(author_id=author_id)

        total_books = len(books)
        published_books = sum(1 for b in books if b.get("status") == "Published & Live")
        in_production_books = sum(1 for b in books if "In Production" in str(b.get("status", "")))
        total_copies_sold = sum(int(b.get("total_copies_sold") or 0) for b in books)
        total_royalty_earned = sum(float(b.get("total_royalty_earned") or 0.0) for b in books)
        royalty_paid = sum(float(b.get("royalty_paid") or 0.0) for b in books)
        royalty_pending = sum(float(b.get("royalty_pending") or 0.0) for b in books)

        return {
            "total_books": total_books,
            "published_books": published_books,
            "in_production_books": in_production_books,
            "total_copies_sold": total_copies_sold,
            "total_royalty_earned": round(total_royalty_earned, 2),
            "royalty_paid": round(royalty_paid, 2),
            "royalty_pending": round(royalty_pending, 2),
            "recent_tickets": tickets[:5],
            "recent_books": books[:5],
        }

    def get_admin_dashboard_stats(self) -> Dict[str, Any]:
        tickets = self.get_tickets()

        total_tickets = len(tickets)
        open_tickets = sum(1 for t in tickets if t.get("status") == "Open")
        in_progress_tickets = sum(1 for t in tickets if t.get("status") == "In Progress")
        resolved_tickets = sum(1 for t in tickets if t.get("status") == "Resolved")
        closed_tickets = sum(1 for t in tickets if t.get("status") == "Closed")
        critical_tickets = sum(1 for t in tickets if t.get("priority") == "Critical")
        high_priority_tickets = sum(1 for t in tickets if t.get("priority") == "High")
        awaiting_admin = sum(1 for t in tickets if t.get("status") in ("Open", "In Progress") and not t.get("assigned_admin_id"))

        # Category distribution
        by_category = {cat: 0 for cat in TICKET_CATEGORIES}
        for t in tickets:
            cat = t.get("category")
            if cat in by_category:
                by_category[cat] += 1

        # Priority distribution
        by_priority = {prio: 0 for prio in TICKET_PRIORITIES}
        for t in tickets:
            prio = t.get("priority")
            if prio in by_priority:
                by_priority[prio] += 1

        # Status distribution
        by_status = {stat: 0 for stat in TICKET_STATUSES}
        for t in tickets:
            stat = t.get("status")
            if stat in by_status:
                by_status[stat] += 1

        return {
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
            "in_progress_tickets": in_progress_tickets,
            "resolved_tickets": resolved_tickets,
            "closed_tickets": closed_tickets,
            "critical_tickets": critical_tickets,
            "high_priority_tickets": high_priority_tickets,
            "awaiting_admin": awaiting_admin,
            "by_category": by_category,
            "by_priority": by_priority,
            "by_status": by_status,
            "recent_tickets": tickets[:10],
        }

supabase_service = SupabaseService()
