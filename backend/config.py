import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    APP_NAME: str = "RateGrabber - Smart NFC & QR Review System"
    BASE_URL: str = os.getenv("BASE_URL", "http://localhost:8000")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./rate_grabber.db")
    GOOGLE_PLACES_API_KEY: str = os.getenv("GOOGLE_PLACES_API_KEY", "")
    ADMIN_PIN: str = os.getenv("ADMIN_PIN", "123456")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "rate-grabber-super-secret-key-2026")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
