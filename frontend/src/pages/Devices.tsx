import { useEffect, useState } from 'react'
import { Box, Typography, Grid, Paper, Skeleton, Button } from '@mui/material'
import { motion } from 'framer-motion'
import { devicesApi } from '../services/api'
import { useThemeMode } from '../context/ThemeContext'
import type { DeviceStatus } from '../types'

const STATUS_CONFIG: Record<DeviceStatus, { color: string; label: string }> = {
  ON:     { color: '#0D98BA', label: 'EN MARCHE' },
  OFF:    { color: '#6B7280', label: 'ARRÊTÉ'    },
  Erreur: { color: '#EF4444', label: 'ERREUR'    },
}

type WindowPosition = 'sud-haut' | 'nord-bas'
type WindowAlign = 'gauche' | 'centre' | 'droite'

interface WindowData {
  id: string
  label: string
  position: WindowPosition
  align: WindowAlign
  opening: 0 | 50 | 100
  status: DeviceStatus
  lastUpdate: string
}

const WINDOWS: WindowData[] = [
  { id: 'w-sh-g', label: 'Fenêtre Sud Haut Gauche',    position: 'sud-haut', align: 'gauche',  opening: 0, status: 'OFF', lastUpdate: new Date().toISOString() },
  { id: 'w-sh-c', label: 'Fenêtre Sud Haut Centre',    position: 'sud-haut', align: 'centre',  opening: 0, status: 'OFF', lastUpdate: new Date().toISOString() },
  { id: 'w-sh-d', label: 'Fenêtre Sud Haut Droite',    position: 'sud-haut', align: 'droite',  opening: 0, status: 'OFF', lastUpdate: new Date().toISOString() },
  { id: 'w-nb-g', label: 'Fenêtre Nord Bas Gauche',    position: 'nord-bas', align: 'gauche',  opening: 0, status: 'OFF', lastUpdate: new Date().toISOString() },
  { id: 'w-nb-c', label: 'Fenêtre Nord Bas Centre',    position: 'nord-bas', align: 'centre',  opening: 0, status: 'OFF', lastUpdate: new Date().toISOString() },
  { id: 'w-nb-d', label: 'Fenêtre Nord Bas Droite',    position: 'nord-bas', align: 'droite',  opening: 0, status: 'OFF', lastUpdate: new Date().toISOString() },
]

function WindowGraphic({ opening, dark }: { opening: 0 | 50 | 100; dark: boolean }) {
  const isOpen = opening > 0
  const glassOpacity = opening === 0 ? 0.15 : opening === 50 ? 0.35 : 0.6
  const glassColor = `rgba(13,152,186,${glassOpacity})`
  const frameColor = 'rgba(13,152,186,0.6)'
  const handleColor = '#0D98BA'
  const sashLeft = opening === 0 ? '4px' : opening === 50 ? '35%' : 'calc(70% - 4px)'

  return (
    <Box sx={{
      width: '100%', height: 120, position: 'relative',
      border: `2px solid ${frameColor}`, borderRadius: 8,
      background: dark ? '#091E24' : '#C4F9FF',
      overflow: 'hidden', transition: 'all 0.3s ease',
    }}>
      <Box sx={{
        position: 'absolute', inset: 4,
        background: glassColor, borderRadius: 4,
        border: `1px solid ${frameColor}40`,
        transition: 'all 0.4s ease',
      }} />

      <Box sx={{
        position: 'absolute', top: '50%', left: 4, right: 4, height: '2px',
        background: frameColor, transform: 'translateY(-50%)',
      }} />
      <Box sx={{
        position: 'absolute', left: '50%', top: 4, bottom: 4, width: '2px',
        background: frameColor, transform: 'translateX(-50%)',
      }} />

      <Box style={{
        position: 'absolute', top: 4, bottom: 4, width: '30%',
        left: sashLeft,
        background: glassColor,
        border: `1px solid ${frameColor}40`,
        borderRadius: 3, zIndex: 2,
        transition: 'left 0.4s ease',
      }}>
        <Box sx={{
          position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
          width: 8, height: 24, borderRadius: 4,
          background: handleColor, opacity: 0.7,
        }} />
      </Box>

      <Box sx={{
        position: 'absolute', bottom: 6, right: 6,
        px: 1.2, py: 0.3, borderRadius: 4, fontSize: '0.62rem',
        fontFamily: '"JetBrains Mono", monospace', fontWeight: 700,
        background: isOpen ? 'rgba(13,152,186,0.12)' : 'transparent',
        color: isOpen ? handleColor : '#6B7280',
        border: `1px solid ${isOpen ? handleColor : 'transparent'}`,
      }}>
        {opening}%
      </Box>
    </Box>
  )
}

function WindowCard({ window: win, onOpeningChange }: { window: WindowData; onOpeningChange: (id: string, opening: 0 | 50 | 100) => void }) {
  const { mode } = useThemeMode()
  const dark = false
  const textPri = dark ? '#C4F9FF' : '#0D3040'
  const textSec = '#6B7280'
  const positionColor = win.position === 'sud-haut' ? '#0D98BA' : '#097782'
  const positionLabel = win.position === 'sud-haut' ? 'SUD - HAUT' : 'NORD - BAS'

  const handleOpeningClick = (newOpening: 0 | 50 | 100) => {
    onOpeningChange(win.id, newOpening)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1.5 }}>
          <Box sx={{
            px: 0.8, py: 0.3, borderRadius: '6px',
            bgcolor: `${positionColor}12`,
            color: positionColor,
            fontSize: '0.6rem', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace',
          }}>
            {positionLabel}
          </Box>
        </Box>

        <WindowGraphic opening={win.opening} dark={dark} />

        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: textPri, mt: 1.5, mb: 0.3 }}>
          {win.label}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
          {([0, 50, 100] as const).map((val) => (
            <Button
              key={val}
              size="small"
              variant={win.opening === val ? 'contained' : 'outlined'}
              onClick={() => handleOpeningClick(val as 0 | 50 | 100)}
              sx={{
                px: 1, py: 0.3, fontSize: '0.62rem', fontWeight: 700,
                fontFamily: '"JetBrains Mono", monospace', textTransform: 'none',
                borderRadius: 6,
                background: win.opening === val ? '#0D98BA' : undefined,
                color: win.opening === val ? '#fff' : '#0D98BA',
                borderColor: win.opening === val ? 'transparent' : 'rgba(13,152,186,0.4)',
                '&:hover': {
                  borderColor: win.opening === val ? 'transparent' : '#0D98BA',
                  background: win.opening === val ? '#097782' : 'rgba(13,152,186,0.08)',
                },
                minWidth: 50,
              }}
            >
              {val}%
            </Button>
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
          <Box sx={{
            width: 8, height: 8, borderRadius: '50%',
            bgcolor: win.opening > 0 ? '#0D98BA' : '#6B7280',
          }} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace',
            color: win.opening > 0 ? '#0D98BA' : textSec }}>
            {win.opening > 0 ? 'OUVERT' : 'FERMÉ'}
          </Typography>
        </Box>

        <Typography sx={{ color: textSec, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.6rem', display: 'block' }}>
          MAJ: {new Date(win.lastUpdate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </div>
    </motion.div>
  )
}

export default function DevicesPage() {
  const { mode } = useThemeMode()
  const dark = false
  const textSec = '#6B7280'
  const [windows, setWindows] = useState<WindowData[]>(WINDOWS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await devicesApi.list()
        const devices = res.data
        setWindows(prev => prev.map((w, i) => {
          const dev = devices[i]
          if (!dev) return w
          const status: DeviceStatus = dev.status in STATUS_CONFIG ? dev.status as DeviceStatus : 'OFF'
          let opening = w.opening
          if (status === 'ON' && opening === 0) opening = 100
          if (status === 'OFF' && opening > 0) opening = 0
          return { ...w, status, opening, lastUpdate: dev.last_update }
        }))
      } catch {}
      setLoading(false)
    }
    fetch()
    const t = setInterval(fetch, 30000)
    return () => clearInterval(t)
  }, [])

  const handleOpeningChange = (id: string, opening: 0 | 50 | 100) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, opening, status: opening > 0 ? 'ON' : 'OFF', lastUpdate: new Date().toISOString() } : w))
    const deviceId = WINDOWS.findIndex(w => w.id === id) + 1
    devicesApi.updateStatus(String(deviceId), opening > 0 ? 'ON' : 'OFF').catch(() => {})
  }

  const counts = {
    ON: windows.filter(w => w.status === 'ON').length,
    OFF: windows.filter(w => w.status === 'OFF').length,
    Erreur: windows.filter(w => w.status === 'Erreur').length,
  }

  const fullyOpen = windows.filter(w => w.opening === 100).length
  const halfOpen = windows.filter(w => w.opening === 50).length
  const closed = windows.filter(w => w.opening === 0).length

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>État des Actionneurs</Typography>
        <Typography variant="body2" sx={{ color: textSec, mt: 0.3 }}>
          Contrôle et supervision · mise à jour automatique toutes les 30 s
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
          {(Object.entries(counts) as [DeviceStatus, number][]).map(([k, v]) => (
            <Box key={k} sx={{
              px: 1.2, py: 0.4, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: 0.5,
              bgcolor: `${STATUS_CONFIG[k].color}10`, color: STATUS_CONFIG[k].color,
              border: `1px solid ${STATUS_CONFIG[k].color}30`, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.67rem',
            }}>
              {STATUS_CONFIG[k].label}: {v}
            </Box>
          ))}
          <Box sx={{
            px: 1.2, py: 0.4, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: 0.5,
            bgcolor: 'rgba(13,152,186,0.1)', color: '#0D98BA',
            border: '1px solid rgba(13,152,186,0.3)', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.67rem',
          }}>
            Ouvert 100%: {fullyOpen}
          </Box>
          <Box sx={{
            px: 1.2, py: 0.4, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: 0.5,
            bgcolor: 'rgba(245,158,11,0.1)', color: '#F59E0B',
            border: '1px solid rgba(245,158,11,0.3)', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.67rem',
          }}>
            Ouvert 50%: {halfOpen}
          </Box>
          <Box sx={{
            px: 1.2, py: 0.4, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: 0.5,
            bgcolor: 'rgba(107,114,128,0.1)', color: '#6B7280',
            border: '1px solid rgba(107,114,128,0.3)', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.67rem',
          }}>
            Fermé: {closed}
          </Box>
        </Box>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={300} sx={{ bgcolor: dark ? 'rgba(13,152,186,0.04)' : 'rgba(0,0,0,0.04)' }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: '#0D98BA', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#0D98BA' }} />
            Sud - Haut (Côté Sud)
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {windows.filter(w => w.position === 'sud-haut').map((win) => (
              <Grid item xs={12} sm={6} md={4} key={win.id}>
                <WindowCard window={win} onOpeningChange={handleOpeningChange} />
              </Grid>
            ))}
          </Grid>

          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: '#097782', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#097782' }} />
            Nord - Bas (Côté Nord)
          </Typography>
          <Grid container spacing={2}>
            {windows.filter(w => w.position === 'nord-bas').map((win) => (
              <Grid item xs={12} sm={6} md={4} key={win.id}>
                <WindowCard window={win} onOpeningChange={handleOpeningChange} />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  )
}
