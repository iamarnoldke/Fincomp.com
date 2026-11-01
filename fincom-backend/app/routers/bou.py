import asyncio
import hmac
import urllib.request
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, HttpUrl
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.session import get_db
from app.schemas.bou import BouSummaryOut
from app.services import bou_store
from app.services.bou_parser import BouLayoutError

router = APIRouter(tags=["bou"])

@router.get("/bou/summary", response_model=BouSummaryOut)
async def bou_summary(db: AsyncSession = Depends(get_db)):
    return await bou_store.summary(db)

class RefreshRequest(BaseModel):
    pdf_url: HttpUrl

def _download(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Fincomp/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:  # noqa: S310
        return resp.read(30 * 1024 * 1024)

@router.post("/internal/bou-refresh")
async def bou_refresh(
    body: RefreshRequest,
    x_cron_secret: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
):
    if not settings.cron_secret or not hmac.compare_digest(x_cron_secret, settings.cron_secret):
        raise HTTPException(status_code=403, detail="Forbidden")
    url = str(body.pdf_url)
    try:
        data = await asyncio.to_thread(_download, url)
        as_at, saved = await bou_store.import_pdf(db, data, url)
    except BouLayoutError as exc:
        raise HTTPException(status_code=422, detail=f"Layout not recognised: {exc}")
    except OSError as exc:
        raise HTTPException(status_code=502, detail=f"Could not download the PDF: {exc}")
    return {"as_at": as_at, "rows_saved": saved}