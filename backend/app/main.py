"""
Campus Recover — FastAPI Application Entry Point

This is the root of the backend application. It:
1. Creates the FastAPI app instance
2. Configures CORS middleware
3. Configures standard error response handlers
4. Registers API routers (Items CRUD for Phase 2)
5. Provides health check and root endpoints
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import os

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.api.v1.items import router as items_router


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
    version="0.2.0",
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


# ---- Global Exception Handlers (Standard Error Envelope) ----
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Format HTTPExceptions into standard ApiErrorResponse."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
                "details": None,
            },
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Format Pydantic validation errors cleanly."""
    errors = {}
    for err in exc.errors():
        field = ".".join(str(loc) for loc in err["loc"] if loc != "body")
        errors[field] = err["msg"]

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed.",
                "details": errors,
            },
        },
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
        "version": "0.2.0",
        "description": "AI-Powered Campus Lost & Found Platform",
        "docs": "/docs",
        "health": "/health",
    }


# ---- API Router Registration ----
# Register under standard /api/v1 prefix
app.include_router(items_router, prefix=settings.api_prefix)

# Also expose direct /items routes for standard REST endpoints
app.include_router(items_router, prefix="")
