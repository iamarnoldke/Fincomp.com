import uuid

from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, ProductStatusEnum


class AccountProduct(Base):
    __tablename__ = "account_products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    bank_id: Mapped[str] = mapped_column(String, ForeignKey("banks.id"))
    account_type_slug: Mapped[str] = mapped_column(String, ForeignKey("account_types.slug"))
    name: Mapped[str] = mapped_column(String(150))
    min_opening_balance: Mapped[float] = mapped_column(Numeric(14, 2))
    min_balance: Mapped[float] = mapped_column(Numeric(14, 2))
    monthly_fee: Mapped[float] = mapped_column(Numeric(14, 2))
    withdrawal_fee: Mapped[float] = mapped_column(Numeric(14, 2))
    interest_rate_pa: Mapped[float] = mapped_column(Numeric(6, 3))
    status: Mapped[str] = mapped_column(ProductStatusEnum)

    bank = relationship("Bank", back_populates="account_products")
    requirements = relationship(
        "AccountProductRequirement", back_populates="account_product", order_by="AccountProductRequirement.sort_order"
    )


class AccountProductRequirement(Base):
    __tablename__ = "account_product_requirements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    account_product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("account_products.id"))
    requirement_text: Mapped[str] = mapped_column(String(150))
    sort_order: Mapped[int] = mapped_column(Integer)

    account_product = relationship("AccountProduct", back_populates="requirements")
