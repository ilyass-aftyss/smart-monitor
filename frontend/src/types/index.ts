export interface InternalData {
  id: number
  timestamp: string
  temperature: number
  co2: number
  humidity: number
  voc: number
  vpd: number
  pressure: number
  dew_point: number
}

export interface ExternalData {
  id: number
  timestamp: string
  radiation: number
  wind_speed: number
  humidity: number
  temperature: number
}

export interface Device {
  id: string
  name: string
  device_type: string
  location: string
  status: 'ON' | 'OFF' | 'Erreur'
  last_update: string
}

export interface Alert {
  id: number
  timestamp: string
  alert_type: string
  severity: 'warning' | 'critical' | 'info'
  message: string
  value: number
  threshold: number
  acknowledged: boolean
  acknowledged_at: string | null
  acknowledged_by: string | null
}

export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
  is_active: boolean
}

export interface AuthToken {
  access_token: string
  token_type: string
  role: string
  username: string
}

export interface SensorStats {
  temperature: { avg: number; min: number; max: number }
  co2: { avg: number; max: number }
  humidity: { avg: number }
  count: number
}

export type DeviceStatus = 'ON' | 'OFF' | 'Erreur'
