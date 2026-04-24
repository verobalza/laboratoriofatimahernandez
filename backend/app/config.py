from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List
import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")


class Settings(BaseSettings):
    """Configuración de la aplicación."""

    APP_NAME: str = "Laboratorio API"
    DEBUG: bool = True

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://deann-overoptimistic-teacherly.ngrok-free.dev",
        "https://laboratoriofatimahernandez-k1oq.vercel.app",
        "https://laboratoriofatimahernandez.vercel.app/"

    ]

    SUPABASE_URL: str | None = None
    SUPABASE_SERVICE_ROLE: str | None = None

    JWT_SECRET: str | None = None
    JWT_ALGORITHM: str | None = None
    JWT_EXPIRATION_HOURS: int | None = None

    @field_validator("ALLOWED_ORIGINS", mode="before")
    def _parse_allowed_origins(cls, value):
        """Parsear ALLOWED_ORIGINS desde .env como JSON o comma-separated."""
        if isinstance(value, str):
            v = value.strip()
            if not v:
                return []
            # Intentar parsear como JSON primero
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass
            # Si no es JSON, parsear como comma-separated
            origins = [o.strip().strip("'\"") for o in v.split(",") if o.strip()]
            return origins
        return value

    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra='allow'
    )


settings = Settings()
