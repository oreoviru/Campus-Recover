"""
Campus Recover — Application Configuration

All settings are loaded from environment variables via Pydantic Settings.
Never hardcode secrets — use .env file or system environment variables.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application ---
    app_name: str = "CampusRecover"
    app_env: str = "development"
    debug: bool = True
    api_prefix: str = "/api/v1"

    # --- Database ---
    database_url: str = "postgresql://campus_user:campus_pass@localhost:5432/campus_recover"

    # --- Authentication ---
    jwt_secret_key: str = "change-this-to-a-random-256-bit-secret-key-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    # --- Security ---
    allowed_origins: str = "http://localhost:5173"
    allowed_email_domains: str = "student.university.edu.in,university.edu.in"

    # --- Storage ---
    storage_backend: str = "local"
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 10
    allowed_file_types: str = "image/jpeg,image/png,image/webp"

    # --- AI Matching ---
    # ai_image_model supports:
    #   - 'clip-ViT-B-32' (standard CLIP 512-dim embedding model)
    #   - 'openai/clip-vit-base-patch32' (HuggingFace CLIP base patch 32)
    #   - 'lightweight' (fast zero-download CV spatial color/gradient visual descriptor)
    ai_text_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    ai_image_model: str = "clip-ViT-B-32"
    match_threshold: float = 0.45
    text_weight: float = 0.30
    image_weight: float = 0.30
    location_weight: float = 0.20
    time_weight: float = 0.10
    attribute_weight: float = 0.10

    # --- Location Thresholds (meters) ---
    location_very_high: int = 50
    location_high: int = 200
    location_medium: int = 500
    location_low: int = 1000

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse comma-separated origins into a list."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    @property
    def allowed_email_domains_list(self) -> List[str]:
        """Parse comma-separated email domains into a list."""
        return [domain.strip() for domain in self.allowed_email_domains.split(",")]

    @property
    def allowed_file_types_list(self) -> List[str]:
        """Parse comma-separated file types into a list."""
        return [ft.strip() for ft in self.allowed_file_types.split(",")]

    @property
    def max_file_size_bytes(self) -> int:
        """Convert MB limit to bytes."""
        return self.max_file_size_mb * 1024 * 1024

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


# Singleton settings instance
settings = Settings()
