import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class BouEdition(Base):
    """One published edition of the Bank of Uganda rates and charges table."""

    __tablename__ = "bou_editions"

    as_at: Mapped[date] = mapped_column(Date, primary_key=True)
    source_url: Mapped[str | None] = mapped_column(Text)
    imported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class BankRateSnapshot(Base):
    """What one bank had printed for one rate in one edition."""

    __tablename__ = "bank_rate_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    as_at: Mapped[date] = mapped_column(Date, ForeignKey("bou_editions.as_at", ondelete="CASCADE"))
    bank_id: Mapped[str] = mapped_column(String, ForeignKey("banks.id", ondelete="CASCADE"))
    metric: Mapped[str] = mapped_column(String(30))
    raw_text: Mapped[str] = mapped_column(Text)
    kind: Mapped[str] = mapped_column(String(12))
    value_pct: Mapped[Decimal | None] = mapped_column(Numeric(8, 3))
    margin_pct: Mapped[Decimal | None] = mapped_column(Numeric(8, 3))
    period: Mapped[str | None] = mapped_column(String(2))