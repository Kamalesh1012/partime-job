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
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    AUTH_ENV: str = os.getenv("AUTH_ENV", "production")

    # SMS / WhatsApp OTP Provider Configuration (MSG91 / Twilio / Exotel)
    SMS_PROVIDER: str = os.getenv("SMS_PROVIDER", "msg91")  # msg91, twilio, exotel
    MSG91_AUTH_KEY: str = os.getenv("MSG91_AUTH_KEY", os.getenv("SMS_API_KEY", ""))
    MSG91_TEMPLATE_ID: str = os.getenv("MSG91_TEMPLATE_ID", os.getenv("SMS_TEMPLATE_ID", ""))
    MSG91_SENDER_ID: str = os.getenv("MSG91_SENDER_ID", os.getenv("SMS_SENDER_ID", "SEWAAI"))
    
    # Twilio Configuration
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", os.getenv("SMS_ACCOUNT_SID", ""))
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", os.getenv("SMS_AUTH_TOKEN", ""))
    TWILIO_FROM_NUMBER: str = os.getenv("TWILIO_FROM_NUMBER", os.getenv("SMS_FROM_NUMBER", ""))
    TWILIO_VERIFY_SERVICE_SID: str = os.getenv("TWILIO_VERIFY_SERVICE_SID", "")

    # Email Provider Configuration (Resend / SendGrid / SMTP)
    EMAIL_PROVIDER: str = os.getenv("EMAIL_PROVIDER", "resend")
    EMAIL_API_KEY: str = os.getenv("EMAIL_API_KEY", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "auth@sewaa.in")
    EMAIL_FROM_NAME: str = os.getenv("EMAIL_FROM_NAME", "SEWAA India")

    class Config:
        extra = "allow"


settings = Settings()
