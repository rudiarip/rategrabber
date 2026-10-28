import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    APP_NAME: str = "TapStar - Smart NFC & QR Review Management"
    APP_VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    BASE_URL: str = os.getenv("BASE_URL", "http://localhost:8000")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # PostgreSQL by default, with fallback support
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/tapstar_db"
    )
    
    # JWT & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "tapstar-super-secret-jwt-key-production-ready-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Google Places
    GOOGLE_PLACES_API_KEY: str = os.getenv("GOOGLE_PLACES_API_KEY", "")
    
    # Super Admin Initial Seed
    DEFAULT_SUPERADMIN_USERNAME: str = os.getenv("DEFAULT_SUPERADMIN_USERNAME", "superadmin")
    DEFAULT_SUPERADMIN_EMAIL: str = os.getenv("DEFAULT_SUPERADMIN_EMAIL", "admin@tapstar.local")
    DEFAULT_SUPERADMIN_PASSWORD: str = os.getenv("DEFAULT_SUPERADMIN_PASSWORD", "Password123!")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
