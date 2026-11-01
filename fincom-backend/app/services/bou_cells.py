"""
Reads one cell of the Bank of Uganda table.

The BoU prints plain numbers ("17%"), rates tied to the bank's prime lending
rate ("PLR + 10%", "PLR-5.5%(Negotiable)"), per-month rates ("5%p.m"), and
words ("Negotiable", "N/A", "Nil"). We keep the printed text and also work
out what kind of cell it is, so two editions can be compared safely: a number
is only compared with a number, a PLR margin with a PLR margin.
"""
import re
from dataclasses import dataclass
from decimal import Decimal

# Row labels exactly as printed, mapped
# to the name we store. Matching is on lower-case letters only.
METRIC_LABELS: dict[str, str] = {
    "currentaccountsminimum": "current_min",
    "curentaccountsminimum": "current_min",
    "currentaccountsmaximum": "current_max",
    "curentaccountsmaximum": "current_max",
    "savingsaccountsminimum": "savings_min",
    "savingsaccountsmaximum": "savings_max",
    "fixeddepositsminimum": "fixed_min",
    "fixeddepositsmaximum": "fixed_max",
    "lendingrateminimum": "lending_min",
    "lendingratemaximum": "lending_max",
    "primelendingrateplr": "plr",
    "overdrawnpenalty": "overdrawn_penalty",
}

# What people see on screen for each metric.
METRIC_TITLES: dict[str, str] = {
    "current_min": "Current account rate (min)",
    "current_max": "Current account rate (max)",
    "savings_min": "Savings rate (min)",
    "savings_max": "Savings rate (max)",
    "fixed_min": "Fixed deposit rate (min)",
    "fixed_max": "Fixed deposit rate (max)",
    "lending_min": "Lending rate (min)",
    "lending_max": "Lending rate (max)",
    "plr": "Prime lending rate",
    "overdrawn_penalty": "Overdrawn penalty",
}


def metric_for_label(label: str) -> str | None:
    key = re.sub(r"[^a-z]", "", label.lower())
    return METRIC_LABELS.get(key)


@dataclass(frozen=True)
class Cell:
    raw: str
    kind: str  # percent | plr | negotiable | na | text
    value_pct: Decimal | None = None
    margin_pct: Decimal | None = None
    period: str | None = None  # pa | pm


# Footnote marks such as (bb) or (do): one to three lower-case letters.
_FOOTNOTE = re.compile(r"\(\s*[a-z]{1,3}\s*\)")
_NUMBER = r"(\d+(?:\.\d+)?)"
_PERCENT = re.compile(rf"^(?:up\s*to\s*)?{_NUMBER}\s*%\s*(p\.?\s*([am])\.?)?$", re.I)
_PLR = re.compile(rf"^PLR\s*(?:([+\-−–])\s*{_NUMBER}\s*%)?$", re.I)


def clean(raw: str | None) -> str:
    text = (raw or "").replace("\n", " ")
    return re.sub(r"\s+", " ", text).strip()


def parse_cell(raw: str | None) -> Cell:
    original = clean(raw)
    text = _FOOTNOTE.sub("", original).strip()
    # "(Negotiable)" after a figure only says the figure can be negotiated.
    text = re.sub(r"\(\s*negotiable\s*\)", "", text, flags=re.I).strip()
    low = text.lower()

    if low in {"", "n/a", "na", "-", "–", "—"}:
        return Cell(original, "na")
    if low == "negotiable":
        return Cell(original, "negotiable")
    if low == "nil":
        return Cell(original, "percent", Decimal(0), None, "pa")

    m = _PERCENT.match(text)
    if m:
        period = "pm" if (m.group(3) or "").lower() == "m" else "pa"
        return Cell(original, "percent", Decimal(m.group(1)), None, period)

    m = _PLR.match(text)
    if m:
        if m.group(1) is None:
            margin = Decimal(0)
        else:
            margin = Decimal(m.group(2))
            if m.group(1) in "-−–":
                margin = -margin
        return Cell(original, "plr", None, margin, "pa")

    return Cell(original, "text")


def display(kind: str, value_pct, margin_pct, period, raw: str) -> str:
    """Short text for the screen."""
    if kind == "na":
        return "N/A"
    if kind == "negotiable":
        return "Negotiable"
    if kind == "percent" and value_pct is not None:
        suffix = " a month" if period == "pm" else ""
        return f"{Decimal(value_pct).normalize():f}%{suffix}"
    if kind == "plr" and margin_pct is not None:
        m = Decimal(margin_pct)
        if m == 0:
            return "PLR"
        sign = "+" if m > 0 else "−"
        return f"PLR {sign} {abs(m).normalize():f}%"
    return clean(raw)[:40]