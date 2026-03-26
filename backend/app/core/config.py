from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: Optional[str] = None
    ENVIRONMENT: Optional[str] = None
    API_V1_STR: Optional[str] = None
    SECRET_KEY: Optional[str] = None
    ACCESS_TOKEN_EXPIRE_MINUTES: Optional[int] = None
    DATABASE_URL: Optional[str] = None
    BACKEND_CORS_ORIGINS: list[str] = [] 

    # SMTP Settings
    SMTP_TLS: Optional[bool] = None
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = "AuraMed"
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 24
    
    # Paystack Settings
    PAYSTACK_SECRET_KEY: Optional[str] = None
    PAYSTACK_PUBLIC_KEY: Optional[str] = None
    PAYSTACK_CALLBACK_URL: Optional[str] = None
    PAYSTACK_WEBHOOK_URL: Optional[str] = None

    @property
    def EMAILS_ENABLED(self) -> bool:
        return bool(self.SMTP_HOST and self.SMTP_PORT and self.EMAILS_FROM_EMAIL)

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
