from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.db.session import get_db
from app.models.account import AccountProduct
from app.schemas.account import AccountResult
from app.services.account_ranking import build_ranking

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=list[AccountResult])
async def list_accounts(
    account_type: str | None = Query(
        None, description="Account type slug, e.g. 'savings'. Omit for all types."
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Powers the Open an Account screen. Returns every matching account
    product ranked by value_score (highest first), with the top one
    flagged is_recommended — mirroring the "Best value" / "Recommended
    for you" badges in the UI.
    """
    stmt = (
        select(AccountProduct)
        .options(
            joinedload(AccountProduct.bank),
            joinedload(AccountProduct.requirements),
        )
        .where(AccountProduct.status == "active")
    )
    if account_type:
        stmt = stmt.where(AccountProduct.account_type_slug == account_type)

    result = await db.execute(stmt)
    products = result.unique().scalars().all()

    return build_ranking(products)