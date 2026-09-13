"""
Account ranking logic. This is a direct server-side port of the
valueScore() formula in the Angular app's accounts-view-model.ts —
kept identical on purpose, so "Best value" means the same thing
whether it's computed in the browser (today) or the API (once this
replaces the client-side FinanceData mock).
"""
from app.models.account import AccountProduct
from app.schemas.account import AccountProductOut, AccountResult


def value_score(product: AccountProduct) -> float:
    return (
        float(product.interest_rate_pa) * 12
        - float(product.monthly_fee) / 10_000
        - float(product.withdrawal_fee) / 10_000
        - float(product.min_opening_balance) / 100_000
        - float(product.min_balance) / 100_000
    )


def build_ranking(products: list[AccountProduct]) -> list[AccountResult]:
    scored = [
        AccountResult(
            product=AccountProductOut.model_validate(p),
            value_score=round(value_score(p), 4),
            is_recommended=False,
        )
        for p in products
    ]
    scored.sort(key=lambda r: r.value_score, reverse=True)
    if scored:
        scored[0].is_recommended = True
    return scored