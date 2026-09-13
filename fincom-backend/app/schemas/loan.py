import uuid

from pydantic import BaseModel, ConfigDict

from app.schemas.bank import BankOut


class LoanProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    category_slug: str
    annual_rate_pct: float
    max_amount: float
    min_term_months: int
    max_term_months: int
    processing_fee_pct: float
    min_credit_score: int | None
    requires_collateral: bool
    popularity: int
    bank: BankOut


class LoanCompareResult(BaseModel):
    """
    One matching loan product, with figures computed for the specific
    amount/term the user asked about (never precomputed/stored, since
    they change on every query).
    """
    product: LoanProductOut
    monthly_payment: float
    total_repayable: float
    processing_fee_amount: float
    total_cost: float
    is_recommended: bool
    savings_vs_this: float | None = None  # how much more than the cheapest option this one costs
