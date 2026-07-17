"""
CSV Reader — Version 1: lecture locale, Version 2: connexion Synology NAS.
Montez votre NAS via SMB puis pointez CSV_DATA_PATH vers le dossier monté.
"""

import os
import asyncio
from pathlib import Path
import pandas as pd
from datetime import datetime
from database.db import AsyncSessionLocal, settings
from models.models import InternalData, ExternalData

CSV_PATH = Path(settings.csv_data_path)

INTERNAL_COLUMN_MAP = {
    "timestamp": "timestamp",
    "temperature": "temperature",
    "temp": "temperature",
    "co2": "co2",
    "humidity": "humidity",
    "hum": "humidity",
    "voc": "voc",
    "vpd": "vpd",
    "pressure": "pressure",
    "pression": "pressure",
    "dew_point": "dew_point",
    "point_rosee": "dew_point",
}

EXTERNAL_COLUMN_MAP = {
    "timestamp": "timestamp",
    "radiation": "radiation",
    "radiation_solaire": "radiation",
    "wind_speed": "wind_speed",
    "vitesse_vent": "wind_speed",
    "humidity": "humidity",
    "humidite": "humidity",
    "temperature": "temperature",
    "temp": "temperature",
}


def _normalize_columns(df: pd.DataFrame, col_map: dict) -> pd.DataFrame:
    df.columns = [c.lower().strip() for c in df.columns]
    rename = {c: col_map[c] for c in df.columns if c in col_map}
    return df.rename(columns=rename)


async def import_internal_csv(file_path: Path):
    df = pd.read_csv(file_path, parse_dates=["timestamp"] if "timestamp" in pd.read_csv(file_path, nrows=0).columns else [])
    df = _normalize_columns(df, INTERNAL_COLUMN_MAP)
    if "timestamp" not in df.columns:
        df["timestamp"] = datetime.utcnow()

    records = []
    for _, row in df.iterrows():
        records.append(InternalData(
            timestamp=row.get("timestamp", datetime.utcnow()),
            temperature=row.get("temperature"),
            co2=row.get("co2"),
            humidity=row.get("humidity"),
            voc=row.get("voc"),
            vpd=row.get("vpd"),
            pressure=row.get("pressure"),
            dew_point=row.get("dew_point"),
        ))

    async with AsyncSessionLocal() as session:
        session.add_all(records)
        await session.commit()
    return len(records)


async def import_external_csv(file_path: Path):
    df = pd.read_csv(file_path)
    df = _normalize_columns(df, EXTERNAL_COLUMN_MAP)
    if "timestamp" not in df.columns:
        df["timestamp"] = datetime.utcnow()

    records = []
    for _, row in df.iterrows():
        records.append(ExternalData(
            timestamp=row.get("timestamp", datetime.utcnow()),
            radiation=row.get("radiation"),
            wind_speed=row.get("wind_speed"),
            humidity=row.get("humidity"),
            temperature=row.get("temperature"),
        ))

    async with AsyncSessionLocal() as session:
        session.add_all(records)
        await session.commit()
    return len(records)


async def auto_sync_csv_folder(interval_seconds: int = 60):
    """
    Boucle de synchronisation automatique — Version 2 (Synology NAS).
    Montez \\NAS\DATA\ via SMB et pointez CSV_DATA_PATH vers le point de montage.
    """
    while True:
        try:
            if CSV_PATH.exists():
                for f in CSV_PATH.glob("internal*.csv"):
                    n = await import_internal_csv(f)
                    print(f"[CSV Sync] Imported {n} rows from {f.name}")
                for f in CSV_PATH.glob("external*.csv"):
                    n = await import_external_csv(f)
                    print(f"[CSV Sync] Imported {n} rows from {f.name}")
        except Exception as e:
            print(f"[CSV Sync] Error: {e}")
        await asyncio.sleep(interval_seconds)
