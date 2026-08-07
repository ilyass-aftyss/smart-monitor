from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from sqlalchemy import select, text
import asyncio
import uuid
import bcrypt as _bcrypt
import csv
import io

from database.db import engine, Base, AsyncSessionLocal, settings
from api import auth, internal, external, devices, alerts, websocket_endpoint
from models.models import User
from services.data_simulator import DataSimulator
from services.telemetry_client import telemetry_client
from csv_reader.reader import auto_sync_csv_folder

simulator = DataSimulator()


def _make_hash(password: str) -> str:
    return _bcrypt.hashpw(password.encode("utf-8"), _bcrypt.gensalt(12)).decode("utf-8")


async def seed_default_users():
    async with AsyncSessionLocal() as session:
        for username, email, role in [
            ("admin", "admin@smartmonitor.local", "admin"),
            ("viewer", "viewer@smartmonitor.local", "user"),
        ]:
            result = await session.execute(select(User).where(User.username == username))
            user = result.scalar_one_or_none()
            new_hash = _make_hash("admin")
            if not user:
                session.add(User(
                    id=uuid.uuid4(),
                    username=username,
                    email=email,
                    hashed_password=new_hash,
                    role=role,
                    is_active=True,
                ))
            else:
                user.hashed_password = new_hash
        await session.commit()


async def seed_default_devices():
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT COUNT(*) FROM devices"))
        count = result.scalar()
        if count == 0:
            await session.execute(text("""
                INSERT INTO devices (id, name, device_type, location, status) VALUES
                (gen_random_uuid(), 'Actionneur Toiture 1', 'fan', 'roof', 'ON'),
                (gen_random_uuid(), 'Actionneur Toiture 2', 'fan', 'roof', 'OFF'),
                (gen_random_uuid(), 'Actionneur Toiture 3', 'fan', 'roof', 'ON'),
                (gen_random_uuid(), 'Actionneur Plafond 1', 'fan', 'ceiling', 'ON'),
                (gen_random_uuid(), 'Actionneur Plafond 2', 'fan', 'ceiling', 'OFF'),
                (gen_random_uuid(), 'Actionneur Plafond 3', 'fan', 'ceiling', 'Erreur')
            """))
            await session.commit()


async def apply_schema_migrations(conn):
    """Ajoute les colonnes manquantes sur les tables existantes.

    `Base.metadata.create_all` ne crée que les tables absentes : si une table
    existe déjà (volume Docker conservé entre deux versions du modèle), les
    nouvelles colonnes ajoutées au modèle ne sont jamais créées et provoquent
    des `UndefinedColumnError` au runtime. On corrige donc le schéma existant
    ici, de façon idempotente, à chaque démarrage du backend.
    """
    statements = [
        "ALTER TABLE internal_data ADD COLUMN IF NOT EXISTS illuminance FLOAT",
        "ALTER TABLE internal_data ADD COLUMN IF NOT EXISTS partial_vapor_pressure FLOAT",
        "ALTER TABLE internal_data ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'simulation'",
        "ALTER TABLE external_data ADD COLUMN IF NOT EXISTS rain FLOAT",
        "ALTER TABLE external_data ADD COLUMN IF NOT EXISTS wind_cardinal VARCHAR(10)",
        "ALTER TABLE external_data ADD COLUMN IF NOT EXISTS rssi FLOAT",
        "ALTER TABLE external_data ADD COLUMN IF NOT EXISTS battery_v FLOAT",
        "ALTER TABLE external_data ADD COLUMN IF NOT EXISTS device_name VARCHAR(100)",
        "ALTER TABLE external_data ADD COLUMN IF NOT EXISTS solar_device_name VARCHAR(100)",
        "ALTER TABLE external_data ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'simulation'",
    ]
    for statement in statements:
        await conn.execute(text(statement))


@asynccontextmanager
async def lifespan(app: FastAPI):
    from database.db import settings as app_settings
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await apply_schema_migrations(conn)
    await seed_default_users()
    await seed_default_devices()

    tasks = []
    if app_settings.greenhouse_telemetry_url:
        print("[Mode] TÉLÉMÉTRIE RÉELLE — polling HTTP du serveur distant (station physique)")
        tasks.append(asyncio.create_task(telemetry_client.run()))
        # Le simulateur ne backfill/complète que l'historique s'il manque de données,
        # il ne génère plus de nouvelles mesures tant que la station réelle répond.
        if app_settings.simulation_mode:
            tasks.append(asyncio.create_task(simulator._backfill_history(hours=48)))
    elif app_settings.simulation_mode:
        print("[Mode] SIMULATION active — données générées automatiquement")
        tasks.append(asyncio.create_task(simulator.run()))
    else:
        print("[Mode] PRODUCTION — lecture CSV réels depuis:", app_settings.csv_data_path)

    # CSV sync always runs (no-op if folder is empty in simulation mode)
    tasks.append(asyncio.create_task(auto_sync_csv_folder(interval_seconds=60)))

    yield

    for t in tasks:
        t.cancel()


app = FastAPI(
    title="Smart Environmental Monitoring API",
    description="Industrial IoT monitoring platform with 3D visualization",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(internal.router, prefix="/api/internal", tags=["Internal Sensors"])
app.include_router(external.router, prefix="/api/external", tags=["External Sensors"])
app.include_router(devices.router, prefix="/api/devices", tags=["Devices"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(websocket_endpoint.router, prefix="/ws", tags=["WebSocket"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "Smart Environmental Monitoring API"}


@app.get("/api/telemetry/raw", tags=["Télémétrie"])
async def get_raw_telemetry(current_user=Depends(auth.get_current_user)):
    """Proxy sécurisé : retourne les données brutes JSON de la station réelle."""
    import httpx
    from models.models import InternalData, ExternalData

    telemetry_url = settings.greenhouse_telemetry_url
    if telemetry_url:
        try:
            async with httpx.AsyncClient(timeout=10.0, headers={
                "Accept": "application/json",
                "ngrok-skip-browser-warning": "true",
            }) as client:
                response = await client.get(f"{telemetry_url.rstrip('/')}/api/telemetry/latest")
                response.raise_for_status()
                data = response.json()
                data["_source"] = "station"
                return data
        except httpx.HTTPStatusError as e:
            return {"error": f"HTTP {e.response.status_code}", "_source": "error"}
        except Exception as e:
            return {"error": str(e), "_source": "error"}

    async with AsyncSessionLocal() as session:
        int_row = (await session.execute(
            select(InternalData).order_by(InternalData.timestamp.desc()).limit(1)
        )).scalar_one_or_none()
        ext_row = (await session.execute(
            select(ExternalData).order_by(ExternalData.timestamp.desc()).limit(1)
        )).scalar_one_or_none()

    indoor: dict = {}
    if int_row:
        indoor = {
            "timestamp": int_row.timestamp.strftime("%Y-%m-%d %H:%M:%S") if int_row.timestamp else None,
            "temperature_c": str(int_row.temperature) if int_row.temperature is not None else None,
            "humidity_pct": str(int_row.humidity) if int_row.humidity is not None else None,
            "dew_point_c": str(int_row.dew_point) if int_row.dew_point is not None else None,
            "partial_vapor_pressure_hPa": str(int_row.partial_vapor_pressure) if int_row.partial_vapor_pressure is not None else None,
            "illuminance_lux": str(int_row.illuminance) if int_row.illuminance is not None else None,
            "co2_ppm": str(int_row.co2) if int_row.co2 is not None else None,
            "atmospheric_pressure_hPa": str(int_row.pressure) if int_row.pressure is not None else None,
        }

    outdoor: dict = {}
    solar: dict = {}
    if ext_row:
        outdoor = {
            "timestamp": ext_row.timestamp.strftime("%Y-%m-%d %H:%M:%S") if ext_row.timestamp else None,
            "device_name": ext_row.device_name,
            "rssi": str(ext_row.rssi) if ext_row.rssi is not None else None,
            "temperature_c": str(ext_row.temperature) if ext_row.temperature is not None else None,
            "humidity_pct": str(ext_row.humidity) if ext_row.humidity is not None else None,
            "wind_speed_kmh": str(ext_row.wind_speed) if ext_row.wind_speed is not None else None,
            "wind_cardinal": ext_row.wind_cardinal,
            "rain_mm": str(ext_row.rain) if ext_row.rain is not None else None,
        }
        solar = {
            "timestamp": ext_row.timestamp.strftime("%Y-%m-%d %H:%M:%S") if ext_row.timestamp else None,
            "device_name": ext_row.solar_device_name,
            "battery_v": str(ext_row.battery_v) if ext_row.battery_v is not None else None,
            "irradiance_wm2": str(ext_row.radiation) if ext_row.radiation is not None else None,
        }

    return {
        "outdoor_weather": outdoor,
        "solar_irradiance": solar,
        "indoor_climat_hd50": indoor,
        "_source": (ext_row.source if ext_row else "simulation"),
    }


@app.get("/api/telemetry/status", tags=["Télémétrie"])
async def get_telemetry_status(current_user=Depends(auth.get_current_user)):
    """Retourne l'état de la connexion HTTP au serveur de télémétrie distant."""
    return {
        **telemetry_client.status(),
        "url_active": bool(settings.greenhouse_telemetry_url),
        "poll_seconds": settings.telemetry_poll_seconds,
        "simulation_mode": settings.simulation_mode,
    }


@app.post("/api/csv/import", tags=["CSV Import"])
async def trigger_csv_import(current_user=Depends(auth.get_current_user)):
    """Déclenche manuellement l'import des fichiers CSV."""
    from csv_reader.reader import CSV_PATH, import_internal_csv, import_external_csv
    results = {"internal": [], "external": [], "errors": []}
    if not CSV_PATH.exists():
        return {"status": "error", "message": f"Dossier CSV introuvable: {CSV_PATH}"}
    for f in sorted(CSV_PATH.glob("internal*.csv")):
        try:
            n = await import_internal_csv(f)
            results["internal"].append({"file": f.name, "rows": n})
        except Exception as e:
            results["errors"].append({"file": f.name, "error": str(e)})
    for f in sorted(CSV_PATH.glob("external*.csv")):
        try:
            n = await import_external_csv(f)
            results["external"].append({"file": f.name, "rows": n})
        except Exception as e:
            results["errors"].append({"file": f.name, "error": str(e)})
    return {"status": "ok", "results": results}


@app.get("/api/csv/status", tags=["CSV Import"])
async def csv_status(current_user=Depends(auth.get_current_user)):
    """Vérifie l'état du dossier CSV et liste les fichiers disponibles."""
    from csv_reader.reader import CSV_PATH
    if not CSV_PATH.exists():
        return {"status": "not_found", "path": str(CSV_PATH), "files": []}
    files = []
    for f in sorted(CSV_PATH.iterdir()):
        if f.suffix == ".csv":
            files.append({"name": f.name, "size_kb": round(f.stat().st_size / 1024, 1)})
    return {"status": "ok", "path": str(CSV_PATH), "file_count": len(files), "files": files}


@app.get("/api/csv/export", tags=["CSV Import"])
async def export_csv(current_user=Depends(auth.get_current_user)):
    """Exporte toutes les mesures internes et externes dans un CSV unique."""
    from database.db import AsyncSessionLocal
    from models.models import InternalData, ExternalData

    async with AsyncSessionLocal() as session:
        internal_result = await session.execute(select(InternalData).order_by(InternalData.timestamp))
        external_result = await session.execute(select(ExternalData).order_by(ExternalData.timestamp))
        internal_rows = internal_result.scalars().all()
        external_rows = external_result.scalars().all()

    columns = [
        "dataset", "id", "timestamp", "temperature", "humidity", "co2", "voc", "vpd",
        "pressure", "dew_point", "illuminance", "partial_vapor_pressure", "radiation",
        "wind_speed", "rain", "wind_cardinal", "rssi", "battery_v", "device_name",
        "solar_device_name", "source",
    ]
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=columns)
    writer.writeheader()
    for row in internal_rows:
        writer.writerow({
            "dataset": "internal",
            "id": row.id,
            "timestamp": row.timestamp.isoformat() if row.timestamp else "",
            "temperature": row.temperature,
            "humidity": row.humidity,
            "co2": row.co2,
            "voc": row.voc,
            "vpd": row.vpd,
            "pressure": row.pressure,
            "dew_point": row.dew_point,
            "illuminance": row.illuminance,
            "partial_vapor_pressure": row.partial_vapor_pressure,
            "source": row.source,
        })
    for row in external_rows:
        writer.writerow({
            "dataset": "external",
            "id": row.id,
            "timestamp": row.timestamp.isoformat() if row.timestamp else "",
            "temperature": row.temperature,
            "humidity": row.humidity,
            "radiation": row.radiation,
            "wind_speed": row.wind_speed,
            "rain": row.rain,
            "wind_cardinal": row.wind_cardinal,
            "rssi": row.rssi,
            "battery_v": row.battery_v,
            "device_name": row.device_name,
            "solar_device_name": row.solar_device_name,
            "source": row.source,
        })

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="smart-monitor-historique.csv"'},
    )
