import { useState, useEffect, useRef, useCallback } from 'react'
import { internalApi, externalApi, WS_URL } from '../services/api'
import type { InternalData, ExternalData } from '../types'

export function useLatestSensorData(refreshInterval = 60000) {
  const [internal, setInternal] = useState<InternalData | null>(null)
  const [external, setExternal] = useState<ExternalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [inRes, exRes] = await Promise.all([
        internalApi.latest(),
        externalApi.latest(),
      ])
      setInternal(inRes.data)
      setExternal(exRes.data)
      setLastUpdate(new Date())
    } catch (e) {
      console.error('Fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchData, refreshInterval])

  useEffect(() => {
    let ws: WebSocket
    const connect = () => {
      try {
        ws = new WebSocket(WS_URL)
        ws.onmessage = (evt) => {
          const msg = JSON.parse(evt.data)
          if (msg.type === 'internal_update') {
            // Données internes — fréquence 1 minute
            setInternal((prev) => prev ? { ...prev, ...msg.data, timestamp: msg.timestamp } : null)
            setLastUpdate(new Date())
          } else if (msg.type === 'external_update') {
            // Données externes — fréquence 15 minutes
            setExternal((prev) => prev ? { ...prev, ...msg.data, timestamp: msg.timestamp } : null)
          }
        }
        ws.onerror = () => setTimeout(connect, 5000)
      } catch {}
    }
    connect()
    return () => ws?.close()
  }, [])

  return { internal, external, loading, lastUpdate, refetch: fetchData }
}
