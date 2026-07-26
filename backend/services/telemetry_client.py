"""
Client de télémétrie HTTP — récupère les données réelles des stations de la serre
exposées par le serveur Flask distant (via tunnel ngrok).

Protocole : HTTP GET polling
Endpoint  : {GREENHOUSE_TELEMETRY_URL}  ex: https://xxxx.ngrok-free.dev/api/telemetry/latest
Fréquence : toutes les TELEMETRY_POLL_SECONDS (def. 20 s)

Format de réponse attendu (JSON) :
{
  "outdoor_weather": {timestamp, device_name, rssi, temperature_c, humidity_pct,
                       wind_speed_kmh, wind_cardinal, rain_mm},
  "solar_irradiance": {timestamp, device_name, battery_v, irradiance_wm2},
  "indoor_climat_hd50": {timestamp, temperature_c, humidity_pct, dew_point_c,
                          partial_vapor_pressure_hPa, illuminance_lux, co2_ppm,
                          atmospheric_pressure_hPa}
}

Toutes les valeurs numériques du serveur distant arrivent sous forme de chaînes
de caractères ("24.32") — elles sont converties ici en float.
"""

import asyncio
import httpx
from datetime import datetime
from typing import Optional

from database.db import AsyncSessionLocal, settings
from models.models import InternalData, ExternalData
from api.websocket_endpoint import broadcast_internal_data, broadcast_external_data, broadcast_alert
from services.alert_rules import check_internal_alerts

HEADERS = {
    "Accept": "application/json",
    # Passe automatiquement la page d'interstice de confirmation ngrok (free tier)
    "ngrok-skip-browser-warning": "true",
}


def _to_float(value) -> Optional[float]:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _parse_timestamp(value) -> Optional[datetime]:
    if not value:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


class TelemetryClient:
    """Interroge périodiquement le serveur distant via HTTP et diffuse les données réelles."""

    def __init__(self, url: str, poll_seconds: int = 20):
        self.url = url.rstrip("/")
        self.poll_seconds = poll_seconds
        self.last_internal_ts: Optional[datetime] = None
        self.last_external_ts: Optional[datetime] = None
        self.last_success: Optional[datetime] = None
        self.last_error: Optional[str] = None
        self.consecutive_failures = 0

    def status(self) -> dict:
        return {
            "connected": self.last_error is None and self.last_success is not None,
            "url_configured": bool(self.url),
            "last_success": self.last_success.isoformat() if self.last_success else None,
            "last_error": self.last_error,
            "consecutive_failures": self.consecutive_failures,
        }

    async def _fetch(self) -> Optional[dict]:
        async with httpx.AsyncClient(timeout=10.0, headers=HEADERS) as client:
            response = await client.get(f"{self.url}/api/telemetry/latest")
            response.raise_for_status()
            return response.json()

    def _map_internal(self, indoor: dict) -> Optional[dict]:
        if not indoor:
            return None
        ts = _parse_timestamp(indoor.get("timestamp"))
        return {
            "timestamp": ts,
            "temperature": _to_float(indoor.get("temperature_c")),
            "humidity": _to_float(indoor.get("humidity_pct")),
            "dew_point": _to_float(indoor.get("dew_point_c")),
            "partial_vapor_pressure": _to_float(indoor.get("partial_vapor_pressure_hPa")),
            "illuminance": _to_float(indoor.get("illuminance_lux")),
            "co2": _to_float(indoor.get("co2_ppm")),
            "pressure": _to_float(indoor.get("atmospheric_pressure_hPa")),
            "voc": None,
            "vpd": None,
            "source": "station",
        }

    def _map_external(self, outdoor: dict, solar: dict) -> Optional[dict]:
        if not outdoor and not solar:
            return None
        outdoor = outdoor or {}
        solar = solar or {}
        ts = _parse_timestamp(outdoor.get("timestamp")) or _parse_timestamp(solar.get("timestamp"))
        return {
            "timestamp": ts,
            "temperature": _to_float(outdoor.get("temperature_c")),
            "humidity": _to_float(outdoor.get("humidity_pct")),
            "wind_speed": _to_float(outdoor.get("wind_speed_kmh")),
            "wind_cardinal": outdoor.get("wind_cardinal"),
            "rain": _to_float(outdoor.get("rain_mm")),
            "rssi": _to_float(outdoor.get("rssi")),
            "device_name": outdoor.get("device_name"),
            "radiation": _to_float(solar.get("irradiance_wm2")),
            "battery_v": _to_float(solar.get("battery_v")),
            "solar_device_name": solar.get("device_name"),
            "source": "station",
        }

    async def _persist_and_broadcast(self, internal_vals: Optional[dict], external_vals: Optional[dict]):
        async with AsyncSessionLocal() as session:
            if internal_vals and internal_vals["timestamp"] and internal_vals["timestamp"] != self.last_internal_ts:
                self.last_internal_ts = internal_vals["timestamp"]
                row = InternalData(**internal_vals)
                session.add(row)
                alerts = check_internal_alerts(internal_vals)
                for alert in alerts:
                    session.add(alert)
                await session.commit()
                broadcast_payload = {k: v for k, v in internal_vals.items() if k != "timestamp"}
                broadcast_payload["timestamp"] = internal_vals["timestamp"].isoformat()
                await broadcast_internal_data(broadcast_payload)
                for alert in alerts:
                    await broadcast_alert({"type": alert.alert_type, "severity": alert.severity, "message": alert.message})

            if external_vals and external_vals["timestamp"] and external_vals["timestamp"] != self.last_external_ts:
                self.last_external_ts = external_vals["timestamp"]
                session.add(ExternalData(**external_vals))
                await session.commit()
                broadcast_payload = {k: v for k, v in external_vals.items() if k != "timestamp"}
                broadcast_payload["timestamp"] = external_vals["timestamp"].isoformat()
                await broadcast_external_data(broadcast_payload)

    async def run(self):
        if not self.url:
            print("[TelemetryClient] GREENHOUSE_TELEMETRY_URL non configurée — client désactivé")
            return

        print(f"[TelemetryClient] Démarrage — polling HTTP toutes les {self.poll_seconds}s")
        while True:
            try:
                payload = await self._fetch()
                internal_vals = self._map_internal(payload.get("indoor_climat_hd50"))
                external_vals = self._map_external(payload.get("outdoor_weather"), payload.get("solar_irradiance"))
                await self._persist_and_broadcast(internal_vals, external_vals)

                self.last_success = datetime.utcnow()
                self.last_error = None
                self.consecutive_failures = 0

            except httpx.HTTPStatusError as e:
                self.consecutive_failures += 1
                self.last_error = f"HTTP {e.response.status_code}"
                print(f"[TelemetryClient] Erreur HTTP: {self.last_error}")
            except httpx.RequestError as e:
                self.consecutive_failures += 1
                self.last_error = f"Connexion échouée: {e}"
                print(f"[TelemetryClient] {self.last_error}")
            except Exception as e:
                self.consecutive_failures += 1
                self.last_error = str(e)
                print(f"[TelemetryClient] Erreur inattendue: {e}")

            await asyncio.sleep(self.poll_seconds)


telemetry_client = TelemetryClient(
    url=getattr(settings, "greenhouse_telemetry_url", "") or "",
    poll_seconds=getattr(settings, "telemetry_poll_seconds", 20),
)
