import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()

class Settings(BaseSettings):
    SUPABASE_URL: str = os.getenv('SUPABASE_URL')
    # Prefer explicit service role env var name; fall back to SUPABASE_KEY if set
    SUPABASE_KEY: str = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY')
    SUPABASE_ANON_KEY: str = os.getenv('SUPABASE_ANON_KEY')
    SECRET_KEY: str = os.getenv('JWT_SECRET') or os.getenv('SECRET_KEY')
    ALGORITHM: str = os.getenv('ALGORITHM', 'HS256')
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRE_MINUTES', os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '30')))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv('JWT_REFRESH_TOKEN_EXPIRE_DAYS', '30'))
    FRONTEND_URL: str = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    ENVIRONMENT: str = os.getenv('ENVIRONMENT', 'development')

settings = Settings()
