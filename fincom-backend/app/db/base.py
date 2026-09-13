from sqlalchemy import Enum
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Maps onto the Postgres ENUM types created in schema.sql. asyncpg is
# strict about ENUM vs varchar comparisons (unlike psycopg2), so the
# column type has to be declared as a real Postgres enum here, not a
# plain String — otherwise every WHERE ... = 'active' filter raises
# "operator does not exist: product_status = character varying".
ProductStatusEnum = Enum(
    "active", "inactive", "draft", name="product_status", create_type=False
)

UserRoleEnum = Enum(
    "consumer", "content_admin", "super_admin", name="user_role", create_type=False
)
