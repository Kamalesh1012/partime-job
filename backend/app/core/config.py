import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env from backend directory (works locally and on Vercel)
_backend_dir = Path(__file__).resolve().parent.parent.parent
_project_root = _backend_dir.parent

# Try loading from multiple locations
load_dotenv(_backend_dir / ".env")
load_dotenv(_project_root / ".env")


class Settings(BaseSettings):
    # Supabase - support both old and new key names
    SUPABASE_URL: str = (
        os.getenv("SUPABASE_URL", "")
    )
    SUPABASE_KEY: str = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY", "")
    )
    SUPABASE_ANON_KEY: str = (
        os.getenv("SUPABASE_ANON_KEY", "")
    )

    # JWT
    SECRET_KEY: str = (
        os.getenv("JWT_SECRET")
        or os.getenv("SECRET_KEY", "fallback-dev-key-change-in-production")
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(
        os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30")
    )

    # App
    FRONTEND_URL: str = os.getenv(
        "FRONTEND_URL", "http://localhost:5173"
    )
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    class Config:
        extra = "allow"


settings = Settings()
