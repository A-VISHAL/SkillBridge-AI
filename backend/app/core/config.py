import os
from dotenv import load_dotenv

load_dotenv()


def _get_env(*names: str, default: str = "") -> str:
    """Return the first non-empty environment variable from a list of names."""
    for name in names:
        value = os.getenv(name)
        if value is not None and str(value).strip() != "":
            return str(value).strip()
    return default


def _normalize_api_key(value: str) -> str:
    """Normalize common key formats like quoted strings or Bearer-prefixed values."""
    key = (value or "").strip().strip('"').strip("'")
    if key.lower().startswith("bearer "):
        key = key[7:].strip()
    return key

class Settings:
    PROJECT_NAME: str = "SkillBridge AI API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Agentic Career Operating System - HackHazards '26"
    
    # Oxlo API
    OXLO_API_KEY: str = _normalize_api_key(
        _get_env("OXLO_API_KEY", "OXLO_API_TOKEN", "OPENAI_API_KEY", "ANTHROPIC_API_KEY")
    )
    OXLO_CHAT_ENDPOINT: str = _get_env("OXLO_CHAT_ENDPOINT", default="https://api.oxlo.ai/v1/chat")
    OXLO_EMBEDDINGS_ENDPOINT: str = os.getenv("OXLO_EMBEDDINGS_ENDPOINT", "https://api.oxlo.ai/v1/embeddings")
    
    # Job Search APIs
    ADZUNA_APP_ID: str = os.getenv("ADZUNA_APP_ID", "")
    ADZUNA_APP_KEY: str = os.getenv("ADZUNA_APP_KEY", "")
    RAPIDAPI_KEY: str = os.getenv("RAPIDAPI_KEY", "")
    
    # Server Config
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "5"))
    
    # Redis (optional)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    CACHE_TTL_MINUTES: int = int(os.getenv("CACHE_TTL_MINUTES", "15"))
    
    # Job Search Config
    MAX_JOBS_PER_QUERY: int = int(os.getenv("MAX_JOBS_PER_QUERY", "50"))
    MIN_SKILL_MATCH_RATIO: float = float(os.getenv("MIN_SKILL_MATCH_RATIO", "0.6"))
    API_TIMEOUT_SECONDS: int = int(os.getenv("API_TIMEOUT_SECONDS", "10"))

settings = Settings()
