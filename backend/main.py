"""
SEWAA India - Part-Time Jobs, Events & Local Services Platform API
Main FastAPI Application
"""
import sys
import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from dotenv import load_dotenv

# Ensure project root and backend dir are on sys.path
_this_dir = Path(__file__).resolve().parent
_project_root = _this_dir.parent

for p in [str(_project_root), str(_this_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Load environment variables
load_dotenv(_this_dir / ".env")
load_dotenv(_project_root / ".env")

# Import application settings
from app.core.config import settings

# Import routers
from app.routes import auth
from app.routes import jobs
from app.routes import applications
from app.routes import profiles
from app.routes import notifications
from app.routes import admin
from app.routes import locations
from app.routes import services
from app.routes import safety
from app.routes import active_jobs


# Lifespan context
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("SEWAA API Starting...")
    yield
    print("SEWAA API Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="SEWAA",
    description="Part-Time Jobs, Events, Technicians & Local Home Services Platform API",
    version="2.1.0",
    lifespan=lifespan,
)


# ==================== CORS ====================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8001",
        "http://localhost:8001",
        "https://partime-job.vercel.app",
        "https://bucolic-sunflower-10231c.netlify.app",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)


# ==================== ROUTERS ====================

app.include_router(
    locations.router,
    prefix="/api/locations",
    tags=["Locations & Pan-India Search"],
)

app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"],
)

app.include_router(
    jobs.router,
    prefix="/api/jobs",
    tags=["Jobs & Events"],
)

app.include_router(
    services.router,
    prefix="/api/services",
    tags=["Technicians & Home Services"],
)

app.include_router(
    safety.router,
    prefix="/api/safety",
    tags=["Emergency Safety & Contacts"],
)

app.include_router(
    active_jobs.router,
    prefix="/api/active-jobs",
    tags=["Active Jobs Tracking"],
)

app.include_router(
    applications.router,
    prefix="/api/applications",
    tags=["Applications"],
)

app.include_router(
    profiles.router,
    prefix="/api/profiles",
    tags=["Profiles & Verification"],
)

app.include_router(
    notifications.router,
    prefix="/api/notifications",
    tags=["Notifications"],
)

app.include_router(
    admin.router,
    prefix="/api/admin",
    tags=["Admin & Moderation"],
)


# ==================== HEALTH & ROOT ====================

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "SEWAA API",
        "version": "2.1.0",
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to SEWAA – Part-Time Jobs, Events & Local Services API",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "version": "2.1.0"
    }


# ==================== LOCAL DEVELOPMENT ====================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
    )