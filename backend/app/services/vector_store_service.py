import os
import json
import faiss
import numpy as np
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
from app.core.config import get_settings

settings = get_settings()

class VectorStoreService:
    def __init__(self):
        self.embedder = SentenceTransformer(settings.embedding_model)
        self.dimension = self.embedder.get_sentence_embedding_dimension()
        self.index = faiss.IndexFlatIP(self.dimension)
        self._metadata: Dict[int, Dict[str, Any]] = {}
        self._next_id: int = 0
        self._load_from_disk()

    def add_documents(self, texts: List[str], metadatas: List[Dict[str, Any]]) -> None:
        if not texts:
            return
            
        embeddings = self.embedder.encode(texts, normalize_embeddings=True, batch_size=32)
        embeddings = np.array(embeddings).astype("float32")
        
        for i, meta in enumerate(metadatas):
            self._metadata[self._next_id + i] = meta
            
        self.index.add(embeddings)
        self._next_id += len(texts)
        self._save_to_disk()

    def similarity_search(self, query: str, top_k: int, filter_doc_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.index.ntotal == 0:
            return []
            
        query_embedding = self.embedder.encode([query], normalize_embeddings=True)
        query_embedding = np.array(query_embedding).astype("float32")
        
        search_k = top_k * 3 if filter_doc_id else top_k
        distances, indices = self.index.search(query_embedding, search_k)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue
                
            meta = self._metadata.get(idx, {})
            if filter_doc_id and meta.get("doc_id") != filter_doc_id:
                continue
                
            result = meta.copy()
            result["score"] = float(dist)
            results.append(result)
            
            if len(results) >= top_k:
                break
                
        return results

    def delete_by_doc_id(self, doc_id: str) -> int:
        ids_to_keep = []
        new_metadata = {}
        new_next_id = 0
        deleted_count = 0
        
        for idx, meta in self._metadata.items():
            if meta.get("doc_id") == doc_id:
                deleted_count += 1
            else:
                ids_to_keep.append(idx)
                new_metadata[new_next_id] = meta
                new_next_id += 1
                
        if deleted_count == 0:
            return 0
            
        if not ids_to_keep:
            self.index = faiss.IndexFlatIP(self.dimension)
            self._metadata = {}
            self._next_id = 0
        else:
            all_vectors = []
            for idx in ids_to_keep:
                vector = self.index.reconstruct(idx)
                all_vectors.append(vector)
            
            embeddings = np.array(all_vectors).astype("float32")
            self.index = faiss.IndexFlatIP(self.dimension)
            self.index.add(embeddings)
            self._metadata = new_metadata
            self._next_id = new_next_id
            
        self._save_to_disk()
        return deleted_count

    def get_stats(self) -> Dict[str, Any]:
        doc_ids = set()
        for meta in self._metadata.values():
            if "doc_id" in meta:
                doc_ids.add(meta["doc_id"])
                
        return {
            "total_chunks": self.index.ntotal,
            "total_documents": len(doc_ids),
            "dimension": self.dimension
        }

    def _save_to_disk(self) -> None:
        os.makedirs(settings.vector_store_path, exist_ok=True)
        index_path = os.path.join(settings.vector_store_path, "index.faiss")
        meta_path = os.path.join(settings.vector_store_path, "metadata.json")
        
        faiss.write_index(self.index, index_path)
        
        meta_to_save = {str(k): v for k, v in self._metadata.items()}
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta_to_save, f)

    def _load_from_disk(self) -> None:
        index_path = os.path.join(settings.vector_store_path, "index.faiss")
        meta_path = os.path.join(settings.vector_store_path, "metadata.json")
        
        if os.path.exists(index_path) and os.path.exists(meta_path):
            self.index = faiss.read_index(index_path)
            
            with open(meta_path, "r", encoding="utf-8") as f:
                meta_loaded = json.load(f)
                
            self._metadata = {int(k): v for k, v in meta_loaded.items()}
            if self._metadata:
                self._next_id = max(self._metadata.keys()) + 1
            else:
                self._next_id = 0
