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

    # ---- Password reset email -------------------------------------------
    # Where the Angular app lives; the emailed link is built from this.
    frontend_url: str = "http://localhost:4200"
    reset_token_minutes: int = 30

    # Brevo (https://www.brevo.com) transactional email over HTTPS. Render's
    # free tier blocks SMTP ports, so we use their HTTP API. If the API key
    # is empty the reset link is printed in the server log instead of emailed
    # (handy for local development).
    brevo_api_key: str = ""
    mail_from_email: str = ""
    mail_from_name: str = "Fincomp"
        # ---- Bank of Uganda import ------------------------------------------
    # Secret the weekly job sends in X-Cron-Secret. Empty = endpoint disabled.
    cron_secret: str = ""


    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()