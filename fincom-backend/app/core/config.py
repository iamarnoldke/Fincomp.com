"""
Central app configuration. Reads from a .env file (see .env.example)
so secrets never get hardcoded or committed.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # e.g. postgresql+asyncpg://postgres:yourpassword@localhost:5432/fincom_dev
    database_url: str

    # Comma-separated list of origins allowed to call this API.
    # In dev this is your Angular dev server; in prod it's your Vercel domain.
    cors_origins: str = "http://localhost:4200,https://fincom-five.vercel.app"

    jwt_secret_key: str = "change-me-in-.env"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 24h

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
