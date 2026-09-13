import uuid

from pydantic import BaseModel, ConfigDict

from app.schemas.bank import BankOut


class AccountRequirementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    requirement_text: str


class AccountProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    account_type_slug: str
    min_opening_balance: float
    min_balance: float
    monthly_fee: float
    withdrawal_fee: float
    interest_rate_pa: float
    bank: BankOut
    requirements: list[AccountRequirementOut]


class AccountResult(BaseModel):
    product: AccountProductOut
    value_score: float
    is_recommended: bool