from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, update
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from database.db import get_db
from models.models import Alert
from api.auth import get_current_user

router = APIRouter()

class AlertOut(BaseModel):
    id: int
    timestamp: datetime
    alert_type: str
    severity: str
    message: str
    value: Optional[float]
    threshold: Optional[float]
    acknowledged: bool
    acknowledged_at: Optional[datetime]
    acknowledged_by: Optional[str]

    class Config:
        from_attributes = True

@router.get("/", response_model=List[AlertOut])
async def get_alerts(
    limit: int = Query(50, ge=1, le=200),
    unacknowledged_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = select(Alert).order_by(desc(Alert.timestamp)).limit(limit)
    if unacknowledged_only:
        query = query.where(Alert.acknowledged == False)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.acknowledged = True
    alert.acknowledged_at = datetime.utcnow()
    alert.acknowledged_by = current_user.username
    await db.commit()
    return {"status": "acknowledged"}

@router.get("/stats")
async def get_alert_stats(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(Alert))
    alerts = result.scalars().all()
    return {
        "total": len(alerts),
        "unacknowledged": sum(1 for a in alerts if not a.acknowledged),
        "critical": sum(1 for a in alerts if a.severity == "critical"),
        "warning": sum(1 for a in alerts if a.severity == "warning"),
    }
