from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, ProductStatusEnum


class Bank(Base):
    __tablename__ = "banks"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    short_code: Mapped[str] = mapped_column(String(10))
    logo_url: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(ProductStatusEnum)

    loan_products = relationship("LoanProduct", back_populates="bank")
    account_products = relationship("AccountProduct", back_populates="bank")
    insurance_products = relationship("InsuranceProduct", back_populates="bank")


class LoanCategory(Base):
    __tablename__ = "loan_categories"

    slug: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)


class AccountType(Base):
    __tablename__ = "account_types"

    slug: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))


class InsuranceType(Base):
    __tablename__ = "insurance_types"

    slug: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)
