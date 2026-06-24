from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime
from typing import List
from pydantic import BaseModel
import uuid

from database.db import get_db
from models.models import Device
from api.auth import get_current_user, get_admin_user

router = APIRouter()

class DeviceOut(BaseModel):
    id: str
    name: str
    device_type: str
    location: str
    status: str
    last_update: datetime

    class Config:
        from_attributes = True

class DeviceUpdate(BaseModel):
    status: str

@router.get("/", response_model=List[DeviceOut])
async def get_devices(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(Device).order_by(Device.location, Device.name))
    devices = result.scalars().all()
    return [DeviceOut(id=str(d.id), name=d.name, device_type=d.device_type, location=d.location, status=d.status, last_update=d.last_update) for d in devices]

@router.patch("/{device_id}/status", response_model=DeviceOut)
async def update_device_status(
    device_id: str,
    update_data: DeviceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_admin_user)
):
    valid_statuses = ["ON", "OFF", "Erreur"]
    if update_data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = await db.execute(select(Device).where(Device.id == uuid.UUID(device_id)))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    device.status = update_data.status
    device.last_update = datetime.utcnow()
    await db.commit()
    await db.refresh(device)
    return DeviceOut(id=str(device.id), name=device.name, device_type=device.device_type, location=device.location, status=device.status, last_update=device.last_update)

@router.get("/summary")
async def get_devices_summary(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(Device))
    devices = result.scalars().all()
    return {
        "total": len(devices),
        "on": sum(1 for d in devices if d.status == "ON"),
        "off": sum(1 for d in devices if d.status == "OFF"),
        "error": sum(1 for d in devices if d.status == "Erreur"),
        "maintenance": sum(1 for d in devices if d.status == "Maintenance"),
    }
