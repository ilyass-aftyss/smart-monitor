import { useEffect, useState } from 'react'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableHead,
  TableRow, Chip, Switch, FormControlLabel, Skeleton,
} from '@mui/material'
import { alertsApi } from '../services/api'
import { useThemeMode } from '../context/ThemeContext'
import type { Alert } from '../types'

const SEVERITY_CONFIG = {
  critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',  label: 'CRITIQUE'  },
  warning:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', label: 'ATTENTION' },
  info:     { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', label: 'INFO'      },
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
  const textPri = dark ? '#F0FDF4' : '#1A2E1A'
  const textSec = '#6B7280'

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
              { label: `${stats.unacknowledged} Non acquittées`, color: '#EF4444' },
              { label: `${stats.critical} Critiques`,           color: '#EF4444' },
              { label: `${stats.warning} Attention`,            color: '#F59E0B' },
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
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#10B981' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#10B981' },
              }} />
          }
          label={<Typography variant="body2" sx={{ color: textSec }}>Non acquittées seulement</Typography>}
        />
      </Box>

      <Paper sx={{ p: 2, mb: 2.5 }}>
        <Typography sx={{ fontSize: '0.67rem', color: '#10B981', fontFamily: '"JetBrains Mono", monospace', mb: 1 }}>
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

      <Paper sx={{ overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 2 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={48} sx={{ bgcolor: dark ? 'rgba(16,185,129,0.04)' : 'rgba(0,0,0,0.04)', mb: 0.5 }} />
            ))}
          </Box>
        ) : alerts.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>✅</Typography>
            <Typography variant="h6" sx={{ color: '#10B981', mb: 0.5 }}>Aucune alerte active</Typography>
            <Typography variant="body2" sx={{ color: textSec }}>Tous les paramètres dans les normes agronomiques</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Type', 'Message', 'Sévérité', 'Valeur', 'Seuil', 'Horodatage', 'Statut', 'Action'].map((h) => (
                  <TableCell key={h} sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#10B981',
                    bgcolor: dark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.05)' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((alert) => {
                const sev  = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.info
                const meta = getTypeMeta(alert.alert_type)
                return (
                  <TableRow key={alert.id}
                    sx={{ background: alert.acknowledged ? 'transparent' : `${sev.color}08` }}>
                    <TableCell>
                      <Typography sx={{ color: textSec, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.67rem' }}>
                        {meta.label}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: alert.acknowledged ? textSec : textPri, fontSize: '0.8rem' }}>
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
                        <Chip label="Acquitté" size="small" sx={{ bgcolor: 'rgba(16,185,129,0.08)', color: '#10B981',
                          border: '1px solid rgba(16,185,129,0.25)', fontSize: '0.62rem', height: 20 }} />
                      ) : (
                        <Chip label="En attente" size="small" sx={{ bgcolor: 'rgba(245,158,11,0.08)', color: '#F59E0B',
                          border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.62rem', height: 20 }} />
                      )}
                    </TableCell>
                    <TableCell>
                      {!alert.acknowledged && (
                        <Box
                          onClick={() => handleAck(alert.id)}
                          sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.4,
                            px: 1, py: 0.3, borderRadius: '6px', cursor: 'pointer', userSelect: 'none',
                            color: '#10B981', fontSize: '0.68rem', fontWeight: 600,
                            fontFamily: '"JetBrains Mono", monospace',
                            border: '1px solid rgba(16,185,129,0.25)',
                            bgcolor: 'rgba(16,185,129,0.05)',
                            transition: 'all 0.15s',
                            '&:hover': { bgcolor: 'rgba(16,185,129,0.1)' },
                          }}
                        >
                          ✓ Acquitter
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  )
}
