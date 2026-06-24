from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel

from database.db import get_db
from models.models import InternalData
from api.auth import get_current_user

router = APIRouter()

class InternalDataOut(BaseModel):
    id: int
    timestamp: datetime
    temperature: Optional[float]
    co2: Optional[float]
    humidity: Optional[float]
    voc: Optional[float]
    vpd: Optional[float]
    pressure: Optional[float]
    dew_point: Optional[float]

    class Config:
        from_attributes = True

@router.get("/latest", response_model=InternalDataOut)
async def get_latest(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(InternalData).order_by(desc(InternalData.timestamp)).limit(1))
    row = result.scalar_one_or_none()
    if not row:
        return InternalDataOut(id=0, timestamp=datetime.utcnow(), temperature=22.5, co2=450.0, humidity=55.0, voc=120.0, vpd=0.8, pressure=1013.25, dew_point=12.5)
    return row

@router.get("/history", response_model=List[InternalDataOut])
async def get_history(
    hours: int = Query(24, ge=1, le=720),
    limit: int = Query(500, ge=1, le=5000),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    since = datetime.utcnow() - timedelta(hours=hours)
    result = await db.execute(
        select(InternalData)
        .where(InternalData.timestamp >= since)
        .order_by(desc(InternalData.timestamp))
        .limit(limit)
    )
    rows = result.scalars().all()
    return list(reversed(rows))

@router.get("/stats")
async def get_stats(hours: int = Query(24), db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    since = datetime.utcnow() - timedelta(hours=hours)
    result = await db.execute(
        select(
            func.avg(InternalData.temperature).label("avg_temp"),
            func.min(InternalData.temperature).label("min_temp"),
            func.max(InternalData.temperature).label("max_temp"),
            func.avg(InternalData.co2).label("avg_co2"),
            func.max(InternalData.co2).label("max_co2"),
            func.avg(InternalData.humidity).label("avg_humidity"),
            func.count(InternalData.id).label("count"),
        ).where(InternalData.timestamp >= since)
    )
    row = result.one()
    return {
        "temperature": {"avg": round(row.avg_temp or 0, 2), "min": round(row.min_temp or 0, 2), "max": round(row.max_temp or 0, 2)},
        "co2": {"avg": round(row.avg_co2 or 0, 2), "max": round(row.max_co2 or 0, 2)},
        "humidity": {"avg": round(row.avg_humidity or 0, 2)},
        "count": row.count,
    }
