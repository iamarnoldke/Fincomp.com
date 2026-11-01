from datetime import date

from pydantic import BaseModel


class BouRateOut(BaseModel):
    metric: str
    title: str
    current: str
    previous: str | None = None
    change_pct_points: float | None = None


class BouBankOut(BaseModel):
    bank_id: str
    bank_name: str
    rates: list[BouRateOut]


class BouSummaryOut(BaseModel):
    as_at: date | None
    previous_as_at: date | None
    banks: list[BouBankOut]