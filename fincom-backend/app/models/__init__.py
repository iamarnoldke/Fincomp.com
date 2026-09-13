"""
Importing every model module here ensures all of them are registered
with SQLAlchemy's mapper registry before any relationship (e.g.
Bank.account_products) is resolved. Without this, a query that only
imports Bank + LoanProduct will fail to configure relationships that
reference AccountProduct/InsuranceProduct, since those classes were
never imported anywhere in the request path.
"""
from app.models.account import AccountProduct, AccountProductRequirement  # noqa: F401
from app.models.bank import AccountType, Bank, InsuranceType, LoanCategory  # noqa: F401
from app.models.credit_score import CreditScoreSnapshot  # noqa: F401
from app.models.insurance import InsuranceProduct, InsuranceProductBenefit  # noqa: F401
from app.models.loan import LoanProduct  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.user_activity import UserActivityLog  # noqa: F401