from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.db.session import get_db
from app.models.loan import LoanProduct
from app.schemas.loan import LoanCompareResult
from app.services.loan_calculator import build_comparison

router = APIRouter(prefix="/loans", tags=["loans"])


@router.get("/compare", response_model=list[LoanCompareResult])
async def compare_loans(
    amount: float = Query(..., gt=0, description="Loan amount in UGX"),
    term_months: int = Query(..., gt=0, description="Requested term in months"),
    category: str | None = Query(None, description="Loan category slug, e.g. 'education'"),
    search: str | None = Query(None, description="Free-text search over product name"),
    db: AsyncSession = Depends(get_db),
):
    """
    Powers the Compare Loans screen. Filters products whose amount/term
    range covers the request, then computes monthly payment / total
    repayable / total cost for THIS specific amount and term (never
    precomputed), and flags the cheapest as recommended.
    """
    stmt = (
        select(LoanProduct)
        .options(joinedload(LoanProduct.bank))
        .where(
            LoanProduct.status == "active",
            LoanProduct.max_amount >= amount,
            LoanProduct.min_term_months <= term_months,
            LoanProduct.max_term_months >= term_months,
        )
    )
    if category:
        stmt = stmt.where(LoanProduct.category_slug == category)
    if search:
        stmt = stmt.where(LoanProduct.name.ilike(f"%{search}%"))

    result = await db.execute(stmt)
    products = result.scalars().all()

    if not products:
        raise HTTPException(status_code=404, detail="No matching loan products found")

    return build_comparison(products, amount, term_months)
