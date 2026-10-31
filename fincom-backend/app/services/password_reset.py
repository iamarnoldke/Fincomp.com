"""
Password reset: issue a single-use, short-lived token, email it, and
accept it exactly once.

Security notes
- The token is 32 random bytes (urlsafe). Only its SHA-256 hash is stored.
- Asking for a reset never reveals whether an email has an account.
- A new request cancels earlier unused links for that user.
- Requests for the same account are throttled to one per minute.
"""
import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from html import escape

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.models.password_reset import PasswordResetToken
from app.models.user import User
from app.services.mailer import send_email

THROTTLE_SECONDS = 60


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def reset_link(token: str) -> str:
    return f"{settings.frontend_url.rstrip('/')}/reset-password?token={token}"


async def create_reset_token(db: AsyncSession, email: str) -> tuple[User, str] | None:
    """
    Returns (user, raw_token) when a link should be emailed, else None
    (unknown email, inactive account, or asked again within a minute).
    """
    user = (await db.execute(select(User).where(User.email == email.lower()))).scalar_one_or_none()
    if user is None or not user.is_active:
        return None

    now = datetime.now(timezone.utc)
    latest = (
        await db.execute(
            select(PasswordResetToken.created_at)
            .where(PasswordResetToken.user_id == user.id)
            .order_by(PasswordResetToken.created_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    if latest is not None and (now - latest).total_seconds() < THROTTLE_SECONDS:
        return None

    await db.execute(
        update(PasswordResetToken)
        .where(PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None))
        .values(used_at=now)
    )
    raw = secrets.token_urlsafe(32)
    db.add(
        PasswordResetToken(
            id=uuid.uuid4(),
            user_id=user.id,
            token_hash=_hash(raw),
            created_at=now,
            expires_at=now + timedelta(minutes=settings.reset_token_minutes),
        )
    )
    await db.commit()
    return user, raw


async def send_reset_email(user: User, raw_token: str) -> bool:
    link = reset_link(raw_token)
    minutes = settings.reset_token_minutes
    name = escape(user.full_name.split()[0] if user.full_name else "there")
    text = (
        f"Hi {user.full_name or 'there'},\n\n"
        f"Use this link to choose a new Fincomp password. It works once and expires in {minutes} minutes:\n\n"
        f"{link}\n\n"
        "If you did not ask for this, you can ignore this email. Your password has not changed.\n"
    )
    html = (
        '<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#14233a">'
        f"<h2>Reset your Fincomp password</h2><p>Hi {name},</p>"
        f"<p>Use the button below to choose a new password. It works once and expires in {minutes} minutes.</p>"
        f'<p><a href="{escape(link)}" style="display:inline-block;background:#1d84d6;color:#ffffff;'
        'padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold">Choose a new password</a></p>'
        f'<p style="font-size:13px;color:#5b6b82">Or paste this link into your browser:<br>{escape(link)}</p>'
        '<p style="font-size:13px;color:#5b6b82">If you did not ask for this, ignore this email. '
        "Your password has not changed.</p></div>"
    )
    return await send_email(user.email, user.full_name, "Reset your Fincomp password", html, text)


async def consume_reset_token(db: AsyncSession, raw_token: str, new_password: str) -> bool:
    """Sets the new password if the token is valid, unused and unexpired."""
    now = datetime.now(timezone.utc)
    row = (
        await db.execute(
            select(PasswordResetToken)
            .where(PasswordResetToken.token_hash == _hash(raw_token))
            .with_for_update()
        )
    ).scalar_one_or_none()
    if row is None or row.used_at is not None or row.expires_at <= now:
        return False

    user = (await db.execute(select(User).where(User.id == row.user_id))).scalar_one_or_none()
    if user is None or not user.is_active:
        return False

    user.hashed_password = hash_password(new_password)
    row.used_at = now
    await db.execute(
        update(PasswordResetToken)
        .where(PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None))
        .values(used_at=now)
    )
    await db.commit()
    return True