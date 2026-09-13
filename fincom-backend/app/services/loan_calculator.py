"""
Loan comparison business logic. This is the core "why a backend exists
at all" piece — the amount and term a user types in are never stored on
the product row, so every comparison is computed fresh, on request.

Formula: standard reducing-balance (amortizing) monthly payment —
the same math your Compare Loans screen already implies with its
"Monthly" / "Total repayable" / "Total cost" figures.
"""
from app.models.loan import LoanProduct
from app.schemas.loan import LoanCompareResult, LoanProductOut


def monthly_payment(principal: float, annual_rate_pct: float, term_months: int) -> float:
    if annual_rate_pct == 0:
        return principal / term_months
    monthly_rate = (annual_rate_pct / 100) / 12
    factor = (1 + monthly_rate) ** term_months
    return principal * monthly_rate * factor / (factor - 1)


def build_comparison(
    products: list[LoanProduct], amount: float, term_months: int
) -> list[LoanCompareResult]:
    """
    Given the loan products that already matched the filters (bank,
    category, amount/term range), compute per-product figures, sort by
    total cost, and flag the cheapest as recommended — mirroring the
    "Recommended for you" / "Best value" badges in the UI.
    """
    results: list[LoanCompareResult] = []

    for product in products:
        payment = monthly_payment(amount, float(product.annual_rate_pct), term_months)
        total_repayable = payment * term_months
        processing_fee_amount = amount * (float(product.processing_fee_pct) / 100)
        total_cost = total_repayable + processing_fee_amount

        results.append(
            LoanCompareResult(
                product=LoanProductOut.model_validate(product),
                monthly_payment=round(payment, 2),
                total_repayable=round(total_repayable, 2),
                processing_fee_amount=round(processing_fee_amount, 2),
                total_cost=round(total_cost, 2),
                is_recommended=False,  # set below
            )
        )

    results.sort(key=lambda r: r.total_cost)

    if results:
        results[0].is_recommended = True
        cheapest_cost = results[0].total_cost
        for r in results:
            r.savings_vs_this = round(r.total_cost - cheapest_cost, 2)

    return results
