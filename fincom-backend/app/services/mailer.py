"""
Sends email through Brevo's HTTPS API (no extra dependency: standard library
only). Never raises into the request: a failed email is logged, because the
forgot-password endpoint must answer the same way whether or not it worked.
"""
import asyncio
import json
import logging
import urllib.error
import urllib.request

from app.core.config import settings

log = logging.getLogger("fincom.mailer")

BREVO_URL = "https://api.brevo.com/v3/smtp/email"


def _post(payload: dict) -> None:
    req = urllib.request.Request(
        BREVO_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "api-key": settings.brevo_api_key,
            "content-type": "application/json",
            "accept": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        resp.read()


async def send_email(to_email: str, to_name: str, subject: str, html: str, text: str) -> bool:
    """Returns True if the provider accepted the message."""
    if not settings.brevo_api_key or not settings.mail_from_email:
        
        log.warning("Email not configured; would have sent to %s:\n%s\n%s", to_email, subject, text)
        return False

    payload = {
        "sender": {"name": settings.mail_from_name, "email": settings.mail_from_email},
        "to": [{"email": to_email, "name": to_name}],
        "subject": subject,
        "htmlContent": html,
        "textContent": text,
    }
    try:
        await asyncio.to_thread(_post, payload)
        return True
    except urllib.error.HTTPError as exc:
        log.error("Brevo rejected the email (%s): %s", exc.code, exc.read()[:300])
    except Exception:
        log.exception("Could not send email to %s", to_email)
    return False