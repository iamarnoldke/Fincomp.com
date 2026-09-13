from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.db.session import get_db
from app.models.bank import Bank
from app.models.insurance import InsuranceProduct
from app.schemas.insurance import InsuranceCompareResponse
from app.services.insurance_calculator import build_comparison

router = APIRouter(prefix="/insurance", tags=["insurance"])


@router.get("/compare", response_model=InsuranceCompareResponse)
async def compare_insurance(
    cover: float = Query(..., gt=0, description="Cover amount in UGX"),
    insurance_type: str | None = Query(
        None, description="Insurance type slug, e.g. 'motor'. Required if 'search' is omitted."
    ),
    search: str | None = Query(
        None, description="Free-text search over policy name, type, underwriter, or bank name."
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Powers the Compare Insurance screen. Matches insurance-view-model.ts:
    cover must fall within [min_cover_amount, max_cover_amount]; when a
    free-text search is given it overrides the type filter (matches
    across name/type/underwriter/bank), otherwise insurance_type is
    required. Results are sorted by computed annual premium ascending,
    cheapest flagged recommended, and 'saving' = most expensive minus
    cheapest premium.
    """
    if not search and not insurance_type:
        raise HTTPException(status_code=400, detail="Provide either insurance_type or search")

    stmt = (
        select(InsuranceProduct)
        .join(Bank, InsuranceProduct.bank_id == Bank.id)
        .options(
            joinedload(InsuranceProduct.bank),
            joinedload(InsuranceProduct.benefits),
        )
        .where(
            InsuranceProduct.status == "active",
            InsuranceProduct.min_cover_amount <= cover,
            InsuranceProduct.max_cover_amount >= cover,
        )
    )

    if search:
        like = f"%{search}%"
        stmt = stmt.where(
            or_(
                InsuranceProduct.name.ilike(like),
                InsuranceProduct.insurance_type_slug.ilike(like),
                InsuranceProduct.underwriter_name.ilike(like),
                Bank.name.ilike(like),
            )
        )
    else:
        stmt = stmt.where(InsuranceProduct.insurance_type_slug == insurance_type)

    result = await db.execute(stmt)
    products = result.unique().scalars().all()

    return build_comparison(products, cover)