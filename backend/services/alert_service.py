from database.db import AsyncSessionLocal
from models.models import Alert
from datetime import datetime

class AlertService:
    @staticmethod
    async def create_alert(alert_type: str, severity: str, message: str, value: float = None, threshold: float = None):
        async with AsyncSessionLocal() as session:
            alert = Alert(
                alert_type=alert_type,
                severity=severity,
                message=message,
                value=value,
                threshold=threshold,
            )
            session.add(alert)
            await session.commit()
