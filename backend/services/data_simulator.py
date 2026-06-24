import asyncio
import random
import math
from datetime import datetime, timedelta
from sqlalchemy import select, func
from database.db import AsyncSessionLocal
from models.models import InternalData, ExternalData, Alert
from api.websocket_endpoint import broadcast_internal_data, broadcast_external_data, broadcast_alert

# ─── Seuils agronomiques du fraisier ────────────────────────────────────────
# Température diurne optimale : 18–23 °C   |  Nocturne : 10–13 °C
# Humidité relative optimale  : 70–75 %
# CO₂ optimal                 : 800–1000 ppm
# ─────────────────────────────────────────────────────────────────────────────

class DataSimulator:
    def __init__(self):
        self.time_step = 0
        self.thresholds = {
            "temperature": {
                "warn_high":  23,    # au-dessus de la plage optimale diurne
                "crit_high":  30,
                "warn_low":   18,    # en-dessous de la plage optimale diurne
                "crit_low":   10,    # température nocturne minimale
            },
            "humidity": {
                "warn_high":  75,    # limite haute plage optimale
                "crit_high":  85,
                "warn_low":   70,    # limite basse plage optimale
                "crit_low":   60,
            },
            "co2": {
                "warn_high":  1000,  # limite haute plage optimale
                "crit_high":  1200,
                "warn_low":   800,   # limite basse plage optimale
            },
        }

    def _generate_internal(self):
        t = self.time_step
        base_temp     = 22 + 3  * math.sin(t / 60) + random.gauss(0, 0.3)
        base_humidity = 55 + 10 * math.sin(t / 90 + 1) + random.gauss(0, 1)
        co2           = 450 + 150 * math.sin(t / 45) + random.gauss(0, 10)
        voc           = 120 + 50 * random.random() + random.gauss(0, 5)
        pressure      = 1013.25 + random.gauss(0, 0.5)
        vpd           = round(0.6108 * math.exp(17.27 * base_temp / (base_temp + 237.3)) * (1 - base_humidity / 100), 3)
        dew_point     = base_temp - (100 - base_humidity) / 5
        return {
            "temperature": round(base_temp, 2),
            "co2":         round(co2, 1),
            "humidity":    round(base_humidity, 1),
            "voc":         round(voc, 1),
            "vpd":         round(vpd, 3),
            "pressure":    round(pressure, 2),
            "dew_point":   round(dew_point, 2),
        }

    def _generate_external(self):
        t = self.time_step
        radiation    = max(0, 500 * math.sin(math.pi * (t % 1440) / 1440) + random.gauss(0, 20))
        wind_speed   = abs(3 + 2 * math.sin(t / 30) + random.gauss(0, 0.5))
        humidity     = 60 + 15 * math.sin(t / 120) + random.gauss(0, 2)
        temperature  = 20 + 8  * math.sin(math.pi * (t % 1440) / 1440) + random.gauss(0, 0.5)
        return {
            "radiation":   round(max(0, radiation), 1),
            "wind_speed":  round(wind_speed, 2),
            "humidity":    round(humidity, 1),
            "temperature": round(temperature, 2),
        }

    async def _check_alerts(self, session, d: dict):
        thr = self.thresholds
        alerts_to_add = []

        # ── Température ──────────────────────────────────────────────────────
        if d["temperature"] >= thr["temperature"]["crit_high"]:
            alerts_to_add.append(Alert(
                alert_type="temperature", severity="critical",
                message=f"Température critique: {d['temperature']}°C (seuil > {thr['temperature']['crit_high']}°C)",
                value=d["temperature"], threshold=thr["temperature"]["crit_high"],
            ))
        elif d["temperature"] > thr["temperature"]["warn_high"]:
            alerts_to_add.append(Alert(
                alert_type="temperature_high", severity="warning",
                message=f"Température trop élevée: {d['temperature']}°C (optimal 18–23 °C)",
                value=d["temperature"], threshold=thr["temperature"]["warn_high"],
            ))
        elif d["temperature"] <= thr["temperature"]["crit_low"]:
            alerts_to_add.append(Alert(
                alert_type="temperature_low", severity="critical",
                message=f"Température trop basse: {d['temperature']}°C (min nocturne {thr['temperature']['crit_low']}°C)",
                value=d["temperature"], threshold=thr["temperature"]["crit_low"],
            ))
        elif d["temperature"] < thr["temperature"]["warn_low"]:
            alerts_to_add.append(Alert(
                alert_type="temperature_low", severity="warning",
                message=f"Température en-dessous de l'optimal: {d['temperature']}°C (optimal ≥ 18 °C)",
                value=d["temperature"], threshold=thr["temperature"]["warn_low"],
            ))

        # ── Humidité ─────────────────────────────────────────────────────────
        if d["humidity"] >= thr["humidity"]["crit_high"]:
            alerts_to_add.append(Alert(
                alert_type="humidity_high", severity="critical",
                message=f"Humidité critique: {d['humidity']}% (risque de maladies fongiques)",
                value=d["humidity"], threshold=thr["humidity"]["crit_high"],
            ))
        elif d["humidity"] > thr["humidity"]["warn_high"]:
            alerts_to_add.append(Alert(
                alert_type="humidity_high", severity="warning",
                message=f"Humidité trop élevée: {d['humidity']}% (optimal 70–75 %)",
                value=d["humidity"], threshold=thr["humidity"]["warn_high"],
            ))
        elif d["humidity"] <= thr["humidity"]["crit_low"]:
            alerts_to_add.append(Alert(
                alert_type="humidity_low", severity="critical",
                message=f"Humidité trop basse: {d['humidity']}% (risque de stress hydrique)",
                value=d["humidity"], threshold=thr["humidity"]["crit_low"],
            ))
        elif d["humidity"] < thr["humidity"]["warn_low"]:
            alerts_to_add.append(Alert(
                alert_type="humidity_low", severity="warning",
                message=f"Humidité en-dessous de l'optimal: {d['humidity']}% (optimal ≥ 70 %)",
                value=d["humidity"], threshold=thr["humidity"]["warn_low"],
            ))

        # ── CO₂ ──────────────────────────────────────────────────────────────
        if d["co2"] >= thr["co2"]["crit_high"]:
            alerts_to_add.append(Alert(
                alert_type="co2", severity="critical",
                message=f"CO₂ niveau critique: {d['co2']} ppm (seuil > {thr['co2']['crit_high']} ppm)",
                value=d["co2"], threshold=thr["co2"]["crit_high"],
            ))
        elif d["co2"] > thr["co2"]["warn_high"]:
            alerts_to_add.append(Alert(
                alert_type="co2_high", severity="warning",
                message=f"CO₂ au-dessus de l'optimal: {d['co2']} ppm (optimal 800–1000 ppm)",
                value=d["co2"], threshold=thr["co2"]["warn_high"],
            ))
        elif d["co2"] < thr["co2"]["warn_low"]:
            alerts_to_add.append(Alert(
                alert_type="co2_low", severity="warning",
                message=f"CO₂ en-dessous de l'optimal: {d['co2']} ppm (optimal ≥ 800 ppm)",
                value=d["co2"], threshold=thr["co2"]["warn_low"],
            ))

        for alert in alerts_to_add:
            session.add(alert)
            await broadcast_alert({"type": alert.alert_type, "severity": alert.severity, "message": alert.message})

    def _generate_internal_at(self, t: int) -> dict:
        base_temp     = 22 + 3  * math.sin(t / 60) + random.gauss(0, 0.3)
        base_humidity = 55 + 10 * math.sin(t / 90 + 1) + random.gauss(0, 1)
        co2           = 450 + 150 * math.sin(t / 45) + random.gauss(0, 10)
        voc           = 120 + 50 * random.random() + random.gauss(0, 5)
        pressure      = 1013.25 + random.gauss(0, 0.5)
        vpd           = round(0.6108 * math.exp(17.27 * base_temp / (base_temp + 237.3)) * (1 - base_humidity / 100), 3)
        dew_point     = base_temp - (100 - base_humidity) / 5
        return {
            "temperature": round(base_temp, 2),
            "co2":         round(co2, 1),
            "humidity":    round(base_humidity, 1),
            "voc":         round(voc, 1),
            "vpd":         round(vpd, 3),
            "pressure":    round(pressure, 2),
            "dew_point":   round(dew_point, 2),
        }

    def _generate_external_at(self, t: int) -> dict:
        radiation   = max(0, 500 * math.sin(math.pi * (t % 1440) / 1440) + random.gauss(0, 20))
        wind_speed  = abs(3 + 2 * math.sin(t / 30) + random.gauss(0, 0.5))
        humidity    = 60 + 15 * math.sin(t / 120) + random.gauss(0, 2)
        temperature = 20 + 8  * math.sin(math.pi * (t % 1440) / 1440) + random.gauss(0, 0.5)
        return {
            "radiation":   round(max(0, radiation), 1),
            "wind_speed":  round(wind_speed, 2),
            "humidity":    round(humidity, 1),
            "temperature": round(temperature, 2),
        }

    async def _backfill_history(self, hours: int = 48):
        """
        Au démarrage, vérifie si la DB a suffisamment d'historique.
        Si non, génère des données simulées rétrospectives pour remplir les graphiques.
        - Données internes : 1 point / minute → max 2 880 points sur 48h
        - Données externes : 1 point / 15 min → max 192 points sur 48h
        """
        now = datetime.utcnow()
        since = now - timedelta(hours=hours)

        async with AsyncSessionLocal() as session:
            # ── Compter les entrées existantes ─────────────────────────────
            r_int = await session.execute(
                select(func.count()).select_from(InternalData)
                .where(InternalData.timestamp >= since)
            )
            r_ext = await session.execute(
                select(func.count()).select_from(ExternalData)
                .where(ExternalData.timestamp >= since)
            )
            count_int = r_int.scalar() or 0
            count_ext = r_ext.scalar() or 0

        # Nombre de points attendus sur la période (sous-échantillonné pour la perf)
        expected_int = hours * 60       # 1/min
        expected_ext = hours * 4        # 1/15min

        need_int = count_int < expected_int * 0.5   # moins de 50% → backfill
        need_ext = count_ext < expected_ext * 0.5

        if not need_int and not need_ext:
            print(f"[Simulator] Historique OK — {count_int} internes, {count_ext} externes")
            return

        print(f"[Simulator] Backfill en cours — {count_int}/{expected_int} internes, {count_ext}/{expected_ext} externes")

        internal_batch = []
        external_batch = []

        total_minutes = hours * 60
        for minutes_ago in range(total_minutes, 0, -1):
            ts = now - timedelta(minutes=minutes_ago)
            t  = total_minutes - minutes_ago  # index temporel croissant

            if need_int:
                vals = self._generate_internal_at(t)
                internal_batch.append(InternalData(timestamp=ts, **vals))

            if need_ext and minutes_ago % 15 == 0:
                vals = self._generate_external_at(t)
                external_batch.append(ExternalData(timestamp=ts, **vals))

            # Commit par lots de 500 pour éviter les timeouts
            if len(internal_batch) >= 500 or len(external_batch) >= 100:
                async with AsyncSessionLocal() as session:
                    session.add_all(internal_batch)
                    session.add_all(external_batch)
                    await session.commit()
                internal_batch = []
                external_batch = []

        # Dernier lot
        if internal_batch or external_batch:
            async with AsyncSessionLocal() as session:
                session.add_all(internal_batch)
                session.add_all(external_batch)
                await session.commit()

        print(f"[Simulator] Backfill terminé")

    async def run(self):
        await asyncio.sleep(5)
        await self._backfill_history(hours=48)
        while True:
            try:
                self.time_step += 1
                internal_vals = self._generate_internal()
                external_vals = self._generate_external()

                async with AsyncSessionLocal() as session:
                    # Données internes — enregistrées toutes les 1 minute
                    session.add(InternalData(**internal_vals))

                    # Données externes — enregistrées toutes les 15 minutes
                    if self.time_step % 15 == 0:
                        session.add(ExternalData(**external_vals))

                    if self.time_step % 10 == 0:
                        await self._check_alerts(session, internal_vals)

                    await session.commit()

                # ── Diffusion WebSocket — fréquences strictement respectées ──
                await broadcast_internal_data(internal_vals)       # toutes les 1 minute
                if self.time_step % 15 == 0:
                    await broadcast_external_data(external_vals)   # toutes les 15 minutes

                await asyncio.sleep(60)

            except Exception as e:
                print(f"Simulator error: {e}")
                await asyncio.sleep(10)
