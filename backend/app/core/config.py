from pydantic_settings import BaseSettings
from functools import lru_cache
import json
from typing import List, Optional

class Settings(BaseSettings):
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    llm_provider: str = "gemini"
    llm_model: str = "gemini-1.5-flash"
    
    jwt_secret_key: str = "SUPER_SECRET_CHANGE_ME"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 1440 # 24 hours
    
    embedding_model: str = "all-MiniLM-L6-v2"
    
    upload_dir: str = "./uploads"
    vector_store_path: str = "./vector_store"
    max_upload_size_mb: int = 50
    
    chunk_size: int = 1000
    chunk_overlap: int = 200
    
    top_k_results: int = 5
    temperature: float = 0.1
    max_tokens: int = 1024
    
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: str = '["http://localhost:3000","http://localhost:5173","http://localhost:8080"]'

    @property
    def cors_origins_list(self) -> List[str]:
        try:
            return json.loads(self.cors_origins)
        except Exception:
            return ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
