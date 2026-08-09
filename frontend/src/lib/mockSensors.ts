/**
 * Données de secours affichées quand le backend est inaccessible.
 * Les valeurs reflètent les mesures réelles de la station (HD50 + météo)
 * afin que le fallback reste cohérent avec les données attendues.
 */
import type { InternalData, ExternalData } from '../types'

export const mockInternal: InternalData = {
  id: 0,
  timestamp: new Date().toISOString(),
  temperature: 43.3,
  humidity: 24.7,
  co2: 402,
  voc: undefined as any,
  vpd: undefined as any,
  pressure: 1012.5,
  dew_point: 18.9,
  illuminance: 427,
  partial_vapor_pressure: 21.78,
  source: 'simulation',
}

export const mockExternal: ExternalData = {
  id: 0,
  timestamp: new Date().toISOString(),
  temperature: 26.68,
  humidity: 66.45,
  radiation: 1022.0,
  wind_speed: 15.7,
  rain: 0.0,
  wind_cardinal: 'ESE',
  rssi: -81,
  battery_v: 3.418,
  device_name: 'station - météo',
  solar_device_name: 'Capteur de rayon solaire',
  source: 'simulation',
}

export function makeHistory(base: number, spread: number, points = 24) {
  const now = Date.now()
  return Array.from({ length: points }, (_, i) => {
    const t = new Date(now - (points - 1 - i) * 3600_000)
    const noise = (Math.sin(i * 0.7) + Math.cos(i * 0.3)) * spread * 0.5
    return {
      time: t.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      value: +(base + noise + (Math.random() - 0.5) * spread * 0.4).toFixed(2),
    }
  })
}
