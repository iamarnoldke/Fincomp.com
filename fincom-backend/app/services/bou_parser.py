import io
import re
from dataclasses import dataclass
from datetime import date

from app.services.bou_cells import clean, metric_for_label

BANK_ALIASES: dict[str, str] = {
    "stanbic": "stanbic", "centenary": "centenary", "absa": "absa",
    "equity": "equity", "dfcu": "dfcu", "housing finance": "housing",
    "bank of africa": "bankofafrica", "kcb": "kcb", "ncba": "ncba",
    "pearl": "postbank", "postbank": "postbank", "standard chartered": "standardchartered",
    "guaranty": "gtbank", "gt bank": "gtbank", "gtbank": "gtbank", "exim": "exim",
    "bank of baroda": "bankofbaroda", "baroda": "bankofbaroda",
    "housing": "housing", "diamond": "dtb", "ubau": "uba", "tropical": "tropical",
    "i&m": "im", "i & m": "im", "cairo": "cairo", "abc": "abc",
    "diamond trust": "dtb", "dtb": "dtb", "ecobank": "ecobank",
    "finance trust": "financetrust", "pride": "pride", "uba": "uba",
    "united bank for africa": "uba",
}

_MONTHS = {m: i for i, m in enumerate(
    ["january", "february", "march", "april", "may", "june", "july",
     "august", "september", "october", "november", "december"], 1)}


class BouLayoutError(Exception):
    pass


@dataclass(frozen=True)
class ParsedRow:
    bank_id: str
    metric: str
    raw_text: str


def bank_id_for(header: str) -> str | None:
    h = re.sub(r"\s+", " ", header.lower().replace("\n", " ")).strip()
    for alias in sorted(BANK_ALIASES, key=len, reverse=True):
        if alias in h:
            return BANK_ALIASES[alias]
    return None


def edition_date(text: str) -> date | None:
    m = re.search(r"as\s+at\s+(\d{1,2})\s*(?:st|nd|rd|th)?[\s_-]+([A-Za-z]+)[\s_,-]+(\d{4})", text, re.I)
    if not m:
        return None
    month = _MONTHS.get(m.group(2).lower()) or _MONTHS.get(m.group(2).lower()[:3] and next(
        (k for k in _MONTHS if k.startswith(m.group(2).lower()[:3])), ""))
    return date(int(m.group(3)), month, int(m.group(1))) if month else None


def parse_pdf(data: bytes) -> tuple[date, list[ParsedRow]]:
    import pdfplumber

    rows: list[ParsedRow] = []
    first_text = ""
    try:
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            for page in pdf.pages:
                first_text += "\n" + (page.extract_text() or "")
                for table in page.extract_tables():
                    rows.extend(_rows_from_table(table))
    except Exception as exc:  # unreadable or not a PDF
        raise BouLayoutError(f"Could not read the PDF: {exc}") from exc
    as_at = edition_date(first_text)
    if as_at is None:
        raise BouLayoutError("Could not find the 'as at <date>' line in the PDF.")
    if not rows:
        raise BouLayoutError("No bank rate rows were found in the PDF.")

    seen = set()
    for r in rows:
        if (r.bank_id, r.metric) in seen:
            raise BouLayoutError(f"{r.bank_id} / {r.metric} appears twice.")
        seen.add((r.bank_id, r.metric))
    return as_at, rows


def _rows_from_table(table: list[list[str | None]]) -> list[ParsedRow]:
    header_idx, banks = None, {}
    for i, row in enumerate(table):
        found = {j: bank_id_for(c or "") for j, c in enumerate(row[1:], 1) if c}
        found = {j: b for j, b in found.items() if b}
        if len(found) >= 5:
            header_idx, banks = i, found
            break
    if header_idx is None:
        return []
    out: list[ParsedRow] = []
    for row in table[header_idx + 1:]:
        metric = metric_for_label(row[0] or "")
        if not metric:
            continue
        for j, bank in banks.items():
            if j < len(row):
                out.append(ParsedRow(bank, metric, clean(row[j])))
    return out