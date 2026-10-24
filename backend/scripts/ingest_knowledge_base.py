"""
BookLeaf Publishing - Pinecone Knowledge Base Ingestion Script
Embeds BookLeaf policies and upserts them idempotently into Pinecone vector index.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import Config
from app.services.rag_service import rag_service

def main():
    print("==================================================")
    print(" BookLeaf Publishing - Pinecone Knowledge Ingestion")
    print("==================================================")
    print(f"Index Name: {Config.PINECONE_INDEX_NAME}")
    print(f"Embedding Provider: {Config.EMBEDDING_PROVIDER}")
    print(f"Embedding Dimension: {Config.EMBEDDING_DIMENSION}")
    print("Starting ingestion...")

    res = rag_service.ingest_knowledge_base()
    print("Result:", res)
    print("==================================================")

if __name__ == "__main__":
    main()
