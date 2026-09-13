from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.credit_score import CreditScoreSnapshot
from app.models.user import User
from app.schemas.credit_score import CreditScoreProfileOut
from app.services.credit_score_engine import build_profile, refresh_snapshot

router = APIRouter(prefix="/credit-score", tags=["credit-score"])

async def _latest_two_snapshots(
    db: AsyncSession, user_id: UUID
) -> tuple[CreditScoreSnapshot | None, CreditScoreSnapshot | None]:
    result = await db.execute(
        select(CreditScoreSnapshot)
        .where(CreditScoreSnapshot.user_id == user_id)
        .order_by(CreditScoreSnapshot.recorded_at.desc())
        .limit(2)
    )
    rows = result.scalars().all()
    latest = rows[0] if len(rows) > 0 else None
    previous = rows[1] if len(rows) > 1 else None
    return latest, previous


@router.get("/me", response_model=CreditScoreProfileOut)
async def get_my_credit_score(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """
    Powers the Credit Score screen. If the user has no snapshot yet
    (first visit), one is generated and stored on the fly.
    """
    latest, previous = await _latest_two_snapshots(db, user.id)
    if latest is None:
        latest = await refresh_snapshot(db, user)
        previous = None
    return await build_profile(db, latest, previous)


@router.post("/refresh", response_model=CreditScoreProfileOut)
async def refresh_my_credit_score(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Powers the Refresh button — recomputes and stores a new snapshot."""
    previous, _ = await _latest_two_snapshots(db, user.id)
    latest = await refresh_snapshot(db, user)
    return await build_profile(db, latest, previous)