"""
WorkMate Chennai - Job Portal API
Main FastAPI application
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import application settings
from backend.app.core.config import settings

# Import routers using the full backend package path
# Uses the fully-developed routes from app.routes (with Supabase auth, JWT, etc.)
from backend.app.routes import auth
from backend.app.routes import applications
from backend.app.routes import profiles
from backend.app.routes import notifications

# These routes are in backend.routes (top-level)
from backend.routes import jobs
from backend.routes import admin


# Lifespan context
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("WorkMate Chennai API Starting...")
    yield
    print("WorkMate Chennai API Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="WorkMate Chennai",
    description="Job portal API for students and employers in Chennai",
    version="1.0.0",
    lifespan=lifespan,
)


# ==================== CORS ====================

frontend_url = (
    settings.FRONTEND_URL
    if hasattr(settings, "FRONTEND_URL") and settings.FRONTEND_URL
    else "http://localhost:5173"
)

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://bucolic-sunflower-10231c.netlify.app",
    frontend_url,
]

# Remove duplicates
origins = list(dict.fromkeys(origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== TRUSTED HOST ====================

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "localhost",
        "127.0.0.1",
        "workmate-chennai.netlify.app",
        "partime-job.vercel.app",
        "*.vercel.app",
    ],
)


# ==================== ROUTERS ====================

app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"],
)

app.include_router(
    jobs.router,
    prefix="/api/jobs",
    tags=["Jobs"],
)

app.include_router(
    applications.router,
    prefix="/api/applications",
    tags=["Applications"],
)

app.include_router(
    profiles.router,
    prefix="/api/profiles",
    tags=["Profiles"],
)

app.include_router(
    admin.router,
    prefix="/api/admin",
    tags=["Admin"],
)

app.include_router(
    notifications.router,
    prefix="/api/notifications",
    tags=["Notifications"],
)


# ==================== HEALTH CHECK ====================

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "WorkMate Chennai API",
        "version": "1.0.0",
    }


# ==================== ROOT ====================

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to WorkMate Chennai API",
        "docs": "/docs",
        "openapi": "/openapi.json",
    }


# ==================== LOCAL DEVELOPMENT ====================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )