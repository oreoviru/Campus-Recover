"""
Campus Recover — FastAPI Application Entry Point

This is the root of the backend application. It:
1. Creates the FastAPI app instance
2. Configures CORS middleware
3. Registers API routers
4. Provides health check endpoint
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Runs startup logic before yield and shutdown logic after.
    """
    # --- Startup ---
    print(f"🚀 Starting {settings.app_name} ({settings.app_env})")

    # Ensure upload directory exists
    os.makedirs(settings.upload_dir, exist_ok=True)

    yield

    # --- Shutdown ---
    print(f"🛑 Shutting down {settings.app_name}")


app = FastAPI(
    title=settings.app_name,
    description="AI-Powered Campus Lost & Found Platform",
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# ---- CORS Middleware ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Static file serving for uploads (development only) ----
if settings.is_development:
    os.makedirs(settings.upload_dir, exist_ok=True)
    app.mount(
        "/uploads",
        StaticFiles(directory=settings.upload_dir),
        name="uploads",
    )


# ---- Health Check ----
@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "environment": settings.app_env,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ---- Root ----
@app.get("/", tags=["System"])
async def root():
    """Root endpoint — API information."""
    return {
        "app": settings.app_name,
        "version": "0.1.0",
        "description": "AI-Powered Campus Lost & Found Platform",
        "docs": "/docs",
        "health": "/health",
    }


# ---- API Router Registration ----
# Routers will be registered here as they are built in subsequent phases.
# Example (Phase 3):
#   from app.api.v1 import auth
#   app.include_router(auth.router, prefix=settings.api_prefix)
