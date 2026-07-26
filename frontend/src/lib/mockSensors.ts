import type { InternalData, ExternalData } from '../types'

export const mockInternal: InternalData = {
  id: 0,
  timestamp: new Date().toISOString(),
  temperature: 44.6,
  humidity: 18.5,
  co2: 398,
  voc: 120,
  vpd: 2.1,
  pressure: 1009.3,
  dew_point: 15.3,
  illuminance: 542,
  partial_vapor_pressure: 17.37,
  source: 'simulation',
}

export const mockExternal: ExternalData = {
  id: 0,
  timestamp: new Date().toISOString(),
  temperature: 32.0,
  humidity: 54.42,
  radiation: 515.0,
  wind_speed: 0.3,
  rain: 0.2,
  wind_cardinal: 'N',
  rssi: -83,
  battery_v: 3.423,
  device_name: 'station-météo',
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
