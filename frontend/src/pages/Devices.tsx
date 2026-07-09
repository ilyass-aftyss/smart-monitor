import { useEffect, useState } from 'react'
import { Box, Typography, Grid, Paper, Skeleton, Chip, Button } from '@mui/material'
import { motion } from 'framer-motion'
import { devicesApi } from '../services/api'
import { useThemeMode } from '../context/ThemeContext'
import type { DeviceStatus } from '../types'

const STATUS_CONFIG: Record<DeviceStatus, { color: string; label: string }> = {
  ON:     { color: '#10b981', label: 'EN MARCHE' },
  OFF:    { color: '#64748b', label: 'ARRÊTÉ'    },
  Erreur: { color: '#e8334a', label: 'ERREUR'    },
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
  // Sud Haut (côté sud, en haut de la serre)
  { id: 'w-sh-g', label: 'Fenêtre Sud Haut Gauche',    position: 'sud-haut', align: 'gauche',  opening: 0, status: 'OFF', lastUpdate: new Date().toISOString() },
  { id: 'w-sh-c', label: 'Fenêtre Sud Haut Centre',    position: 'sud-haut', align: 'centre',  opening: 0, status: 'OFF', lastUpdate: new Date().toISOString() },
  { id: 'w-sh-d', label: 'Fenêtre Sud Haut Droite',    position: 'sud-haut', align: 'droite',  opening: 0, status: 'OFF', lastUpdate: new Date().toISOString() },
  // Nord Bas (côté nord, en bas de la serre)
  { id: 'w-nb-g', label: 'Fenêtre Nord Bas Gauche',    position: 'nord-bas', align: 'gauche',  opening: 0, status: 'OFF', lastUpdate: new Date().toISOString() },
  { id: 'w-nb-c', label: 'Fenêtre Nord Bas Centre',    position: 'nord-bas', align: 'centre',  opening: 0, status: 'OFF', lastUpdate: new Date().toISOString() },
  { id: 'w-nb-d', label: 'Fenêtre Nord Bas Droite',    position: 'nord-bas', align: 'droite',  opening: 0, status: 'OFF', lastUpdate: new Date().toISOString() },
]

function WindowGraphic({ opening, dark }: { opening: 0 | 50 | 100; dark: boolean }) {
  const isOpen = opening > 0
  const isHalf = opening === 50
  const glassOpacity = opening === 0 ? 0.15 : opening === 50 ? 0.35 : 0.6
  const glassColor = dark ? `rgba(0,170,255,${glassOpacity})` : `rgba(0,112,212,${glassOpacity})`
  const frameColor = dark ? 'rgba(0,170,255,0.6)' : 'rgba(0,112,212,0.6)'
  const handleColor = dark ? '#00aaff' : '#0070d4'

  // Sash left position: closed=4px (aligned with glass), half=35%, open=calc(70% - 4px)
  // Glass panel is inset: 4px from parent edges. Sash width = 30% of parent.
  // Fully open: right edge of sash at right edge of glass => left = 100% - 4px - 30% = calc(70% - 4px)
  const sashLeft = opening === 0 ? '4px' : opening === 50 ? '35%' : 'calc(70% - 4px)'

  return (
    <Box
      sx={{
        width: '100%', height: 140, position: 'relative',
        border: `2px solid ${frameColor}`, borderRadius: 8,
        background: dark ? 'rgba(10,25,50,0.8)' : 'rgba(240,244,248,0.9)',
        overflow: 'hidden', transition: 'all 0.3s ease',
      }}
    >
      {/* Glass panel */}
      <Box
        sx={{
          position: 'absolute', inset: 4,
          background: glassColor,
          borderRadius: 4,
          border: `1px solid ${frameColor}40`,
          backdropFilter: 'blur(2px)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Reflection line */}
        <Box
          sx={{
            position: 'absolute', top: '20%', left: '10%', right: '10%', height: '2px',
            background: `linear-gradient(90deg, transparent, ${dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'}, transparent)`,
            borderRadius: 1,
          }}
        />
      </Box>

      {/* Frame cross bars */}
      <Box
        sx={{
          position: 'absolute', top: '50%', left: 4, right: 4, height: '2px',
          background: frameColor, transform: 'translateY(-50%)',
        }}
      />
      <Box
        sx={{
          position: 'absolute', left: '50%', top: 4, bottom: 4, width: '2px',
          background: frameColor, transform: 'translateX(-50%)',
        }}
      />

      {/* Opening sash - using left position for exact placement */}
      <Box
        style={{
          position: 'absolute', top: 4, bottom: 4, width: '30%',
          left: sashLeft,
          background: glassColor,
          border: `1px solid ${frameColor}40`,
          borderRadius: 3,
          zIndex: 2,
          backdropFilter: 'blur(2px)',
          transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Handle on the sliding sash */}
        <Box
          sx={{
            position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
            width: 8, height: 24, borderRadius: 4,
            background: `linear-gradient(180deg, ${handleColor}, ${handleColor}80)`,
            boxShadow: `0 0 8px ${handleColor}66`,
          }}
        />
      </Box>

      {/* Opening percentage badge */}
      <Box
        sx={{
          position: 'absolute', bottom: 6, right: 6,
          px: 1.2, py: 0.3, borderRadius: 4, fontSize: '0.62rem',
          fontFamily: '"JetBrains Mono", monospace', fontWeight: 700,
          background: isOpen ? `${handleColor}20` : 'transparent',
          color: isOpen ? handleColor : (dark ? '#8aaccc' : '#5a7090'),
          border: `1px solid ${isOpen ? handleColor : 'transparent'}`,
        }}
      >
        {opening}%
      </Box>
    </Box>
  )
}

function WindowCard({ window: win, onOpeningChange }: { window: WindowData; onOpeningChange: (id: string, opening: 0 | 50 | 100) => void }) {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const textPri = dark ? '#e2ecf8' : '#1a2540'
  const textSec = dark ? '#8aaccc' : '#5a7090'
  const positionColor = win.position === 'sud-haut' ? '#f97316' : '#06b6d4'
  const positionLabel = win.position === 'sud-haut' ? 'SUD - HAUT' : 'NORD - BAS'
  const alignLabel = win.align.charAt(0).toUpperCase() + win.align.slice(1)

  const cfg = STATUS_CONFIG[win.status]
  const isErr = win.status === 'Erreur'

  const handleOpeningClick = (newOpening: 0 | 50 | 100) => {
    onOpeningChange(win.id, newOpening)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      layout
    >
      <Paper
        sx={{
          p: 2, textAlign: 'center',
          border: `1px solid ${positionColor}22`,
          position: 'relative', overflow: 'hidden',
          transition: 'box-shadow 0.3s',
          '&:hover': { boxShadow: `0 8px 30px ${positionColor}18` },
          '&::before': {
            content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: `linear-gradient(90deg, transparent, ${positionColor}, transparent)`,
          },
        }}
      >
        {/* Position badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1.5 }}>
          <Chip
            label={positionLabel}
            size="small"
            sx={{
              fontSize: '0.6rem', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace',
              bgcolor: `${positionColor}12`, color: positionColor,
              border: `1px solid ${positionColor}40`, height: 22,
            }}
          />
        </Box>

        {/* Window graphic */}
        <WindowGraphic opening={win.opening} dark={dark} />

        {/* Window name */}
        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: textPri, mb: 0.3 }}>
          {win.label}
        </Typography>
        <Typography sx={{ fontSize: '0.62rem', color: textSec, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5, fontFamily: '"JetBrains Mono", monospace' }}>
          {alignLabel}
        </Typography>

        {/* Opening controls */}
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
                background: win.opening === val ? `linear-gradient(135deg, ${positionColor}, ${positionColor}dd)` : undefined,
                color: win.opening === val ? '#fff' : positionColor,
                borderColor: win.opening === val ? 'transparent' : `${positionColor}40`,
                '&:hover': {
                  borderColor: win.opening === val ? 'transparent' : positionColor,
                  background: win.opening === val ? `linear-gradient(135deg, ${positionColor}, ${positionColor}cc)` : `${positionColor}08`,
                },
                minWidth: 50,
              }}
            >
              {val}%
            </Button>
          ))}
        </Box>

        {/* Status / Error */}
        {isErr && (
          <Box sx={{
            display: 'inline-flex', px: 1.2, py: 0.4, borderRadius: '6px', mb: 1.5,
            bgcolor: `${cfg.color}12`, color: cfg.color,
            border: `1px solid ${cfg.color}40`,
            fontFamily: '"JetBrains Mono", monospace', fontSize: '0.65rem',
          }}>
            ERREUR
          </Box>
        )}

        {/* Status indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
          <Box sx={{
            width: 8, height: 8, borderRadius: '50%',
            bgcolor: win.opening > 0 ? '#10b981' : '#64748b',
            boxShadow: win.opening > 0 ? '0 0 8px #10b98188' : 'none',
            animation: win.opening > 0 ? 'pulse 2s ease-in-out infinite' : 'none',
            '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
          }} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace',
            color: win.opening > 0 ? '#10b981' : textSec }}>
            {win.opening > 0 ? 'OUVERT' : 'FERMÉ'}
          </Typography>
        </Box>

        {/* Last update */}
        <Typography sx={{ color: textSec, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.6rem', display: 'block' }}>
          MAJ: {new Date(win.lastUpdate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Paper>
    </motion.div>
  )
}

export default function DevicesPage() {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const textSec = dark ? '#8aaccc' : '#5a7090'
  const [windows, setWindows] = useState<WindowData[]>(WINDOWS)
  const [loading, setLoading] = useState(true)

  // Fetch real device data and sync with windows
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await devicesApi.list()
        const devices = res.data
        // Map devices to windows (first 6 devices)
        setWindows(prev => prev.map((w, i) => {
          const dev = devices[i]
          if (!dev) return w
          const status: DeviceStatus = dev.status in STATUS_CONFIG ? dev.status as DeviceStatus : 'OFF'
          // Derive opening from status: ON -> 100%, OFF -> 0% (or keep current if half)
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
    // Send to API
    const win = windows.find(w => w.id === id)
    if (win) {
      // Extract numeric device ID from window id (e.g., 'w-sh-g' -> 1, 'w-sh-c' -> 2, etc.)
      const deviceId = WINDOWS.findIndex(w => w.id === id) + 1
      devicesApi.updateStatus(String(deviceId), opening > 0 ? 'ON' : 'OFF').catch(() => {})
    }
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
            bgcolor: '#f9731610', color: '#f97316',
            border: `1px solid #f9731630`, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.67rem',
          }}>
            Ouvert 100%: {fullyOpen}
          </Box>
          <Box sx={{
            px: 1.2, py: 0.4, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: 0.5,
            bgcolor: '#f59e0b10', color: '#f59e0b',
            border: `1px solid #f59e0b30`, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.67rem',
          }}>
            Ouvert 50%: {halfOpen}
          </Box>
          <Box sx={{
            px: 1.2, py: 0.4, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: 0.5,
            bgcolor: '#64748b10', color: '#64748b',
            border: `1px solid #64748b30`, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.67rem',
          }}>
            Fermé: {closed}
          </Box>
        </Box>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={300} sx={{ bgcolor: dark ? 'rgba(0,170,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {/* Sud Haut Section */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: '#f97316', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f97316' }} />
            Sud - Haut (Côté Sud)
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {windows.filter(w => w.position === 'sud-haut').map((win, idx) => (
              <Grid item xs={12} sm={6} md={4} key={win.id}>
                <WindowCard window={win} onOpeningChange={handleOpeningChange} />
              </Grid>
            ))}
          </Grid>

          {/* Nord Bas Section */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: '#06b6d4', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#06b6d4' }} />
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