"""
Campus Recover — Input Sanitization & Anti-XSS Utilities
"""

import re
import html

# Regex patterns for dangerous HTML tags and script elements
SCRIPT_TAG_RE = re.compile(r"<\s*script[^>]*>.*?<\s*/\s*script\s*>", re.IGNORECASE | re.DOTALL)
HTML_TAG_RE = re.compile(r"<[^>]+>")
EVENT_HANDLER_RE = re.compile(r"on\w+\s*=\s*[\"'][^\"']*[\"']", re.IGNORECASE)
JAVASCRIPT_URI_RE = re.compile(r"javascript\s*:", re.IGNORECASE)


def sanitize_text(text: str | None) -> str | None:
    """
    Sanitize user-provided text by stripping script tags, javascript: URIs,
    and stripping dangerous raw HTML to prevent Stored XSS attacks.
    """
    if text is None:
        return None
    
    if not isinstance(text, str):
        return text

    # Remove script blocks entirely
    cleaned = SCRIPT_TAG_RE.sub("", text)
    # Remove javascript: URIs
    cleaned = JAVASCRIPT_URI_RE.sub("", cleaned)
    # Remove inline event handlers (e.g. onerror=, onload=)
    cleaned = EVENT_HANDLER_RE.sub("", cleaned)
    # Strip HTML tags
    cleaned = HTML_TAG_RE.sub("", cleaned)
    # Normalize whitespace
    return cleaned.strip()
