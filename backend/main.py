from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import select, text
import asyncio
import uuid
import bcrypt as _bcrypt

from database.db import engine, Base, AsyncSessionLocal
from api import auth, internal, external, devices, alerts, websocket_endpoint
from models.models import User
from services.data_simulator import DataSimulator
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
                (gen_random_uuid(), 'Ventilateur Toiture 1', 'fan', 'roof', 'ON'),
                (gen_random_uuid(), 'Ventilateur Toiture 2', 'fan', 'roof', 'OFF'),
                (gen_random_uuid(), 'Ventilateur Toiture 3', 'fan', 'roof', 'ON'),
                (gen_random_uuid(), 'Ventilateur Plafond 1', 'fan', 'ceiling', 'ON'),
                (gen_random_uuid(), 'Ventilateur Plafond 2', 'fan', 'ceiling', 'OFF'),
                (gen_random_uuid(), 'Ventilateur Plafond 3', 'fan', 'ceiling', 'Erreur')
            """))
            await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    from database.db import settings as app_settings
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_default_users()
    await seed_default_devices()

    tasks = []
    if app_settings.simulation_mode:
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
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
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
