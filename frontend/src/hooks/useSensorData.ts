import { useState, useEffect, useRef, useCallback } from 'react'
import { internalApi, externalApi, WS_URL } from '../services/api'
import type { InternalData, ExternalData } from '../types'

export function useLatestSensorData(refreshInterval = 30000) {
  const [internal, setInternal] = useState<InternalData | null>(null)
  const [external, setExternal] = useState<ExternalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

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
      console.error('Fetch sensor data error:', e)
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
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return
      try {
        const ws = new WebSocket(WS_URL)
        wsRef.current = ws

        ws.onopen = () => {
          if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
        }

        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data)
            if (msg.type === 'internal_update' && msg.data) {
              setInternal((prev) => {
                const base = prev ?? { id: 0, timestamp: msg.timestamp }
                return { ...base, ...msg.data, timestamp: msg.timestamp } as InternalData
              })
              setLastUpdate(new Date())
            } else if (msg.type === 'external_update' && msg.data) {
              setExternal((prev) => {
                const base = prev ?? { id: 0, timestamp: msg.timestamp }
                return { ...base, ...msg.data, timestamp: msg.timestamp } as ExternalData
              })
            }
          } catch {}
        }

        ws.onerror = () => {}
        ws.onclose = () => {
          reconnectTimer = setTimeout(connect, 5000)
        }
      } catch {
        reconnectTimer = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [])

  return { internal, external, loading, lastUpdate, refetch: fetchData }
}
