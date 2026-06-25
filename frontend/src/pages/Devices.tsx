import { useEffect, useState } from 'react'
import { Box, Typography, Grid, Paper, Skeleton } from '@mui/material'
import { motion } from 'framer-motion'
import { devicesApi } from '../services/api'
import { useThemeMode } from '../context/ThemeContext'
import type { Device, DeviceStatus } from '../types'
import ToggleSwitch from '../components/common/toggle-switch'

const STATUS_CONFIG: Record<DeviceStatus, { color: string; label: string }> = {
  ON:     { color: '#10b981', label: 'EN MARCHE' },
  OFF:    { color: '#64748b', label: 'ARRÊTÉ'    },
  Erreur: { color: '#e8334a', label: 'ERREUR'    },
}

function FanAnimation({ status }: { status: DeviceStatus }) {
  const cfg   = STATUS_CONFIG[status]
  const isOn  = status === 'ON'
  const isErr = status === 'Erreur'

  return (
    <Box sx={{ position: 'relative', width: 76, height: 76, mx: 'auto', mb: 2 }}>
      <Box sx={{
        width: '100%', height: '100%', borderRadius: '50%',
        border: `2px solid ${cfg.color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${cfg.color}0e`,
        boxShadow: isOn ? `0 0 22px ${cfg.color}44` : 'none',
        animation: isErr ? 'errBlink 0.7s ease-in-out infinite' : 'none',
        '@keyframes errBlink': {
          '0%,100%': { boxShadow: '0 0 8px rgba(232,51,74,0.4)',  borderColor: 'rgba(232,51,74,0.4)' },
          '50%':     { boxShadow: '0 0 22px rgba(232,51,74,0.9)', borderColor: 'rgba(232,51,74,0.9)' },
        },
      }}>
        <Box sx={{
          fontSize: '2rem',
          animation: isOn    ? 'spinFan 1.5s linear infinite'
                    : isErr  ? 'spinFan 0.3s linear infinite'
                    : 'none',
          '@keyframes spinFan': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        }}>
          🌀
        </Box>
      </Box>
      {isOn && (
        <Box sx={{
          position: 'absolute', inset: -6, borderRadius: '50%',
          border: `1px solid ${cfg.color}30`,
          animation: 'pulseRing 2s ease-in-out infinite',
          '@keyframes pulseRing': { '0%,100%': { opacity: 0.3, transform: 'scale(1)' }, '50%': { opacity: 0.8, transform: 'scale(1.03)' } },
        }} />
      )}
    </Box>
  )
}

function DeviceCard({ device }: { device: Device }) {
  const { mode } = useThemeMode()
  const dark   = mode === 'dark'
  const textPri = dark ? '#e2ecf8' : '#1a2540'
  const textSec = dark ? '#8aaccc' : '#5a7090'

  const status: DeviceStatus = (device.status as DeviceStatus) in STATUS_CONFIG ? (device.status as DeviceStatus) : 'OFF'
  const cfg = STATUS_CONFIG[status]
  const isOn = status === 'ON'

  const handleToggle = (value: boolean) => {
    const newStatus: DeviceStatus = value ? 'ON' : 'OFF'
    devicesApi.updateStatus(device.id, newStatus).catch(() => {})
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      layout
    >
      <Paper sx={{
        p: 2.5, textAlign: 'center',
        border: `1px solid ${cfg.color}22`,
        position: 'relative', overflow: 'hidden',
        transition: 'box-shadow 0.3s',
        boxShadow: isOn ? `0 0 20px ${cfg.color}18` : 'none',
        '&:hover': {
          boxShadow: isOn ? `0 0 30px ${cfg.color}25` : 'none',
        },
        '&::before': {
          content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)`,
        },
      }}>
        <FanAnimation status={status} />

        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: textPri, mb: 0.3 }}>
          {device.name}
        </Typography>
        <Typography sx={{ fontSize: '0.68rem', color: textSec, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5, fontFamily: '"JetBrains Mono", monospace' }}>
          {device.location === 'roof' ? 'Toiture' : 'Plafond'}
        </Typography>

        {/* Toggle switch instead of Chip */}
        {status !== 'Erreur' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <ToggleSwitch
              defaultChecked={isOn}
              onChange={handleToggle}
              label={isOn ? 'ON' : 'OFF'}
            />
          </Box>
        )}

        {status === 'Erreur' && (
          <Box sx={{
            display: 'inline-flex', px: 1.2, py: 0.4, borderRadius: '6px', mb: 1.5,
            bgcolor: `${cfg.color}12`, color: cfg.color,
            border: `1px solid ${cfg.color}40`,
            fontFamily: '"JetBrains Mono", monospace', fontSize: '0.65rem',
          }}>
            ERREUR
          </Box>
        )}

        <Typography sx={{ color: textSec, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.62rem', display: 'block' }}>
          {new Date(device.last_update).toLocaleString('fr-FR')}
        </Typography>
      </Paper>
    </motion.div>
  )
}

export default function DevicesPage() {
  const { mode }  = useThemeMode()
  const dark      = mode === 'dark'
  const textSec   = dark ? '#8aaccc' : '#5a7090'
  const [devices,  setDevices]  = useState<Device[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    devicesApi.list().then((r) => { setDevices(r.data); setLoading(false) }).catch(() => setLoading(false))
    const t = setInterval(() => devicesApi.list().then((r) => setDevices(r.data)).catch(() => {}), 30000)
    return () => clearInterval(t)
  }, [])

  const roof    = devices.filter((d) => d.location === 'roof')
  const ceiling = devices.filter((d) => d.location === 'ceiling')
  const counts  = {
    ON:     devices.filter((d) => d.status === 'ON').length,
    OFF:    devices.filter((d) => d.status === 'OFF').length,
    Erreur: devices.filter((d) => d.status === 'Erreur').length,
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>État des Ventilateurs</Typography>
        <Typography variant="body2" sx={{ color: textSec, mt: 0.3 }}>
          Contrôle et supervision · mise à jour automatique toutes les 30 s
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
          {(Object.entries(counts) as [DeviceStatus, number][]).map(([k, v]) => (
            <Box key={k} sx={{
              px: 1.2, py: 0.4, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: 0.5,
              bgcolor: `${STATUS_CONFIG[k].color}10`, color: STATUS_CONFIG[k].color,
              border: `1px solid ${STATUS_CONFIG[k].color}30`, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.67rem',
            }}>
              {STATUS_CONFIG[k].label}: {v}
            </Box>
          ))}
        </Box>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={230} sx={{ bgcolor: dark ? 'rgba(0,170,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          <Typography sx={{ fontWeight: 600, color: textSec, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem' }}>
            Ventilateurs de Toiture
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {roof.map((d) => <Grid item xs={12} sm={6} md={4} key={d.id}><DeviceCard device={d} /></Grid>)}
          </Grid>

          <Typography sx={{ fontWeight: 600, color: textSec, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem' }}>
            Ventilateurs de Plafond
          </Typography>
          <Grid container spacing={2}>
            {ceiling.map((d) => <Grid item xs={12} sm={6} md={4} key={d.id}><DeviceCard device={d} /></Grid>)}
          </Grid>
        </>
      )}
    </Box>
  )
}
