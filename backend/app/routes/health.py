"""
BookLeaf Publishing - Health Check Route
Provides system status, timestamp, and integration connectivity indicators.
"""

from datetime import datetime, timezone
from flask import Blueprint, jsonify
from app.config import Config
from app.services.supabase_service import supabase_service
from app.services.ai_service import ai_service
from app.services.rag_service import rag_service

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "BookLeaf Publishing API",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "integrations": {
            "supabase_database": "connected" if supabase_service.is_connected else "in_memory_mock_fallback",
            "groq_ai": "configured" if ai_service.client else "deterministic_fallback",
            "groq_model": Config.GROQ_MODEL,
            "pinecone_rag": "connected" if rag_service.is_connected else "local_policy_fallback",
            "pinecone_index": Config.PINECONE_INDEX_NAME,
            "embedding_provider": Config.EMBEDDING_PROVIDER,
        }
    }), 200
