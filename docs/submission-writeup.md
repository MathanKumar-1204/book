# BookLeaf Publishing — Technical Assignment Write-Up

## 1. What Was Prioritized
1. **End-to-End Ticket Lifecycle & Operational Reality**: Delivering a working product where author ticket submission instantly triggers AI classification, enters the admin queue, retrieves relevant policies from Pinecone RAG, generates grounded responses via Groq, and streams updates back to the author in real time.
2. **Data Isolation & Security**: Ensuring strict boundary controls: authors can never view another author's books or tickets, internal notes remain invisible to authors (both in the API and prompt contexts), and client-side credentials never hold elevated privileges.
3. **Resilience & Graceful Degradation**: Architecting the system so that external outages (Groq or Pinecone downtime) never crash the platform or block authors from raising urgent queries.

---

## 2. Key Architecture Decisions
- **Decoupled Client & Server Tier**: Vite + React 18 frontend communicating via authenticated REST API (`/api/v1`) with a modular Flask backend. This ensures validation, security rules, and prompt engineering stay strictly on the server.
- **Supabase PostgreSQL with RLS & Realtime**: PostgreSQL tables (`profiles`, `books`, `tickets`, `ticket_messages`, `ai_processing_logs`) backed by Row-Level Security policies and Realtime WebSocket publications on `ticket_messages`.
- **Hybrid Ingestion & Seed Strategy**: The official `bookleaf_sample_data.json` (10 authors, 18 books) is ingested with deterministic IDs and upsert semantics, preserving real statuses, zero/pending royalties, and books in production.

---

## 3. AI & RAG Implementation
- **Groq High-Speed LLM Inference**: Configured with `llama-3.3-70b-versatile` / `llama-3.1-8b-instant`. Uses structured JSON output mode with validation against the 6 exact categories and 4 priority tiers.
- **Pinecone Vector Retrieval**: BookLeaf operational policies are chunked semantically and indexed in Pinecone (`bookleaf-knowledge-base`). Top-k policy excerpts are injected into the draft prompt alongside specific book sales/royalty data.
- **Tone Calibration & Hallucination Guardrails**: Prompts enforce empathy, acknowledge the issue first, mandate specific dates/numbers, and strictly forbid claiming that an action (e.g. reprint, refund, stock re-sync) has occurred unless verified in the operational record. All AI drafts require human admin review before dispatch.

---

## 4. Important Trade-Offs
- **Synchronous vs Asynchronous Task Worker**: A persistent Celery/Redis queue adds deployment complexity for a technical demonstration. To maintain high reliability without extra infrastructure, AI classification runs within a bounded timeout (<10s) with an immediate deterministic rule fallback if the external API exceeds bounds.
- **Configurable Embedding Service**: Heavy PyTorch sentence-transformer models can cause cold-start latency on serverless/container hosts. A deterministic semantic vector projection model was implemented as the default provider, ensuring dimension compatibility with Pinecone while maintaining fast startup.

---

## 5. Production Evolution Roadmap
1. **Background Job Queue**: Migrate classification and email dispatch to Celery with Redis for asynchronous background processing during massive peak volumes.
2. **Direct Storage Integration**: Enable private Supabase Storage buckets for author copy defect photos and royalty bank payment receipts with presigned expiring URLs.
3. **Fine-Tuned Specialized Classifier**: Fine-tune a lightweight model on historical BookLeaf support tickets to lower latency and inference costs to near zero.
