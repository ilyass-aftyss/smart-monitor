import { useEffect, useState } from 'react'
import { Grid, Box, Typography, Paper, Skeleton } from '@mui/material'
import { motion } from 'framer-motion'
import { useLatestSensorData } from '../hooks/useSensorData'
import { internalApi } from '../services/api'
import { useThemeMode } from '../context/ThemeContext'
import type { InternalData } from '../types'
import KpiCard from '../components/dashboard/KpiCard'
import LiveChart from '../components/dashboard/LiveChart'

interface KpiConfig {
  key: keyof InternalData
  label: string
  unit: string
  color: string
  min: number
  max: number
  optLow?: number
  optHigh?: number
  warnLow?: number
  warnHigh?: number
  critLow?: number
  critHigh?: number
}

const KPI_CONFIGS: KpiConfig[] = [
  { key: 'temperature', label: 'Température',    unit: '°C',  color: '#f97316', min: 5,   max: 40,   optLow: 18, optHigh: 23,   warnLow: 18, warnHigh: 23,  critLow: 10, critHigh: 30 },
  { key: 'co2',         label: 'CO₂',            unit: 'ppm', color: '#3b82f6', min: 400, max: 1500, optLow: 800, optHigh: 1000, warnLow: 800, warnHigh: 1000, critHigh: 1200 },
  { key: 'humidity',    label: 'Humidité',        unit: '%',   color: '#06b6d4', min: 40,  max: 100,  optLow: 70, optHigh: 75,   warnLow: 70, warnHigh: 75,  critLow: 60, critHigh: 85 },
  { key: 'voc',         label: 'VOC',             unit: 'ppb', color: '#a855f7', min: 0,   max: 500,  warnHigh: 300, critHigh: 400 },
  { key: 'vpd',         label: 'VPD',             unit: 'kPa', color: '#10b981', min: 0,   max: 2,    warnHigh: 1.5, critHigh: 1.8 },
  { key: 'pressure',    label: 'Pression Atm.',   unit: 'hPa', color: '#f59e0b', min: 980, max: 1040 },
  { key: 'dew_point',   label: 'Point de Rosée',  unit: '°C',  color: '#64748b', min: 0,   max: 30 },
]

const CHART_METRICS: (keyof InternalData)[] = ['temperature', 'co2', 'humidity', 'voc']

function getStatus(v: number, cfg: KpiConfig): 'normal' | 'warning' | 'critical' {
  if (cfg.critHigh !== undefined && v >= cfg.critHigh) return 'critical'
  if (cfg.critLow  !== undefined && v <= cfg.critLow)  return 'critical'
  if (cfg.warnHigh !== undefined && v >  cfg.warnHigh) return 'warning'
  if (cfg.warnLow  !== undefined && v <  cfg.warnLow)  return 'warning'
  return 'normal'
}

function SourceBadge({ lastUpdate }: { lastUpdate: Date | null }) {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const isLive = lastUpdate ? (Date.now() - lastUpdate.getTime()) < 90000 : false

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8,
        px: 1.4, py: 0.5, borderRadius: '20px',
        bgcolor: isLive ? (dark ? 'rgba(0,232,122,0.08)' : 'rgba(16,185,129,0.08)') : 'rgba(245,158,11,0.08)',
        border: `1px solid ${isLive ? (dark ? 'rgba(0,232,122,0.25)' : 'rgba(16,185,129,0.25)') : 'rgba(245,158,11,0.25)'}`,
      }}>
        <Box sx={{
          width: 7, height: 7, borderRadius: '50%',
          bgcolor: isLive ? (dark ? '#00e87a' : '#10b981') : '#f59e0b',
          boxShadow: isLive ? `0 0 6px ${dark ? '#00e87a' : '#10b981'}` : 'none',
          animation: isLive ? 'pulse 2s infinite' : 'none',
          '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
        }} />
        <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace',
          color: isLive ? (dark ? '#00e87a' : '#10b981') : '#f59e0b' }}>
          {isLive ? 'Simulateur EN DIRECT' : 'En attente de données'}
        </Typography>
      </Box>
      {lastUpdate && (
        <Typography sx={{ fontSize: '0.68rem', color: dark ? '#8aaccc' : '#5a7090', fontFamily: '"JetBrains Mono", monospace' }}>
          Dernière mesure : {lastUpdate.toLocaleTimeString('fr-FR')}
        </Typography>
      )}
    </Box>
  )
}

export default function DashboardPage() {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const { internal, external, loading, lastUpdate } = useLatestSensorData(30000)
  const [history, setHistory] = useState<InternalData[]>([])
  const textSec = dark ? '#8aaccc' : '#5a7090'
  const borderCol = dark ? 'rgba(0,170,255,0.08)' : 'rgba(0,80,160,0.08)'

  useEffect(() => {
    internalApi.history(2, 120).then((r) => setHistory(r.data)).catch(() => {})
  }, [])

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Surveillance Temps Réel</Typography>
          <Typography variant="body2" sx={{ color: textSec, mt: 0.3 }}>
            Culture hors-sol du fraisier · 3 gouttières × 8.5 m · 80 plants
          </Typography>
        </Box>
        <SourceBadge lastUpdate={lastUpdate} />
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {KPI_CONFIGS.map((cfg, i) => {
          const value = internal ? (internal[cfg.key] as number) : null
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={cfg.key}>
              {loading || value === null ? (
                <Skeleton variant="rounded" height={140} sx={{ bgcolor: dark ? 'rgba(0,170,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
              ) : (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <KpiCard
                    label={cfg.label} value={value} unit={cfg.unit}
                    color={cfg.color} min={cfg.min} max={cfg.max} current={value}
                    status={getStatus(value, cfg)} optLow={cfg.optLow} optHigh={cfg.optHigh}
                  />
                </motion.div>
              )}
            </Grid>
          )
        })}

        {/* External mini-card */}
        {external && (
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Paper sx={{ p: 2.5, height: '100%', border: `1px solid ${dark ? 'rgba(249,115,22,0.2)' : 'rgba(249,115,22,0.15)'}` }}>
                <Typography variant="caption" sx={{ color: textSec, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem', display: 'block', mb: 1.5 }}>
                  Conditions Extérieures
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2 }}>
                  {[
                    { label: 'Radiation',  value: external.radiation,   unit: 'W/m²', color: '#f97316' },
                    { label: 'Vent',       value: external.wind_speed,  unit: 'm/s',  color: '#06b6d4' },
                    { label: 'Hum. Ext.', value: external.humidity,    unit: '%',    color: '#3b82f6' },
                    { label: 'Temp. Ext.',value: external.temperature, unit: '°C',   color: '#f59e0b' },
                  ].map((item) => (
                    <Box key={item.label}>
                      <Typography sx={{ fontSize: '0.6rem', color: textSec, mb: 0.2 }}>{item.label}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.3 }}>
                        <Typography sx={{ color: item.color, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1 }}>
                          {item.value.toFixed(1)}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: textSec }}>{item.unit}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        )}
      </Grid>

      {/* Conditions Optimales */}
      <Paper sx={{ p: 2, mb: 3, border: `1px solid ${dark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.12)'}` }}>
        <Typography variant="caption" sx={{ color: textSec, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.65rem', mb: 1.5, display: 'block' }}>
          Référence — Conditions Optimales Fraisier
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {[
            { label: 'Temp. Jour',   value: '18–23 °C',    color: '#f97316', ok: internal ? internal.temperature >= 18 && internal.temperature <= 23 : null },
            { label: 'Temp. Nuit',   value: '10–13 °C',    color: '#fb923c', ok: null },
            { label: 'Humidité',     value: '70–75 %',     color: '#06b6d4', ok: internal ? internal.humidity >= 70 && internal.humidity <= 75 : null },
            { label: 'CO₂',          value: '800–1000 ppm',color: '#3b82f6', ok: internal ? internal.co2 >= 800 && internal.co2 <= 1000 : null },
            { label: 'Photopériode', value: '> 10 h/jour', color: '#eab308',
              ok: external ? external.radiation > 10 : null,
              extra: external ? (external.radiation > 10 ? 'Lumière active' : 'Faible luminosité') : null },
          ].map((c) => (
            <Box key={c.label} sx={{
              display: 'flex', alignItems: 'center', gap: 0.8, px: 1.4, py: 0.6, borderRadius: '8px',
              bgcolor: c.ok === null ? (dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') : c.ok ? (dark ? 'rgba(16,185,129,0.07)' : 'rgba(16,185,129,0.06)') : (dark ? 'rgba(239,68,68,0.07)' : 'rgba(239,68,68,0.06)'),
              border: `1px solid ${c.ok === null ? borderCol : c.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                bgcolor: c.ok === null ? (dark ? '#8aaccc' : '#94a3b8') : c.ok ? '#10b981' : '#ef4444' }} />
              <Typography sx={{ fontSize: '0.67rem', color: textSec, fontFamily: '"JetBrains Mono", monospace' }}>{c.label}:</Typography>
              <Typography sx={{ fontSize: '0.67rem', color: c.color, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>{c.value}</Typography>
              {c.extra && <Typography sx={{ fontSize: '0.62rem', color: textSec }}>({c.extra})</Typography>}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Charts */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>Tendances — 2 dernières heures</Typography>
          <Typography sx={{ fontSize: '0.68rem', color: textSec, fontFamily: '"JetBrains Mono", monospace' }}>
            {history.length} mesures · 1 point/min
          </Typography>
        </Box>
        {history.length === 0 ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
            {CHART_METRICS.map((m) => <Skeleton key={m} variant="rounded" height={180} sx={{ bgcolor: dark ? 'rgba(0,170,255,0.04)' : 'rgba(0,0,0,0.04)' }} />)}
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            {CHART_METRICS.map((metric) => {
              const cfg = KPI_CONFIGS.find((c) => c.key === metric)!
              return (
                <Box key={metric}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: cfg.color, mb: 1, fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {cfg.label} ({cfg.unit})
                  </Typography>
                  <LiveChart data={history} metric={metric} label={cfg.label} color={cfg.color} unit={cfg.unit} optLow={cfg.optLow} optHigh={cfg.optHigh} />
                </Box>
              )
            })}
          </Box>
        )}
      </Paper>
    </Box>
  )
}
