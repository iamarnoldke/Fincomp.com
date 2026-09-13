"""
Simulated credit score engine.

IMPORTANT — read before changing this file: there is no real credit
bureau integration here. This computes an illustrative score from
signals that actually exist on the platform (account age, engagement
with the comparison tools), not real repayment/debt history. Wiring
up a real bureau (e.g. Uganda's CRB providers) is a separate business
decision (data-sharing agreement, user consent flow, cost per lookup)
— when that happens, this module gets replaced, not extended.
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.loan import LoanProduct
from app.models.user import User
from app.models.user_activity import UserActivityLog
from app.models.credit_score import CreditScoreSnapshot
from app.schemas.credit_score import (
    CreditFactorOut,
    CreditScoreProfileOut,
    CreditScoreSummaryOut,
    EligibleLoanOut,
)

BASE_SCORE = 650
MIN_SCORE = 300
MAX_SCORE = 850


def _band(score: int) -> str:
    if score >= 800:
        return "Excellent"
    if score >= 740:
        return "Very Good"
    if score >= 670:
        return "Good"
    if score >= 580:
        return "Fair"
    return "Poor"


async def _compute_raw_score(db: AsyncSession, user: User) -> dict:
    now = datetime.now(timezone.utc)
    account_age_days = (now - user.created_at).days

    
    distinct_kinds_result = await db.execute(
        select(func.count(func.distinct(UserActivityLog.kind))).where(
            UserActivityLog.user_id == user.id
        )
    )
    distinct_kinds = distinct_kinds_result.scalar_one()

    thirty_days_ago = now - timedelta(days=30)
    recent_count_result = await db.execute(
        select(func.count()).where(
            UserActivityLog.user_id == user.id,
            UserActivityLog.occurred_at >= thirty_days_ago,
        )
    )
    recent_enquiries_count = recent_count_result.scalar_one()

    age_bonus = min(60, round(account_age_days / 365 * 40))
    mix_bonus = min(60, distinct_kinds * 15)
    enquiries_penalty = -5 * max(0, recent_enquiries_count - 2)
    enquiries_penalty = max(-30, enquiries_penalty)

    score = BASE_SCORE + age_bonus + mix_bonus + enquiries_penalty
    score = max(MIN_SCORE, min(MAX_SCORE, score))

    return {
        "score": score,
        "account_age_days": account_age_days,
        "credit_mix_count": distinct_kinds,
        "recent_enquiries_count": recent_enquiries_count,
    }


async def refresh_snapshot(db: AsyncSession, user: User) -> CreditScoreSnapshot:
    """Compute a fresh score and store it as a new append-only snapshot."""
    raw = await _compute_raw_score(db, user)
    credit_age_years = round(raw["account_age_days"] / 365, 2)

    snapshot = CreditScoreSnapshot(
        user_id=user.id,
        score=raw["score"],
        payment_history_status="On time",  
        credit_utilization_pct=20.0,        
        credit_age_years=credit_age_years,
        credit_mix_count=raw["credit_mix_count"],
        recent_enquiries_count=raw["recent_enquiries_count"],
        recorded_at=datetime.now(timezone.utc),
    )
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    return snapshot


def _factor_status(value: float, good_at: float, fair_at: float, higher_is_better: bool = True) -> str:
    if higher_is_better:
        if value >= good_at:
            return "good"
        if value >= fair_at:
            return "fair"
        return "poor"
    else:
        if value <= good_at:
            return "good"
        if value <= fair_at:
            return "fair"
        return "poor"


async def build_profile(
    db: AsyncSession, latest: CreditScoreSnapshot, previous: CreditScoreSnapshot | None
) -> CreditScoreProfileOut:
    delta = latest.score - previous.score if previous else 0
    trend = f"{'+' if delta >= 0 else ''}{delta} pts"

    factors = [
        CreditFactorOut(
            label="Payment history", weight=latest.payment_history_status, status="good"
        ),
        CreditFactorOut(
            label="Credit utilisation",
            weight=f"{latest.credit_utilization_pct:.0f}% used",
            status=_factor_status(float(latest.credit_utilization_pct), 30, 50, higher_is_better=False),
        ),
        CreditFactorOut(
            label="Credit age",
            weight=f"{latest.credit_age_years:.0f} yrs",
            status=_factor_status(float(latest.credit_age_years), 5, 2),
        ),
        CreditFactorOut(
            label="Credit mix",
            weight=f"{latest.credit_mix_count} activity types",
            status=_factor_status(latest.credit_mix_count, 3, 2),
        ),
        CreditFactorOut(
            label="Recent enquiries",
            weight=f"{latest.recent_enquiries_count} recent",
            status=_factor_status(latest.recent_enquiries_count, 2, 5, higher_is_better=False),
        ),
    ]

    eligible_result = await db.execute(
        select(LoanProduct)
        .options(joinedload(LoanProduct.bank))
        .where(
            LoanProduct.status == "active",
            (LoanProduct.min_credit_score.is_(None)) | (LoanProduct.min_credit_score <= latest.score),
        )
        .order_by(LoanProduct.annual_rate_pct.asc())
        .limit(5)
    )
    eligible_loans = eligible_result.scalars().all()
    eligible = [
        EligibleLoanOut(
            bank_name=lp.bank.name if lp.bank else "",
            loan_name=lp.name,
            annual_rate_pct=float(lp.annual_rate_pct),
        )
        for lp in eligible_loans
    ]

    band = _band(latest.score)
    message = (
        "Your score has improved over the last month. You are likely to qualify for competitive offers."
        if delta > 0
        else "Your score is stable. Keep engaging with the platform to build your profile."
        if delta == 0
        else "Your score has dipped slightly. Review your recent activity for tips to improve it."
    )

    return CreditScoreProfileOut(
        score=latest.score,
        summary=CreditScoreSummaryOut(label=band, message=message, trend=trend),
        factors=factors,
        eligible=eligible,
    )