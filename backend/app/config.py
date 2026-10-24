"""
BookLeaf Publishing - Application Configuration
Validates and exposes configuration parameters from environment variables.
"""

import os
from typing import List
from dotenv import load_dotenv

# Load .env file from backend root or current directory
load_dotenv()

class Config:
    FLASK_ENV: str = os.getenv("FLASK_ENV", "development")
    DEBUG: bool = os.getenv("FLASK_DEBUG", "1").lower() in ("1", "true", "yes")
    PORT: int = int(os.getenv("PORT", "5000"))

    # Frontend CORS Allowlist
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", f"{FRONTEND_ORIGIN},http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173").split(",")
        if origin.strip()
    ]

    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")

    # Groq Cloud AI Configuration
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    # Pinecone Vector DB Configuration
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "bookleaf-knowledge-base")
    PINECONE_ENVIRONMENT: str = os.getenv("PINECONE_ENVIRONMENT", "us-east-1")

    # Embedding Provider Configuration
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "local")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "384"))

    # Log Level
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    @classmethod
    def is_supabase_configured(cls) -> bool:
        return bool(cls.SUPABASE_URL and (cls.SUPABASE_SERVICE_ROLE_KEY or cls.SUPABASE_ANON_KEY))

    @classmethod
    def is_groq_configured(cls) -> bool:
        return bool(cls.GROQ_API_KEY and cls.GROQ_API_KEY != "gsk_your_groq_api_key_here")

    @classmethod
    def is_pinecone_configured(cls) -> bool:
        return bool(cls.PINECONE_API_KEY and cls.PINECONE_API_KEY != "your-pinecone-api-key-here")
