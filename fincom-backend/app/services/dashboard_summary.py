"""
Dashboard numbers, computed fresh from the database on every request.

Replaces the hardcoded figures that used to live in the Angular
DashboardViewModel (FinanceData arrays, signal(712), fixed activity list).
When a rate changes in the database, the dashboard changes with it.
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy import column, func, select, table
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.account import AccountProduct
from app.models.bank import Bank
from app.models.credit_score import CreditScoreSnapshot
from app.models.insurance import InsuranceProduct
from app.models.loan import LoanProduct
from app.models.user import User
from app.models.user_activity import UserActivityLog
from app.schemas.dashboard import (
    ActivityOut,
    DashboardSummaryOut,
    PopularInsuranceOut,
    PopularLoanOut,
    RateBarOut,
)
from app.services.loan_calculator import build_comparison

# The reference loan used for the "potential savings" 
SAMPLE_AMOUNT = 20_000_000.0
SAMPLE_TERM_MONTHS = 24

POPULAR_LIMIT = 5
ACTIVITY_LIMIT = 5


async def _count_active(db: AsyncSession, model) -> int:
    result = await db.execute(
        select(func.count()).select_from(model).where(model.status == "active")
    )
    return int(result.scalar_one())


async def _latest_update(db: AsyncSession) -> datetime | None:
    """Latest updated_at across the product tables (set by DB triggers)."""
    stamps: list[datetime] = []
    for name in ("loan_products", "account_products", "insurance_products"):
        t = table(name, column("updated_at"))
        value = (await db.execute(select(func.max(t.c.updated_at)))).scalar_one()
        if value is not None:
            stamps.append(value)
    return max(stamps) if stamps else None


async def build_dashboard_summary(db: AsyncSession, user: User) -> DashboardSummaryOut:
    now = datetime.now(timezone.utc)

    # ---- Loans (all active products) -----------------
    loan_rows = await db.execute(
        select(LoanProduct)
        .options(joinedload(LoanProduct.bank))
        .where(LoanProduct.status == "active")
    )
    loans = list(loan_rows.scalars().all())

    by_rate = sorted(loans, key=lambda p: (float(p.annual_rate_pct), p.name))
    rate_bars = [
        RateBarOut(
            id=p.id,
            bank_id=p.bank_id,
            bank_name=p.bank.name,
            product_name=p.name,
            category_slug=p.category_slug,
            annual_rate_pct=float(p.annual_rate_pct),
        )
        for p in by_rate
    ]

    by_popularity = sorted(loans, key=lambda p: (-p.popularity, float(p.annual_rate_pct)))
    popular_loans = [
        PopularLoanOut(
            id=p.id,
            bank_id=p.bank_id,
            bank_name=p.bank.name,
            name=p.name,
            category_slug=p.category_slug,
            annual_rate_pct=float(p.annual_rate_pct),
            popularity=p.popularity,
        )
        for p in by_popularity[:POPULAR_LIMIT]
    ]

    # Potential savings: only loans that could actually lend the sample
    # amount over the sample term, priced with the same calculator the
    # Compare Loans screen uses (so fees are included).
    eligible = [
        p
        for p in loans
        if float(p.max_amount) >= SAMPLE_AMOUNT
        and p.min_term_months <= SAMPLE_TERM_MONTHS <= p.max_term_months
    ]
    potential_savings = 0.0
    if len(eligible) >= 2:
        priced = build_comparison(eligible, SAMPLE_AMOUNT, SAMPLE_TERM_MONTHS)
        potential_savings = round(priced[-1].total_cost - priced[0].total_cost, 2)

    # ---- Insurance -------------------------------------------------------
    insurance_rows = await db.execute(
        select(InsuranceProduct)
        .options(joinedload(InsuranceProduct.bank))
        .where(InsuranceProduct.status == "active")
        .order_by(InsuranceProduct.popularity.desc(), InsuranceProduct.name)
        .limit(POPULAR_LIMIT)
    )
    popular_insurance = [
        PopularInsuranceOut(
            id=p.id,
            bank_id=p.bank_id,
            bank_name=p.bank.name,
            name=p.name,
            insurance_type_slug=p.insurance_type_slug,
            underwriter_name=p.underwriter_name,
            popularity=p.popularity,
        )
        for p in insurance_rows.scalars().all()
    ]

    # ---- Counts ----------------------------------------------------------
    bank_count = await _count_active(db, Bank)
    loan_count = len(loans)
    account_count = await _count_active(db, AccountProduct)
    insurance_count = await _count_active(db, InsuranceProduct)

    # ---- The signed-in user's own data -----------------------------------
    score_row = await db.execute(
        select(CreditScoreSnapshot.score)
        .where(CreditScoreSnapshot.user_id == user.id)
        .order_by(CreditScoreSnapshot.recorded_at.desc())
        .limit(1)
    )
    credit_score = score_row.scalar_one_or_none()

    activity_rows = await db.execute(
        select(UserActivityLog)
        .where(UserActivityLog.user_id == user.id)
        .order_by(UserActivityLog.occurred_at.desc())
        .limit(ACTIVITY_LIMIT)
    )
    recent_activity = [
        ActivityOut(kind=a.kind, description=a.description, occurred_at=a.occurred_at)
        for a in activity_rows.scalars().all()
    ]

    activity_30d = (
        await db.execute(
            select(func.count()).where(
                UserActivityLog.user_id == user.id,
                UserActivityLog.occurred_at >= now - timedelta(days=30),
            )
        )
    ).scalar_one()

    return DashboardSummaryOut(
        generated_at=now,
        rates_last_updated=await _latest_update(db),
        bank_count=bank_count,
        loan_product_count=loan_count,
        account_product_count=account_count,
        insurance_product_count=insurance_count,
        products_compared=loan_count + account_count + insurance_count,
        sample_amount=SAMPLE_AMOUNT,
        sample_term_months=SAMPLE_TERM_MONTHS,
        potential_savings=potential_savings,
        credit_score=credit_score,
        activity_count_30d=int(activity_30d),
        rate_bars=rate_bars,
        popular_loans=popular_loans,
        popular_insurance=popular_insurance,
        recent_activity=recent_activity,
    )