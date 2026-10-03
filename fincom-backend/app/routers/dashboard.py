from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardSummaryOut
from app.services.dashboard_summary import build_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryOut)
async def get_dashboard_summary(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """
    Powers the Dashboard screen. Requires a signed-in user because it
    includes their latest credit score and recent activity; everything
    else (rates, popular products, counts) is computed from the product
    tables on every request.
    """
    return await build_dashboard_summary(db, user)