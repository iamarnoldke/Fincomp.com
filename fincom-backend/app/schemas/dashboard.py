import uuid
from datetime import datetime

from pydantic import BaseModel


class RateBarOut(BaseModel):
    """One loan product in the 'Loan Rates Across Banks' chart (cheapest first)."""
    id: uuid.UUID
    bank_id: str
    bank_name: str
    product_name: str
    category_slug: str
    annual_rate_pct: float


class PopularLoanOut(BaseModel):
    id: uuid.UUID
    bank_id: str
    bank_name: str
    name: str
    category_slug: str
    annual_rate_pct: float
    popularity: int


class PopularInsuranceOut(BaseModel):
    id: uuid.UUID
    bank_id: str
    bank_name: str
    name: str
    insurance_type_slug: str
    underwriter_name: str
    popularity: int


class ActivityOut(BaseModel):
    kind: str
    description: str
    occurred_at: datetime


class DashboardSummaryOut(BaseModel):
    """
    Everything the Dashboard screen shows, computed from the database on
    every request. Nothing here is stored or hardcoded.
    """
    generated_at: datetime
    rates_last_updated: datetime | None

    bank_count: int
    loan_product_count: int
    account_product_count: int
    insurance_product_count: int
    products_compared: int

    sample_amount: float
    sample_term_months: int
    potential_savings: float

    activity_count_30d: int

    rate_bars: list[RateBarOut]
    popular_loans: list[PopularLoanOut]
    popular_insurance: list[PopularInsuranceOut]
    recent_activity: list[ActivityOut]