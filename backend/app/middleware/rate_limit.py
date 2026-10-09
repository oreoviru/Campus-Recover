"""
Campus Recover — Rate Limiting Middleware & Dependencies

Protects against:
- Brute-force credential attacks on /auth/login
- Account registration spam on /auth/register
- Verification answer guessing on /claims
- Storage exhaustion / DoS on /upload/image
- General API flood / DoS
"""

import time
import threading
from typing import Dict, List, Optional, Callable
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from fastapi import HTTPException, status, Depends

from app.config import settings


class InMemoryRateLimiter:
    """Thread-safe sliding-window rate limiter."""

    def __init__(self):
        self._lock = threading.Lock()
        self._records: Dict[str, List[float]] = {}

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> tuple[bool, int, int]:
        """
        Check if request under key is allowed.
        Returns:
            (is_allowed: bool, current_count: int, retry_after_seconds: int)
        """
        now = time.time()
        cutoff = now - window_seconds

        with self._lock:
            timestamps = self._records.get(key, [])
            # Prune expired timestamps
            timestamps = [t for t in timestamps if t > cutoff]

            if len(timestamps) >= max_requests:
                earliest = timestamps[0]
                retry_after = max(1, int(earliest + window_seconds - now))
                self._records[key] = timestamps
                return False, len(timestamps), retry_after

            timestamps.append(now)
            self._records[key] = timestamps
            return True, len(timestamps), 0

    def reset(self):
        """Clear all rate limiting records (useful for testing)."""
        with self._lock:
            self._records.clear()


# Global rate limiter instance
limiter = InMemoryRateLimiter()


def get_client_ip(request: Request) -> str:
    """Extract real client IP, respecting trusted proxy headers if present."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


def rate_limit(limit: int, window_seconds: int = 60, prefix: str = "endpoint"):
    """
    FastAPI dependency for endpoint-level rate limiting.
    Usage:
        @router.post("/login", dependencies=[Depends(rate_limit(10, 60, "login"))])
    """
    def dependency(request: Request):
        if not getattr(settings, "rate_limit_enabled", True):
            return

        client_ip = get_client_ip(request)
        key = f"{prefix}:{client_ip}"

        allowed, count, retry_after = limiter.is_allowed(key, limit, window_seconds)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded for this action. Please try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )

    return dependency


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Global per-IP rate limiting middleware to prevent volumetric DoS."""

    def __init__(self, app, max_requests: int = 150, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Check if rate limiting is enabled
        if not getattr(settings, "rate_limit_enabled", True):
            return await call_next(request)

        # Bypass static files and health checks
        path = request.url.path
        if path in ("/health", "/docs", "/redoc", "/openapi.json") or path.startswith("/uploads"):
            return await call_next(request)

        client_ip = get_client_ip(request)
        key = f"global:{client_ip}"

        allowed, count, retry_after = limiter.is_allowed(
            key, self.max_requests, self.window_seconds
        )

        if not allowed:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                headers={"Retry-After": str(retry_after)},
                content={
                    "success": False,
                    "error": {
                        "code": "HTTP_429",
                        "message": f"Too many requests from your IP. Please try again in {retry_after} seconds.",
                        "details": None,
                    },
                },
            )

        response = await call_next(request)
        return response
