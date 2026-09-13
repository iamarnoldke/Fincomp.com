"""
Insurance comparison logic — a direct server-side port of
insurance-view-model.ts's `results` and `saving` computed values.

IMPORTANT: both premium and excess are percentages of the cover
amount, not flat fees. There is no base premium in this model.
"""
from app.models.insurance import InsuranceProduct
from app.schemas.insurance import (
    InsuranceCompareResponse,
    InsuranceCompareResult,
    InsuranceProductOut,
)


def build_comparison(products: list[InsuranceProduct], cover: float) -> InsuranceCompareResponse:
    scored = []
    for p in products:
        annual_premium = cover * float(p.premium_rate_pct) / 100
        excess_amount = cover * float(p.excess_pct) / 100
        scored.append(
            InsuranceCompareResult(
                product=InsuranceProductOut.model_validate(p),
                annual_premium=round(annual_premium, 2),
                excess_amount=round(excess_amount, 2),
                is_recommended=False,
            )
        )

    scored.sort(key=lambda r: r.annual_premium)

    if scored:
        scored[0].is_recommended = True

    saving = 0.0
    if len(scored) >= 2:
        saving = round(scored[-1].annual_premium - scored[0].annual_premium, 2)

    return InsuranceCompareResponse(results=scored, saving=saving)