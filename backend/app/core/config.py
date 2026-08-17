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
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY", "")
    )
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")

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

    # App & Environment
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    AUTH_ENV: str = os.getenv("AUTH_ENV", "development")

    # SMS Provider Configuration
    SMS_PROVIDER: str = os.getenv("SMS_PROVIDER", "local_dev")  # twilio, msg91, exotel, supabase, local_dev
    SMS_API_KEY: str = os.getenv("SMS_API_KEY", "")
    SMS_AUTH_TOKEN: str = os.getenv("SMS_AUTH_TOKEN", "")
    SMS_ACCOUNT_SID: str = os.getenv("SMS_ACCOUNT_SID", "")
    SMS_FROM_NUMBER: str = os.getenv("SMS_FROM_NUMBER", "")
    SMS_SENDER_ID: str = os.getenv("SMS_SENDER_ID", "SEWAAI")
    SMS_TEMPLATE_ID: str = os.getenv("SMS_TEMPLATE_ID", "")

    # Email Provider Configuration
    EMAIL_PROVIDER: str = os.getenv("EMAIL_PROVIDER", "local_dev")  # resend, sendgrid, ses, smtp, local_dev
    EMAIL_API_KEY: str = os.getenv("EMAIL_API_KEY", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "auth@sewaa.in")
    EMAIL_FROM_NAME: str = os.getenv("EMAIL_FROM_NAME", "SEWAA India")

    class Config:
        extra = "allow"


settings = Settings()
