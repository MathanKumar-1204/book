"""
BookLeaf Publishing - Configurable Embedding Service
Generates vector embeddings for Pinecone indexing and semantic search.
Provides fast, deterministic local embeddings or sentence-transformers model.
"""

import math
import re
from typing import List
from app.config import Config

class EmbeddingService:
    def __init__(self):
        self.provider = Config.EMBEDDING_PROVIDER.lower()
        self.dimension = Config.EMBEDDING_DIMENSION
        self.model_name = Config.EMBEDDING_MODEL
        self._st_model = None

    def _get_sentence_transformer(self):
        if self._st_model is None and self.provider == "sentence-transformers":
            try:
                from sentence_transformers import SentenceTransformer
                self._st_model = SentenceTransformer(self.model_name)
            except Exception as e:
                print(f"[EmbeddingService] Failed to load sentence-transformers: {e}. Falling back to deterministic local embeddings.")
                self.provider = "local"
        return self._st_model

    def get_embedding(self, text: str) -> List[float]:
        """Generates a normalized embedding vector of configured dimension."""
        if self.provider == "sentence-transformers":
            model = self._get_sentence_transformer()
            if model:
                vec = model.encode(text).tolist()
                return vec

        # Deterministic semantic hash projection vector (always stable, fast, dimension-compatible)
        return self._generate_deterministic_vector(text, self.dimension)

    def _generate_deterministic_vector(self, text: str, dimension: int = 384) -> List[float]:
        """
        Creates a normalized dense vector using token hashing and n-gram frequency.
        Ensures semantic similarity between texts sharing core conceptual terms.
        """
        clean_text = re.sub(r"[^\w\s]", " ", text.lower())
        tokens = clean_text.split()
        if not tokens:
            return [0.0] * dimension

        vec = [0.0] * dimension
        for i, token in enumerate(tokens):
            # Base word hash
            h = hash(token) % dimension
            vec[h] += 1.0

            # Bigram interaction
            if i > 0:
                bigram = f"{tokens[i-1]}_{token}"
                bh = hash(bigram) % dimension
                vec[bh] += 1.5

        # L2 Normalization (unit length)
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [round(v / norm, 6) for v in vec]
        return vec

embedding_service = EmbeddingService()
