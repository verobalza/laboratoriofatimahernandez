from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Configuración de la aplicación."""
    
    # API
    APP_NAME: str = "Laboratorio API"
    DEBUG: bool = True
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "https://*.vercel.app",
    ]
    
    # Database (para futuro use)
    DATABASE_URL: str = "sqlite:///./test.db"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
