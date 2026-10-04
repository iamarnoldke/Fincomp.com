"""
Records what a signed-in user does, so the Dashboard's "Recent Activity"
feed and "Your Activity" count show real history.

Two rules keep the log useful and the app safe:

1. Throttling. The comparison screens call the backend every time a slider
   moves or a key is typed. The same entry is therefore only written once
   per DEDUPE_MINUTES, otherwise the feed would fill with copies of
   "Compared personal loans".
2. Never break the page. Logging is a side effect. If it fails for any
   reason, the error is swallowed and the user still gets their results.
"""
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.user_activity import UserActivityLog

logger = logging.getLogger(__name__)

DEDUPE_MINUTES = 30


async def log_activity(
    db: AsyncSession,
    user: User | None,
    kind: str,
    description: str,
    dedupe_minutes: int = DEDUPE_MINUTES,
) -> None:
    """kind must be one of: compare, score, save, apply. No-op for anonymous users."""
    if user is None:
        return

    try:
        now = datetime.now(timezone.utc)
        recent = await db.execute(
            select(UserActivityLog.id)
            .where(
                UserActivityLog.user_id == user.id,
                UserActivityLog.kind == kind,
                UserActivityLog.description == description,
                UserActivityLog.occurred_at >= now - timedelta(minutes=dedupe_minutes),
            )
            .limit(1)
        )
        if recent.first() is not None:
            return

        db.add(
            UserActivityLog(
                user_id=user.id, kind=kind, description=description, occurred_at=now
            )
        )
        await db.commit()
    except Exception:  # noqa: BLE001 - logging must never break the request
        logger.exception("Could not record user activity")
        await db.rollback()