"""
BookLeaf Publishing - Pinecone RAG Knowledge Base Service
Handles semantic search over BookLeaf policies and provides graceful offline fallback.
"""

import math
from typing import List, Dict, Any, Optional
from app.config import Config
from app.constants import BOOKLEAF_KNOWLEDGE_BASE
from app.services.embedding_service import embedding_service

class RAGService:
    def __init__(self):
        self.pinecone_client = None
        self.index = None
        self.is_connected = False
        self._init_pinecone()

    def _init_pinecone(self):
        if Config.is_pinecone_configured():
            try:
                import pinecone
                # Handle pinecone v3 client API
                if hasattr(pinecone, "Pinecone"):
                    self.pinecone_client = pinecone.Pinecone(api_key=Config.PINECONE_API_KEY)
                    # Verify index exists
                    existing_indexes = [idx.name for idx in self.pinecone_client.list_indexes()]
                    if Config.PINECONE_INDEX_NAME in existing_indexes:
                        self.index = self.pinecone_client.Index(Config.PINECONE_INDEX_NAME)
                        self.is_connected = True
                    else:
                        print(f"[RAGService] Pinecone index '{Config.PINECONE_INDEX_NAME}' not found. Run ingestion script to create.")
                        self.is_connected = False
            except Exception as e:
                print(f"[RAGService] Pinecone initialization warning: {e}. Using local knowledge base fallback.")
                self.is_connected = False
        else:
            self.is_connected = False

    def ingest_knowledge_base(self) -> Dict[str, Any]:
        """Ingests BookLeaf policy documents into Pinecone index idempotently."""
        if not Config.is_pinecone_configured():
            return {
                "success": False,
                "message": "PINECONE_API_KEY is not configured in environment. Using local policy store.",
                "total_chunks": len(BOOKLEAF_KNOWLEDGE_BASE)
            }

        try:
            import pinecone
            client = pinecone.Pinecone(api_key=Config.PINECONE_API_KEY)
            index_name = Config.PINECONE_INDEX_NAME

            # Create index if not exists
            existing_indexes = [idx.name for idx in client.list_indexes()]
            if index_name not in existing_indexes:
                from pinecone import ServerlessSpec
                client.create_index(
                    name=index_name,
                    dimension=Config.EMBEDDING_DIMENSION,
                    metric="cosine",
                    spec=ServerlessSpec(cloud="aws", region="us-east-1")
                )

            index = client.Index(index_name)

            # Prepare vectors
            vectors = []
            for doc in BOOKLEAF_KNOWLEDGE_BASE:
                text_to_embed = f"{doc['title']}: {doc['content']}"
                vector = embedding_service.get_embedding(text_to_embed)
                vectors.append({
                    "id": doc["id"],
                    "values": vector,
                    "metadata": {
                        "doc_id": doc["id"],
                        "title": doc["title"],
                        "category": doc["category"],
                        "text": doc["content"],
                        "source": "bookleaf_official_policy"
                    }
                })

            # Upsert in batches
            index.upsert(vectors=vectors, namespace="bookleaf-policies")
            self.index = index
            self.is_connected = True

            return {
                "success": True,
                "index_name": index_name,
                "total_upserted": len(vectors),
                "dimension": Config.EMBEDDING_DIMENSION
            }
        except Exception as e:
            print(f"[RAGService] Ingestion failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to upsert to Pinecone. Local fallback will be used."
            }

    def retrieve_relevant_chunks(
        self,
        query: str,
        category: Optional[str] = None,
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top relevant policy chunks.
        Queries Pinecone if connected; otherwise falls back gracefully to deterministic local matching.
        """
        # Try Pinecone first
        if self.is_connected and self.index:
            try:
                query_vector = embedding_service.get_embedding(query)
                filter_dict = {}
                if category:
                    filter_dict["category"] = {"$eq": category}

                res = self.index.query(
                    vector=query_vector,
                    top_k=top_k,
                    include_metadata=True,
                    namespace="bookleaf-policies",
                    filter=filter_dict if filter_dict else None
                )

                if res and res.matches:
                    chunks = []
                    for match in res.matches:
                        metadata = match.metadata or {}
                        chunks.append({
                            "id": match.id,
                            "title": metadata.get("title", "Policy Section"),
                            "category": metadata.get("category", "General Inquiry"),
                            "content": metadata.get("text", ""),
                            "score": round(float(match.score or 0.0), 3),
                            "source": "pinecone_vector_db"
                        })
                    if chunks:
                        return chunks
            except Exception as e:
                print(f"[RAGService] Pinecone query failed ({e}). Reverting to local policy fallback.")

        # Local deterministic fallback
        return self._retrieve_local_fallback(query, category=category, top_k=top_k)

    def _retrieve_local_fallback(
        self,
        query: str,
        category: Optional[str] = None,
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Deterministic local semantic & keyword retrieval when Pinecone is unavailable.
        Uses cosine similarity of local embedding vectors + category alignment.
        """
        query_vector = embedding_service.get_embedding(query)
        scored_docs = []

        for doc in BOOKLEAF_KNOWLEDGE_BASE:
            # Score vector similarity
            doc_text = f"{doc['title']} {doc['content']}"
            doc_vector = embedding_service.get_embedding(doc_text)

            # Cosine similarity (vectors are unit normalized)
            similarity = sum(qv * dv for qv, dv in zip(query_vector, doc_vector))

            # Category boost if relevant
            if category and doc.get("category") == category:
                similarity += 0.25

            # Keyword query overlap boost
            q_words = set(query.lower().split())
            d_words = set(doc_text.lower().split())
            overlap = len(q_words.intersection(d_words))
            similarity += min(overlap * 0.05, 0.2)

            scored_docs.append({
                "id": doc["id"],
                "title": doc["title"],
                "category": doc["category"],
                "content": doc["content"],
                "score": round(max(0.1, min(0.99, float(similarity))), 3),
                "source": "local_policy_fallback"
            })

        scored_docs.sort(key=lambda x: x["score"], reverse=True)
        return scored_docs[:top_k]

rag_service = RAGService()
