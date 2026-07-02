import asyncio
import random
import math
from datetime import datetime, timedelta
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware  # <-- AJOUT POUR LA PERFORMANCE
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Smart Environmental Monitoring Mock API", version="1.0.0")

# 1. COMPRESSION GZIP : Indispensable pour transférer rapidement les milliers de points des graphiques
app.add_middleware(GZipMiddleware, minimum_size=500)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── STATE MANAGEMENT ────────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for d in dead:
            self.disconnect(d)

manager = ConnectionManager()

# Mock storage for history
internal_history = []
external_history = []
alerts = []
alert_id_counter = 1

# Mock devices (Fans)
devices = [
    {"id": "a1b2c3d4-1111-1111-1111-111111111111", "name": "Ventilateur Toiture 1", "device_type": "fan", "location": "roof", "status": "ON", "last_update": datetime.utcnow()},
    {"id": "e5f6g7h8-2222-2222-2222-222222222222", "name": "Ventilateur Toiture 2", "device_type": "fan", "location": "roof", "status": "OFF", "last_update": datetime.utcnow()},
    {"id": "i9j0k1l2-3333-3333-3333-333333333333", "name": "Ventilateur Toiture 3", "device_type": "fan", "location": "roof", "status": "ON", "last_update": datetime.utcnow()},
    {"id": "m3n4o5p6-4444-4444-4444-444444444444", "name": "Ventilateur Plafond 1", "device_type": "fan", "location": "ceiling", "status": "ON", "last_update": datetime.utcnow()},
    {"id": "q7r8s9t0-5555-5555-5555-555555555555", "name": "Ventilateur Plafond 2", "device_type": "fan", "location": "ceiling", "status": "OFF", "last_update": datetime.utcnow()},
    {"id": "u1v2w3x4-6666-6666-6666-666666666666", "name": "Ventilateur Plafond 3", "device_type": "fan", "location": "ceiling", "status": "Erreur", "last_update": datetime.utcnow()}
]

# ─── GENERATOR FUNCTIONS ─────────────────────────────────────────────────────
time_step = 0

def generate_internal_data(t: int, ts: datetime):
    base_temp     = 22 + 3  * math.sin(t / 60) + random.gauss(0, 0.3)
    base_humidity = 55 + 10 * math.sin(t / 90 + 1) + random.gauss(0, 1)
    co2           = 850 + 150 * math.sin(t / 45) + random.gauss(0, 10)
    voc           = 120 + 50 * random.random() + random.gauss(0, 5)
    pressure      = 1013.25 + random.gauss(0, 0.5)
    vpd           = round(0.6108 * math.exp(17.27 * base_temp / (base_temp + 237.3)) * (1 - base_humidity / 100), 3)
    dew_point     = base_temp - (100 - base_humidity) / 5
    return {
        "id": t,
        "timestamp": ts,
        "temperature": round(base_temp, 2),
        "co2":         round(co2, 1),
        "humidity":    round(base_humidity, 1),
        "voc":         round(voc, 1),
        "vpd":         round(vpd, 3),
        "pressure":    round(pressure, 2),
        "dew_point":   round(dew_point, 2),
    }

def generate_external_data(t: int, ts: datetime):
    radiation    = max(0, 500 * math.sin(math.pi * (t % 1440) / 1440) + random.gauss(0, 20))
    wind_speed   = abs(3 + 2 * math.sin(t / 30) + random.gauss(0, 0.5))
    humidity     = 60 + 15 * math.sin(t / 120) + random.gauss(0, 2)
    temperature  = 20 + 8  * math.sin(math.pi * (t % 1440) / 1440) + random.gauss(0, 0.5)
    return {
        "id": t,
        "timestamp": ts,
        "radiation":   round(max(0, radiation), 1),
        "wind_speed":  round(wind_speed, 2),
        "humidity":    round(humidity, 1),
        "temperature": round(temperature, 2),
    }

# Backfill initial history for charts (48 hours of data)
now = datetime.utcnow()
for minutes_ago in range(2880, 0, -1):
    ts = now - timedelta(minutes=minutes_ago)
    t = 2880 - minutes_ago
    internal_history.append(generate_internal_data(t, ts))
    if minutes_ago % 15 == 0:
        external_history.append(generate_external_data(t, ts))

time_step = 2880

# Background task for live updates
async def live_data_generator():
    global time_step, internal_history, external_history, alerts
    while True:
        try:
            await asyncio.sleep(5)
            time_step += 1
            ts = datetime.utcnow()
            
            internal_val = generate_internal_data(time_step, ts)
            external_val = generate_external_data(time_step, ts)
            
            # Append and trim history efficiently
            internal_history.append(internal_val)
            if len(internal_history) > 3000:
                del internal_history[0]  # Plus rapide que pop(0)
                
            if time_step % 3 == 0: 
                external_history.append(external_val)
                if len(external_history) > 500:
                    del external_history[0]
                
                await manager.broadcast({
                    "type": "external_update",
                    "data": {
                        "radiation": external_val["radiation"],
                        "wind_speed": external_val["wind_speed"],
                        "humidity": external_val["humidity"],
                        "temperature": external_val["temperature"]
                    },
                    "timestamp": ts.isoformat()
                })
            
            await manager.broadcast({
                "type": "internal_update",
                "data": {
                    "temperature": internal_val["temperature"],
                    "co2": internal_val["co2"],
                    "humidity": internal_val["humidity"],
                    "voc": internal_val["voc"],
                    "vpd": internal_val["vpd"],
                    "pressure": internal_val["pressure"],
                    "dew_point": internal_val["dew_point"]
                },
                "timestamp": ts.isoformat()
            })
            
            # Randomly trigger new alerts occasionally
            if random.random() < 0.05:
                global alert_id_counter
                alert_id_counter += 1
                alert_types = ["temperature_high", "humidity_low", "co2_high"]
                alert_type = random.choice(alert_types)
                messages = {
                    "temperature_high": "Température critique: 31.2°C (seuil > 30°C)",
                    "humidity_low": "Humidité trop basse: 58.4% (risque de stress hydrique)",
                    "co2_high": "CO₂ au-dessus de l'optimal: 1240 ppm (optimal 800-1000)"
                }
                new_alert = {
                    "id": alert_id_counter,
                    "timestamp": ts,
                    "alert_type": alert_type,
                    "severity": "critical" if "critique" in messages[alert_type] else "warning",
                    "message": messages[alert_type],
                    "value": 31.2 if alert_type == "temperature_high" else (58.4 if alert_type == "humidity_low" else 1240.0),
                    "threshold": 30.0 if alert_type == "temperature_high" else (60.0 if alert_type == "humidity_low" else 1200.0),
                    "acknowledged": False,
                    "acknowledged_at": None,
                    "acknowledged_by": None
                }
                alerts.append(new_alert)
                
                # 2. NETTOYAGE DES ALERTES : Évite la saturation mémoire au bout de plusieurs heures
                if len(alerts) > 500:
                    del alerts[0]

                await manager.broadcast({
                    "type": "alert",
                    "data": {
                        "type": new_alert["alert_type"],
                        "severity": new_alert["severity"],
                        "message": new_alert["message"]
                    },
                    "timestamp": ts.isoformat()
                })
        except Exception as e:
            print(f"Generator error: {e}")

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(live_data_generator())

# ─── MODELS ──────────────────────────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    role: str
    username: str
    token_type: str = "bearer"

class DeviceUpdate(BaseModel):
    status: str

# ─── ROUTING ─────────────────────────────────────────────────────────────────
@app.post("/api/auth/token", response_model=TokenResponse)
async def login(username: str = Depends(OAuth2PasswordBearer(tokenUrl="token", auto_error=False))):
    return TokenResponse(
        access_token="mock-access-token",
        role="admin",
        username="admin"
    )

@app.post("/api/auth/token")
async def login_form(form_data: OAuth2PasswordRequestForm = Depends()):
    return TokenResponse(
        access_token="mock-access-token",
        role="admin",
        username=form_data.username
    )

@app.get("/api/auth/me")
async def get_me():
    return {
        "id": "a1b2c3d4-1111-1111-1111-111111111111",
        "username": "admin",
        "email": "admin@smartmonitor.local",
        "role": "admin",
        "is_active": True
    }

@app.get("/api/internal/latest")
async def get_internal_latest():
    if not internal_history:
        return generate_internal_data(0, datetime.utcnow())
    return internal_history[-1]

@app.get("/api/internal/history")
async def get_internal_history(hours: int = 24, limit: int = 500):
    since = datetime.utcnow() - timedelta(hours=hours)
    filtered = [x for x in internal_history if x["timestamp"] >= since]
    return filtered[-limit:]

@app.get("/api/internal/stats")
async def get_internal_stats(hours: int = 24):
    since = datetime.utcnow() - timedelta(hours=hours)
    filtered = [x for x in internal_history if x["timestamp"] >= since]
    if not filtered:
        return {
            "temperature": {"avg": 22.0, "min": 18.0, "max": 25.0},
            "co2": {"avg": 850.0, "max": 1000.0},
            "humidity": {"avg": 72.0},
            "count": 0
        }
    temps = [x["temperature"] for x in filtered]
    co2s = [x["co2"] for x in filtered]
    hums = [x["humidity"] for x in filtered]
    return {
        "temperature": {"avg": round(sum(temps)/len(temps), 2), "min": min(temps), "max": max(temps)},
        "co2": {"avg": round(sum(co2s)/len(co2s), 2), "max": max(co2s)},
        "humidity": {"avg": round(sum(hums)/len(hums), 2)},
        "count": len(filtered)
    }

@app.get("/api/external/latest")
async def get_external_latest():
    if not external_history:
        return generate_external_data(0, datetime.utcnow())
    return external_history[-1]

@app.get("/api/external/history")
async def get_external_history(hours: int = 24, limit: int = 200):
    since = datetime.utcnow() - timedelta(hours=hours)
    filtered = [x for x in external_history if x["timestamp"] >= since]
    return filtered[-limit:]

@app.get("/api/devices/")
async def get_devices_route():
    return devices

@app.patch("/api/devices/{device_id}/status")
async def update_device_status(device_id: str, update_data: DeviceUpdate):
    for d in devices:
        if d["id"] == device_id:
            d["status"] = update_data.status
            d["last_update"] = datetime.utcnow()
            return d
    raise HTTPException(status_code=404, detail="Device not found")

@app.get("/api/devices/summary")
async def get_devices_summary():
    return {
        "total": len(devices),
        "on": sum(1 for d in devices if d.status == "ON"),
        "off": sum(1 for d in devices if d.status == "OFF"),
        "error": sum(1 for d in devices if d.status == "Erreur"),
        "maintenance": sum(1 for d in devices if d.status == "Maintenance")
    }

@app.get("/api/alerts/")
async def get_alerts_route(limit: int = 50, unacknowledged_only: bool = False):
    filtered = alerts
    if unacknowledged_only:
        filtered = [a for a in alerts if not a["acknowledged"]]
    # Tri décroissant avec limite stricte pour la rapidité
    return sorted(filtered, key=lambda x: x["timestamp"], reverse=True)[:limit]

@app.post("/api/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: int):
    for a in alerts:
        if a["id"] == alert_id:
            a["acknowledged"] = True
            a["acknowledged_at"] = datetime.utcnow()
            a["acknowledged_by"] = "admin"
            return {"status": "acknowledged"}
    raise HTTPException(status_code=404, detail="Alert not found")

@app.get("/api/alerts/stats")
async def get_alert_stats():
    return {
        "total": len(alerts),
        "unacknowledged": sum(1 for a in alerts if not a["acknowledged"]),
        "critical": sum(1 for a in alerts if a["severity"] == "critical"),
        "warning": sum(1 for a in alerts if a["severity"] == "warning")
    }

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Garde la connexion ouverte avec le client frontend
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "Smart Environmental Monitoring Mock API"}

if __name__ == "__main__":
    uvicorn.run("mock_backend:app", host="127.0.0.1", port=8000, reload=True)