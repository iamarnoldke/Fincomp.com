import uuid
from datetime import date
from decimal import Decimal
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Bank
from app.models.bou_rates import BankRateSnapshot, BouEdition
from app.services.bou_cells import METRIC_TITLES, display, parse_cell
from app.services.bou_parser import ParsedRow, parse_pdf

async def store_edition(db: AsyncSession, as_at: date, rows: list[ParsedRow], source_url: str | None) -> int:
    """Saves one edition. Re-running for the same date replaces it. Banks we do not list are skipped."""
    known = set((await db.scalars(select(Bank.id))).all())
    await db.execute(delete(BouEdition).where(BouEdition.as_at == as_at))
    db.add(BouEdition(as_at=as_at, source_url=source_url, imported_at=func.now()))
    await db.flush()
    saved = 0
    for r in rows:
        if r.bank_id not in known:
            continue
        c = parse_cell(r.raw_text)
        db.add(BankRateSnapshot(
            id=uuid.uuid4(), as_at=as_at, bank_id=r.bank_id, metric=r.metric,
            raw_text=c.raw, kind=c.kind, value_pct=c.value_pct,
            margin_pct=c.margin_pct, period=c.period))
        saved += 1
    await db.commit()
    return saved

async def import_pdf(db: AsyncSession, data: bytes, source_url: str | None) -> tuple[date, int]:
    as_at, rows = parse_pdf(data)
    return as_at, await store_edition(db, as_at, rows, source_url)

def _comparable(a: BankRateSnapshot, b: BankRateSnapshot) -> Decimal | None:
    """Change in percentage points, only when both are the same kind of figure."""
    if a.kind != b.kind or a.period != b.period:
        return None
    if a.kind == "percent" and a.value_pct is not None and b.value_pct is not None:
        return b.value_pct - a.value_pct
    if a.kind == "plr" and a.margin_pct is not None and b.margin_pct is not None:
        return b.margin_pct - a.margin_pct
    return None


HEADLINE = ["savings_max", "fixed_max", "lending_min", "lending_max"]


async def summary(db: AsyncSession) -> dict:
    editions = list((await db.scalars(select(BouEdition.as_at).order_by(BouEdition.as_at.desc()).limit(2))).all())
    if not editions:
        return {"as_at": None, "previous_as_at": None, "banks": []}
    latest = editions[0]
    prev = editions[1] if len(editions) > 1 else None
    snaps = (await db.scalars(select(BankRateSnapshot).where(
        BankRateSnapshot.as_at.in_([d for d in (latest, prev) if d])))).all()
    names = dict((await db.execute(select(Bank.id, Bank.name))).all())
    by = {(s.as_at, s.bank_id, s.metric): s for s in snaps}
    bank_ids = sorted({s.bank_id for s in snaps if s.as_at == latest}, key=lambda b: names.get(b, b))
    banks = []
    for bid in bank_ids:
        items = []
        for metric in HEADLINE + ["plr"]:
            cur = by.get((latest, bid, metric))
            if not cur:
                continue
            old = by.get((prev, bid, metric)) if prev else None
            delta = _comparable(old, cur) if old else None
            items.append({
                "metric": metric, "title": METRIC_TITLES[metric],
                "current": display(cur.kind, cur.value_pct, cur.margin_pct, cur.period, cur.raw_text),
                "previous": display(old.kind, old.value_pct, old.margin_pct, old.period, old.raw_text) if old else None,
                "change_pct_points": float(delta) if delta is not None else None,
            })
        banks.append({"bank_id": bid, "bank_name": names.get(bid, bid), "rates": items})
    return {"as_at": latest, "previous_as_at": prev, "banks": banks}