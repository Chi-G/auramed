from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AuraMed"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "yoursecretkey"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    DATABASE_URL: Optional[str] = "sqlite:///./sql_app.db"
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000"
    ]

    # SMTP Settings
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = 587
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = "info@auramed.com"
    EMAILS_FROM_NAME: Optional[str] = "AuraMed"
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 24
    
    # Paystack Settings
    PAYSTACK_SECRET_KEY: Optional[str] = None
    PAYSTACK_PUBLIC_KEY: Optional[str] = None
    PAYSTACK_CALLBACK_URL: str = "http://127.0.0.1:8000/api/v1/billing/payment/callback"
    PAYSTACK_WEBHOOK_URL: Optional[str] = None

    @property
    def EMAILS_ENABLED(self) -> bool:
        return bool(self.SMTP_HOST and self.SMTP_PORT and self.EMAILS_FROM_EMAIL)

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
