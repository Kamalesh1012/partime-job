"""
Supabase Database Configuration
"""

from supabase import create_client, Client
import os
from typing import Optional

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

# Global Supabase client
supabase_client: Optional[Client] = None

def get_supabase() -> Client:
    """Get or create Supabase client"""
    global supabase_client
    if supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise Exception("Supabase URL and KEY not configured")
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return supabase_client

async def get_db():
    """Dependency for database access"""
    return get_supabase()
