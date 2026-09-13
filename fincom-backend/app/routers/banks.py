from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.bank import Bank
from app.schemas.bank import BankOut

router = APIRouter(prefix="/banks", tags=["banks"])


@router.get("", response_model=list[BankOut])
async def list_banks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Bank).where(Bank.status == "active").order_by(Bank.name))
    return result.scalars().all()
