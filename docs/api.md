# BookLeaf Publishing — REST API Specification (`/api/v1`)

All endpoints are versioned with prefix `/api/v1`. Authentication uses standard HTTP Bearer tokens:
`Authorization: Bearer <token>`

---

## 1. Health & Status

### `GET /api/v1/health`
Checks server readiness and third-party integration statuses.
- **Authentication**: None
- **Response 200**:
```json
{
  "status": "healthy",
  "service": "BookLeaf Publishing API",
  "version": "1.0.0",
  "timestamp": "2026-10-21T07:45:00Z",
  "integrations": {
    "supabase_database": "connected",
    "groq_ai": "configured",
    "groq_model": "llama-3.3-70b-versatile",
    "pinecone_rag": "connected",
    "pinecone_index": "bookleaf-knowledge-base",
    "embedding_provider": "local"
  }
}
```

---

## 2. Author Portal Endpoints

### `GET /api/v1/me`
Retrieves current authenticated profile.
- **Auth**: Author or Admin
- **Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "00000000-0000-0000-0000-000000000002",
    "full_name": "Priya Sharma",
    "email": "priya.sharma@email.com",
    "role": "author",
    "phone": "+91-98765-43210",
    "city": "Mumbai"
  }
}
```

### `GET /api/v1/me/dashboard`
Returns live calculated author metrics.
- **Auth**: Author
- **Response 200**:
```json
{
  "success": true,
  "data": {
    "total_books": 2,
    "published_books": 2,
    "in_production_books": 0,
    "total_copies_sold": 531,
    "total_royalty_earned": 19908.0,
    "royalty_paid": 16338.0,
    "royalty_pending": 3570.0,
    "recent_tickets": [],
    "recent_books": []
  }
}
```

### `GET /api/v1/me/books`
Returns all books belonging to the authenticated author.
- **Auth**: Author

### `GET /api/v1/me/books/:book_id`
Returns details of a specific book belonging to the author.
- **Auth**: Author (enforces ownership; returns 403 if accessed by another author)

### `GET /api/v1/me/tickets`
Returns support tickets submitted by the authenticated author.
- **Query Parameters**:
  - `status` (`Open` | `In Progress` | `Resolved` | `Closed`)
  - `category`
  - `search`
  - `sort_by` (`newest` | `oldest`)
- **Auth**: Author

### `POST /api/v1/me/tickets`
Submits a new support query. Automatically triggers AI classification & priority scoring.
- **Auth**: Author
- **Request Body**:
```json
{
  "subject": "Missing Q3 Royalty Payout",
  "description": "I have not received my royalty for the third quarter. Could you please check my bank transfer status?",
  "book_id": "BK001"
}
```
- **Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "ticket_number": "TICK-1002",
    "category": "Royalty & Payments",
    "priority": "High",
    "status": "Open",
    "ai_reason": "Query pertains to missing quarterly royalty payout.",
    "ai_confidence": 0.95
  }
}
```

### `GET /api/v1/me/tickets/:ticket_id`
Returns ticket conversation. Strictly filters out all internal notes.
- **Auth**: Author

### `POST /api/v1/me/tickets/:ticket_id/messages`
Author sends a follow-up public message.
- **Request Body**:
```json
{
  "message": "Here are the photos of the defective copies."
}
```

---

## 3. Admin Operations Endpoints

### `GET /api/v1/admin/dashboard`
Aggregated metrics and charts data across all tickets.
- **Auth**: Admin

### `GET /api/v1/admin/tickets`
Global ticket queue across all authors.
- **Query Parameters**: `status`, `category`, `priority`, `search`, `sort_by`
- **Auth**: Admin

### `GET /api/v1/admin/tickets/:ticket_id`
Returns full ticket details including both public replies and private internal notes.
- **Auth**: Admin

### `PATCH /api/v1/admin/tickets/:ticket_id`
Admin updates ticket status, overrides category/priority, or reassigns.
- **Request Body**:
```json
{
  "status": "In Progress",
  "category": "Royalty & Payments",
  "priority": "Critical",
  "assigned_admin_id": "00000000-0000-0000-0000-000000000001"
}
```

### `POST /api/v1/admin/tickets/:ticket_id/assign`
Assigns ticket to an operations specialist.
- **Request Body**:
```json
{
  "admin_id": "00000000-0000-0000-0000-000000000001"
}
```

### `POST /api/v1/admin/tickets/:ticket_id/messages`
Sends official public response to the author.
- **Request Body**:
```json
{
  "message": "Dear Priya, we have escalated your royalty inquiry to finance...",
  "status": "In Progress"
}
```

### `POST /api/v1/admin/tickets/:ticket_id/notes`
Creates a confidential internal note.
- **Request Body**:
```json
{
  "message": "Internal note: Waiting on bank confirmation for UTR 99120."
}
```

### `POST /api/v1/admin/tickets/:ticket_id/ai-classify`
Re-triggers Groq AI auto-classification.
- **Auth**: Admin

### `POST /api/v1/admin/tickets/:ticket_id/ai-draft`
Generates grounded response draft using Groq + Pinecone RAG policy excerpts.
- **Response 200**:
```json
{
  "success": true,
  "data": {
    "draft_response": "Dear Author, Thank you for reaching out...",
    "retrieved_excerpts": [
      {
        "id": "kb-royalty-policy",
        "title": "Royalty Policy",
        "content": "...",
        "score": 0.88,
        "source": "pinecone_vector_db"
      }
    ],
    "model_used": "llama-3.3-70b-versatile",
    "status": "success"
  }
}
```

### `GET /api/v1/admin/authors`
Lists all registered BookLeaf authors.

### `GET /api/v1/admin/admin-users`
Lists administrative team members for ticket assignment.
