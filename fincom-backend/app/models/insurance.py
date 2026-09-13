import uuid

from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, ProductStatusEnum


class InsuranceProduct(Base):
    __tablename__ = "insurance_products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    bank_id: Mapped[str] = mapped_column(String, ForeignKey("banks.id"))
    insurance_type_slug: Mapped[str] = mapped_column(String, ForeignKey("insurance_types.slug"))
    underwriter_name: Mapped[str] = mapped_column(String(150))
    name: Mapped[str] = mapped_column(String(150))
    premium_rate_pct: Mapped[float] = mapped_column(Numeric(6, 3))
    min_cover_amount: Mapped[float] = mapped_column(Numeric(14, 2))
    max_cover_amount: Mapped[float] = mapped_column(Numeric(14, 2))
    excess_pct: Mapped[float] = mapped_column(Numeric(6, 3))
    claim_settlement_days: Mapped[int | None] = mapped_column(Integer)
    popularity: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(ProductStatusEnum)

    bank = relationship("Bank", back_populates="insurance_products")
    benefits = relationship(
        "InsuranceProductBenefit", back_populates="insurance_product", order_by="InsuranceProductBenefit.sort_order"
    )


class InsuranceProductBenefit(Base):
    __tablename__ = "insurance_product_benefits"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    insurance_product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("insurance_products.id"))
    benefit_text: Mapped[str] = mapped_column(String(150))
    sort_order: Mapped[int] = mapped_column(Integer)

    insurance_product = relationship("InsuranceProduct", back_populates="benefits")
