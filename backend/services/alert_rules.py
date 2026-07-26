"""
Règles d'alerte agronomiques du fraisier — partagées entre le simulateur
et le client de télémétrie réelle (station HD50).
"""

from models.models import Alert

THRESHOLDS = {
    "temperature": {"warn_high": 23, "crit_high": 30, "warn_low": 18, "crit_low": 10},
    "humidity":    {"warn_high": 75, "crit_high": 85, "warn_low": 70, "crit_low": 60},
    "co2":         {"warn_high": 1000, "crit_high": 1200, "warn_low": 800},
}


def check_internal_alerts(d: dict) -> list[Alert]:
    """Évalue les seuils agronomiques sur une mesure de climat intérieur et retourne les alertes à créer."""
    thr = THRESHOLDS
    alerts = []
    temp = d.get("temperature")
    hum = d.get("humidity")
    co2 = d.get("co2")

    if temp is not None:
        if temp >= thr["temperature"]["crit_high"]:
            alerts.append(Alert(alert_type="temperature", severity="critical",
                message=f"Température critique: {temp}°C (seuil > {thr['temperature']['crit_high']}°C)",
                value=temp, threshold=thr["temperature"]["crit_high"]))
        elif temp > thr["temperature"]["warn_high"]:
            alerts.append(Alert(alert_type="temperature_high", severity="warning",
                message=f"Température trop élevée: {temp}°C (optimal 18–23 °C)",
                value=temp, threshold=thr["temperature"]["warn_high"]))
        elif temp <= thr["temperature"]["crit_low"]:
            alerts.append(Alert(alert_type="temperature_low", severity="critical",
                message=f"Température trop basse: {temp}°C (min nocturne {thr['temperature']['crit_low']}°C)",
                value=temp, threshold=thr["temperature"]["crit_low"]))
        elif temp < thr["temperature"]["warn_low"]:
            alerts.append(Alert(alert_type="temperature_low", severity="warning",
                message=f"Température en-dessous de l'optimal: {temp}°C (optimal ≥ 18 °C)",
                value=temp, threshold=thr["temperature"]["warn_low"]))

    if hum is not None:
        if hum >= thr["humidity"]["crit_high"]:
            alerts.append(Alert(alert_type="humidity_high", severity="critical",
                message=f"Humidité critique: {hum}% (risque de maladies fongiques)",
                value=hum, threshold=thr["humidity"]["crit_high"]))
        elif hum > thr["humidity"]["warn_high"]:
            alerts.append(Alert(alert_type="humidity_high", severity="warning",
                message=f"Humidité trop élevée: {hum}% (optimal 70–75 %)",
                value=hum, threshold=thr["humidity"]["warn_high"]))
        elif hum <= thr["humidity"]["crit_low"]:
            alerts.append(Alert(alert_type="humidity_low", severity="critical",
                message=f"Humidité trop basse: {hum}% (risque de stress hydrique)",
                value=hum, threshold=thr["humidity"]["crit_low"]))
        elif hum < thr["humidity"]["warn_low"]:
            alerts.append(Alert(alert_type="humidity_low", severity="warning",
                message=f"Humidité en-dessous de l'optimal: {hum}% (optimal ≥ 70 %)",
                value=hum, threshold=thr["humidity"]["warn_low"]))

    if co2 is not None:
        if co2 >= thr["co2"]["crit_high"]:
            alerts.append(Alert(alert_type="co2", severity="critical",
                message=f"CO₂ niveau critique: {co2} ppm (seuil > {thr['co2']['crit_high']} ppm)",
                value=co2, threshold=thr["co2"]["crit_high"]))
        elif co2 > thr["co2"]["warn_high"]:
            alerts.append(Alert(alert_type="co2_high", severity="warning",
                message=f"CO₂ au-dessus de l'optimal: {co2} ppm (optimal 800–1000 ppm)",
                value=co2, threshold=thr["co2"]["warn_high"]))
        elif co2 < thr["co2"]["warn_low"]:
            alerts.append(Alert(alert_type="co2_low", severity="warning",
                message=f"CO₂ en-dessous de l'optimal: {co2} ppm (optimal ≥ 800 ppm)",
                value=co2, threshold=thr["co2"]["warn_low"]))

    return alerts
