from pydantic import BaseModel


class CreditFactorOut(BaseModel):
    label: str
    weight: str
    status: str  


class EligibleLoanOut(BaseModel):
    bank_name: str
    loan_name: str
    annual_rate_pct: float


class CreditScoreSummaryOut(BaseModel):
    label: str    
    message: str
    trend: str    


class CreditScoreProfileOut(BaseModel):
    score: int
    summary: CreditScoreSummaryOut
    factors: list[CreditFactorOut]
    eligible: list[EligibleLoanOut]