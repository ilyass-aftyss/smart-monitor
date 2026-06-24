from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel

from database.db import get_db
from models.models import ExternalData
from api.auth import get_current_user

router = APIRouter()

class ExternalDataOut(BaseModel):
    id: int
    timestamp: datetime
    radiation: Optional[float]
    wind_speed: Optional[float]
    humidity: Optional[float]
    temperature: Optional[float]

    class Config:
        from_attributes = True

@router.get("/latest", response_model=ExternalDataOut)
async def get_latest(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(ExternalData).order_by(desc(ExternalData.timestamp)).limit(1))
    row = result.scalar_one_or_none()
    if not row:
        return ExternalDataOut(id=0, timestamp=datetime.utcnow(), radiation=350.0, wind_speed=3.5, humidity=60.0, temperature=25.0)
    return row

@router.get("/history", response_model=List[ExternalDataOut])
async def get_history(
    hours: int = Query(24, ge=1, le=720),
    limit: int = Query(200, ge=1, le=2000),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    since = datetime.utcnow() - timedelta(hours=hours)
    result = await db.execute(
        select(ExternalData)
        .where(ExternalData.timestamp >= since)
        .order_by(desc(ExternalData.timestamp))
        .limit(limit)
    )
    rows = result.scalars().all()
    return list(reversed(rows))
