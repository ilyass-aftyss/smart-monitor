from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import asyncio
import json
from datetime import datetime

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for d in dead:
            self.active_connections.remove(d)

manager = ConnectionManager()

@router.websocket("/live")
async def websocket_live(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

async def broadcast_internal_data(data: dict):
    """Diffuse les données internes — fréquence 1 minute."""
    await manager.broadcast({"type": "internal_update", "data": data, "timestamp": datetime.utcnow().isoformat()})

async def broadcast_external_data(data: dict):
    """Diffuse les données externes — fréquence 15 minutes."""
    await manager.broadcast({"type": "external_update", "data": data, "timestamp": datetime.utcnow().isoformat()})

async def broadcast_alert(alert: dict):
    await manager.broadcast({"type": "alert", "data": alert, "timestamp": datetime.utcnow().isoformat()})
