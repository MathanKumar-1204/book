# BookLeaf Publishing — System Architecture & Data Flow

This document details the software architecture, data models, AI/RAG workflows, security controls, and failure-handling mechanisms for the BookLeaf Author Support & Operations Communication Portal.

---

## 1. High-Level Architecture Overview

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Application (React + Vite + Tailwind + TypeScript)"]
        AP["Author Portal\n- Dashboard (Real Metrics)\n- Books & Royalties\n- Ticket Submission\n- Realtime Ticket View"]
        AD["Admin Portal\n- Dashboard Overview\n- Global Queue (Multi-filter)\n- AI Classification Override\n- RAG Draft Engine & Notes"]
        RT["Supabase Realtime Client\n- Channel: ticket_messages\n- Channel: tickets"]
    end

    subgraph APILayer["Backend REST API (Python 3.12 + Flask)"]
        MW["Auth Middleware\n(Supabase JWT Verification)"]
        RBAC["RBAC Engine\n(Author vs Admin Isolation)"]
        TS["Ticket Management Service\n(Validation, Status, Audit)"]
        AIS["AI Intelligence Service\n(Groq LLM Client)"]
        RAG["RAG Retrieval Service\n(Pinecone Vector Search)"]
    end

    subgraph DataStorage["Data & Auth Tier (Supabase)"]
        AUTH["Supabase Auth (Email/Pass)"]
        RLS["Row Level Security (RLS)"]
        DB["PostgreSQL\n- profiles\n- books\n- tickets\n- ticket_messages\n- ai_processing_logs"]
    end

    subgraph ExternalServices["External AI Services"]
        GROQ["Groq Cloud API\n(Llama 3.3 70B / 3.1 8B)"]
        PNC["Pinecone Vector Database\n(Policy Chunks)"]
    end

    AP -->|Bearer JWT| MW
    AD -->|Bearer JWT| MW
    MW --> RBAC
    RBAC --> TS
    TS --> DB
    DB -.->|Broadcast Changes| RT
    TS --> AIS
    AIS --> GROQ
    TS --> RAG
    RAG --> PNC
    AP -.-> AUTH
    AD -.-> AUTH
    DB --- RLS
```

---

## 2. End-to-End Ticket Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Author as Author
    participant Web as Portal Frontend
    participant API as Flask Backend
    participant AI as Groq / RAG Engine
    participant DB as Supabase PostgreSQL
    actor Admin as Operations Admin

    Author->>Web: Submits Support Query (Subject, Description, Book ID)
    Web->>API: POST /api/v1/me/tickets (Bearer JWT)
    API->>API: Verify JWT, Author Ownership of Book ID
    API->>AI: Classify Category (6) & Priority (4)
    alt Groq Available
        AI-->>API: Category, Priority, Rationale, Confidence
    else Groq Transient Failure
        AI-->>API: Deterministic Fallback Classification
    end
    API->>DB: INSERT into tickets (status='Open')
    API-->>Web: 201 Created (Ticket Number)

    Admin->>Web: Opens Ticket in Global Queue
    Web->>API: GET /api/v1/admin/tickets/:id
    API-->>Web: Ticket Data, Author Profile, Associated Book

    Admin->>Web: Clicks "Generate Grounded AI Draft"
    Web->>API: POST /api/v1/admin/tickets/:id/ai-draft
    API->>AI: Vector Search Top Policy Chunks (Pinecone)
    AI->>AI: Synthesize Empathetic Draft (Groq + Tone Rules)
    AI-->>API: Draft Text + Retrieved Policy Citations
    API-->>Web: Draft Preview & Citations

    Admin->>Web: Edits Draft & Clicks "Send to Author"
    Web->>API: POST /api/v1/admin/tickets/:id/messages (Public)
    API->>DB: INSERT into ticket_messages (visibility='public')
    API->>DB: UPDATE tickets status='In Progress'
    DB-->>Web: Supabase Realtime Event Published
    Web-->>Author: Realtime Message Appears in Author Chat
```

---

## 3. Data Model & Entity Relationships

```mermaid
erDiagram
    profiles ||--o{ books : "owns"
    profiles ||--o{ tickets : "creates"
    profiles ||--o{ ticket_messages : "sends"
    books ||--o{ tickets : "associated with"
    tickets ||--o{ ticket_messages : "contains"
    tickets ||--o{ ai_processing_logs : "audits"

    profiles {
        uuid id PK
        string full_name
        string email UK
        string role "author | admin"
        string phone
        string city
        timestamptz created_at
    }

    books {
        string id PK
        uuid author_id FK
        string title
        string isbn
        string genre
        string status
        numeric mrp
        numeric author_royalty_per_copy
        int total_copies_sold
        numeric total_royalty_earned
        numeric royalty_paid
        numeric royalty_pending
        date last_royalty_payout_date
        string print_partner
        jsonb available_on
    }

    tickets {
        uuid id PK
        string ticket_number UK
        uuid author_id FK
        string book_id FK
        string subject
        text description
        string category
        string priority
        string ai_category
        string ai_priority
        text ai_reason
        string ai_status
        string status "Open | In Progress | Resolved | Closed"
        uuid assigned_admin_id FK
        boolean admin_override
        timestamptz created_at
        timestamptz updated_at
    }

    ticket_messages {
        uuid id PK
        uuid ticket_id FK
        uuid sender_id FK
        string sender_role "author | admin"
        text message
        string visibility "public | internal"
        timestamptz created_at
    }

    ai_processing_logs {
        uuid id PK
        uuid ticket_id FK
        string operation_type
        string model
        string processing_status
        int prompt_tokens
        int completion_tokens
        jsonb retrieved_chunks
        text error_message
        timestamptz created_at
    }
```

---

## 4. Security & Isolation Architecture

1. **Strict Client/Server Secret Boundary**:
   - The browser frontend exclusively receives the publishable `VITE_SUPABASE_ANON_KEY`.
   - `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, and `PINECONE_API_KEY` reside exclusively in the backend server environment.
2. **Server-Side Token Verification**:
   - Every protected route requires an `Authorization: Bearer <token>` header.
   - The Flask backend independently verifies token signature, expiry, and queries `public.profiles` to determine the user's role. Client-supplied IDs or roles are never trusted.
3. **Internal Notes Isolation**:
   - Messages have `visibility: 'public'` or `visibility: 'internal'`.
   - Authors can query only `visibility = 'public'`. Internal notes are filtered in both the database RLS policies and backend route handlers, and excluded from author-facing AI prompts.
4. **Author Data Isolation**:
   - Authors can only view or create tickets for books linked to their own `author_id`. Attempting to access another author's record results in an immediate `403 FORBIDDEN`.

---

## 5. Resilience & Fallback Design

| Component | Failure Mode | Mitigation Strategy |
|---|---|---|
| **Groq AI API** | Rate limit, outage, or timeout | Deterministic keyword and heuristic classifier assigns category and priority; marks `ai_status: 'fallback'`. Ticket creation is never blocked. |
| **Pinecone Vector DB** | Network timeout or unconfigured key | Local semantic & keyword scoring over in-memory BookLeaf Knowledge Base chunks (`source: 'local_policy_fallback'`). |
| **Groq Draft Engine** | Offline / Unavailable | Synthesizes grounded response template from retrieved policies, author data, and BookLeaf communication standards. |
| **Supabase Cloud DB** | Local development / Offline | High-performance in-memory service store initialized with the official `bookleaf_sample_data.json` records (10 authors, 18 books) for 100% deterministic test execution. |
| **Supabase Realtime** | WebSocket disconnect | Graceful polling & refresh fallback with automatic reconnection logic. |
