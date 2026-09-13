"""
Async database engine + session factory. Tables already exist in
Postgres (created by db/schema.sql) — SQLAlchemy here is only used to
query/insert, never to create or migrate schema. Migrations are handled
separately (Alembic) once the schema needs to change.
"""
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(
    settings.database_url,
    pool_size=10,          # base connection pool per API instance
    max_overflow=20,       # burst capacity under load
    pool_pre_ping=True,    # detect stale/dropped connections before using them
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: yields a session, closes it after the request."""
    async with AsyncSessionLocal() as session:
        yield session
