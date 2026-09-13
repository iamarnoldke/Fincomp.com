import uuid

from pydantic import BaseModel, ConfigDict

from app.schemas.bank import BankOut


class InsuranceBenefitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    benefit_text: str


class InsuranceProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    insurance_type_slug: str
    underwriter_name: str
    min_cover_amount: float
    max_cover_amount: float
    premium_rate_pct: float
    excess_pct: float
    claim_settlement_days: int | None
    popularity: int
    bank: BankOut
    benefits: list[InsuranceBenefitOut]


class InsuranceCompareResult(BaseModel):
    product: InsuranceProductOut
    annual_premium: float
    excess_amount: float
    is_recommended: bool


class InsuranceCompareResponse(BaseModel):
    results: list[InsuranceCompareResult]
    saving: float  # most expensive premium minus cheapest, 0 if fewer than 2 results