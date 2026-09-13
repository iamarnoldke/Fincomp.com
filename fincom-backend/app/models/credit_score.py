import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Integer, Numeric, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CreditScoreSnapshot(Base):
    __tablename__ = "credit_score_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    score: Mapped[int] = mapped_column(Integer)
    payment_history_status: Mapped[str | None] = mapped_column(String(50))
    credit_utilization_pct: Mapped[float | None] = mapped_column(Numeric(5, 2))
    credit_age_years: Mapped[float | None] = mapped_column(Numeric(5, 2))
    credit_mix_count: Mapped[int | None] = mapped_column(Integer)
    recent_enquiries_count: Mapped[int | None] = mapped_column(Integer)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))