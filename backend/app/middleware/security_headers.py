"""
Campus Recover — Security Headers Middleware

Enforces defensive HTTP response headers to protect against:
- Clickjacking (X-Frame-Options: DENY)
- MIME sniffing (X-Content-Type-Options: nosniff)
- Cross-site scripting (X-XSS-Protection)
- Referrer information leakage (Referrer-Policy: strict-origin-when-cross-origin)
- Browser feature abuse (Permissions-Policy)
"""

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware attaching defensive security headers to every HTTP response."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        # Protect against clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Prevent browser MIME-sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Enable XSS filtering
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Protect referrer URL leakage
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Restrict dangerous browser features
        response.headers["Permissions-Policy"] = "geolocation=(self), camera=(), microphone=()"

        # HSTS for production HTTPS connections
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        return response
