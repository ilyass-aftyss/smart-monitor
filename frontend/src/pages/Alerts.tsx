import { useEffect, useState } from 'react'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableHead,
  TableRow, Chip, IconButton, Tooltip, Switch, FormControlLabel, Skeleton,
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { motion } from 'framer-motion'
import { alertsApi } from '../services/api'
import { useThemeMode } from '../context/ThemeContext'
import type { Alert } from '../types'

const SEVERITY_CONFIG = {
  critical: { color: '#e8334a', bg: 'rgba(232,51,74,0.1)',  label: 'CRITIQUE'  },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'ATTENTION' },
  info:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', label: 'INFO'      },
}

const TYPE_META: Record<string, { label: string }> = {
  temperature:      { label: 'Température'   },
  temperature_high: { label: 'Temp. élevée'  },
  temperature_low:  { label: 'Temp. basse'   },
  humidity:         { label: 'Humidité'      },
  humidity_high:    { label: 'Hum. élevée'   },
  humidity_low:     { label: 'Hum. basse'    },
  co2:              { label: 'CO₂'           },
  co2_high:         { label: 'CO₂ élevé'     },
  co2_low:          { label: 'CO₂ bas'       },
  voc:              { label: 'VOC'           },
  sensor_loss:      { label: 'Perte capteur' },
  default:          { label: 'Alerte'        },
}

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? TYPE_META.default
}

export default function AlertsPage() {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const textPri = dark ? '#e2ecf8' : '#1a2540'
  const textSec = dark ? '#8aaccc' : '#5a7090'

  const [alerts,   setAlerts]   = useState<Alert[]>([])
  const [loading,  setLoading]  = useState(true)
  const [onlyUnack, setOnlyUnack] = useState(false)
  const [stats,    setStats]    = useState({ total: 0, unacknowledged: 0, critical: 0, warning: 0 })

  const fetchAlerts = () => {
    Promise.all([alertsApi.list(100, onlyUnack), alertsApi.stats()])
      .then(([a, s]) => { setAlerts(a.data); setStats(s.data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { setLoading(true); fetchAlerts() }, [onlyUnack])

  const handleAck = async (id: number) => {
    try {
      await alertsApi.acknowledge(id)
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() } : a))
    } catch {}
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Alertes & Notifications</Typography>
          <Typography variant="body2" sx={{ color: textSec, mt: 0.3 }}>
            Surveillance des paramètres climatiques — seuils agronomiques du fraisier
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
            {[
              { label: `${stats.unacknowledged} Non acquittées`, color: '#e8334a' },
              { label: `${stats.critical} Critiques`,           color: '#e8334a' },
              { label: `${stats.warning} Attention`,            color: '#f59e0b' },
            ].map((s) => (
              <Chip key={s.label} label={s.label} size="small"
                sx={{ bgcolor: `${s.color}12`, color: s.color, border: `1px solid ${s.color}30`,
                  fontFamily: '"JetBrains Mono", monospace', fontSize: '0.68rem', height: 22 }} />
            ))}
          </Box>
        </Box>
        <FormControlLabel
          control={
            <Switch checked={onlyUnack} onChange={(e) => setOnlyUnack(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: dark ? '#00aaff' : '#0070d4' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: dark ? '#00aaff' : '#0070d4' },
              }} />
          }
          label={<Typography variant="body2" sx={{ color: textSec }}>Non acquittées seulement</Typography>}
        />
      </Box>

      {/* Seuils de référence */}
      <Paper sx={{ p: 2, mb: 2.5, border: `1px solid ${dark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)'}`, bgcolor: dark ? 'rgba(16,185,129,0.03)' : 'rgba(16,185,129,0.03)' }}>
        <Typography sx={{ fontSize: '0.67rem', color: dark ? '#10b981' : '#059669', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
          Seuils optimaux fraisier (microclimat froid)
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {[
            { label: 'Temp. diurne',   value: '18–23 °C'      },
            { label: 'Temp. nocturne', value: '10–13 °C'      },
            { label: 'Humidité',       value: '70–75 %'       },
            { label: 'CO₂',           value: '800–1000 ppm'  },
            { label: 'Photopériode',  value: '> 10 h/jour'   },
          ].map((s) => (
            <Box key={s.label}>
              <Typography sx={{ fontSize: '0.63rem', color: textSec }}>{s.label}</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: textPri, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}>{s.value}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 2 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={48} sx={{ bgcolor: dark ? 'rgba(0,170,255,0.04)' : 'rgba(0,0,0,0.04)', mb: 0.5 }} />
            ))}
          </Box>
        ) : alerts.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>✅</Typography>
            <Typography variant="h6" sx={{ color: dark ? '#00e87a' : '#10b981', mb: 0.5 }}>Aucune alerte active</Typography>
            <Typography variant="body2" sx={{ color: textSec }}>Tous les paramètres dans les normes agronomiques</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Type', 'Message', 'Sévérité', 'Valeur', 'Seuil', 'Horodatage', 'Statut', 'Action'].map((h) => (
                  <TableCell key={h} sx={{ fontSize: '0.68rem', fontWeight: 700, color: dark ? '#00aaff' : '#0070d4',
                    bgcolor: dark ? 'rgba(0,170,255,0.06)' : 'rgba(0,112,212,0.05)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((alert, i) => {
                const sev  = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.info
                const meta = getTypeMeta(alert.alert_type)
                return (
                  <motion.tr key={alert.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 }}
                    style={{ background: alert.acknowledged ? 'transparent' : `${sev.color}08` }}>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: textSec, fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', fontSize: '0.67rem' }}>
                        {meta.label}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: alert.acknowledged ? textSec : textPri, fontSize: '0.8rem' }}>
                        {alert.message}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={sev.label} size="small" sx={{ bgcolor: sev.bg, color: sev.color, border: `1px solid ${sev.color}33`,
                        fontFamily: '"JetBrains Mono", monospace', fontSize: '0.63rem', height: 20 }} />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: sev.color, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '0.78rem' }}>
                        {alert.value?.toFixed(1)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: textSec, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.72rem' }}>
                        {alert.threshold?.toFixed(0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: textSec, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                        {new Date(alert.timestamp).toLocaleString('fr-FR')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {alert.acknowledged ? (
                        <Chip label="Acquitté" size="small" sx={{ bgcolor: dark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.08)', color: dark ? '#00e87a' : '#10b981',
                          border: `1px solid ${dark ? 'rgba(0,232,122,0.25)' : 'rgba(16,185,129,0.25)'}`, fontSize: '0.62rem', height: 20 }} />
                      ) : (
                        <Chip label="En attente" size="small" sx={{ bgcolor: 'rgba(245,158,11,0.08)', color: '#f59e0b',
                          border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.62rem', height: 20 }} />
                      )}
                    </TableCell>
                    <TableCell>
                      {!alert.acknowledged && (
                        <Tooltip title="Acquitter">
                          <IconButton size="small" onClick={() => handleAck(alert.id)}
                            sx={{ color: dark ? '#00e87a' : '#10b981', '&:hover': { bgcolor: dark ? 'rgba(0,232,122,0.1)' : 'rgba(16,185,129,0.1)' } }}>
                            <CheckCircleOutlineIcon sx={{ fontSize: '1rem' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </motion.tr>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  )
}
