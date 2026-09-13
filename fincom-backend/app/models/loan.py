import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, ProductStatusEnum


class LoanProduct(Base):
    __tablename__ = "loan_products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    bank_id: Mapped[str] = mapped_column(String, ForeignKey("banks.id"))
    category_slug: Mapped[str] = mapped_column(String, ForeignKey("loan_categories.slug"))
    name: Mapped[str] = mapped_column(String(150))
    annual_rate_pct: Mapped[float] = mapped_column(Numeric(6, 3))
    max_amount: Mapped[float] = mapped_column(Numeric(14, 2))
    min_term_months: Mapped[int] = mapped_column(Integer)
    max_term_months: Mapped[int] = mapped_column(Integer)
    processing_fee_pct: Mapped[float] = mapped_column(Numeric(6, 3))
    min_credit_score: Mapped[int | None] = mapped_column(Integer)
    requires_collateral: Mapped[bool] = mapped_column(Boolean)
    popularity: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(ProductStatusEnum)

    bank = relationship("Bank", back_populates="loan_products")
