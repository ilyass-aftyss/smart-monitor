import { useState, useEffect } from 'react'
import { Box, Typography, Paper, ToggleButton, ToggleButtonGroup, Grid, Skeleton, TextField, Button } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ReactECharts from 'echarts-for-react'
import { internalApi } from '../services/api'
import { useThemeMode } from '../context/ThemeContext'
import type { InternalData } from '../types'

const OPTIMAL: Record<string, { low?: number; high?: number }> = {
  temperature: { low: 18,  high: 23   },
  humidity:    { low: 70,  high: 75   },
  co2:         { low: 800, high: 1000 },
}

const METRICS = [
  { key: 'temperature', label: 'Température',     unit: '°C',  color: '#f97316' },
  { key: 'co2',         label: 'CO₂',             unit: 'ppm', color: '#3b82f6' },
  { key: 'humidity',    label: 'Humidité',         unit: '%',   color: '#06b6d4' },
  { key: 'voc',         label: 'VOC',             unit: 'ppb', color: '#a855f7' },
  { key: 'vpd',         label: 'VPD',             unit: 'kPa', color: '#10b981' },
  { key: 'pressure',    label: 'Pression Atm.',   unit: 'hPa', color: '#f59e0b' },
  { key: 'dew_point',   label: 'Point de Rosée',  unit: '°C',  color: '#64748b' },
]

const TIME_RANGES = [
  { value: 1,   label: '1h'  },
  { value: 24,  label: '24h' },
  { value: 168, label: '7j'  },
  { value: 720, label: '30j' },
]

function pad(n: number) { return String(n).padStart(2, '0') }
function toLocalDT(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function HistoryPage() {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const textSec    = dark ? '#8aaccc' : '#5a7090'
  const axisColor  = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const gridColor  = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'
  const labelColor = dark ? '#8aaccc' : '#5a7090'
  const tooltipBg  = dark ? '#0a1628' : '#ffffff'
  const tooltipTxt = dark ? '#e2ecf8' : '#1a2540'

  const [hours,      setHours]      = useState<number | null>(24)
  const [data,       setData]       = useState<InternalData[]>([])
  const [loading,    setLoading]    = useState(true)
  const [customMode, setCustomMode] = useState(false)
  const now = new Date()
  const [dateFrom, setDateFrom] = useState(toLocalDT(new Date(now.getTime() - 24*3600_000)))
  const [dateTo,   setDateTo]   = useState(toLocalDT(now))

  const fetchByHours = (h: number) => {
    setLoading(true)
    internalApi.history(h, 2000).then((r) => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }

  const fetchCustom = () => {
    const from = new Date(dateFrom), to = new Date(dateTo)
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || from >= to) return
    const diffH = Math.ceil((to.getTime() - from.getTime()) / 3_600_000)
    setLoading(true)
    internalApi.history(diffH, 2000).then((r) => {
      setData(r.data.filter((d: InternalData) => {
        const ts = new Date(d.timestamp).getTime()
        return ts >= from.getTime() && ts <= to.getTime()
      }))
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    if (!customMode && hours !== null) fetchByHours(hours)
  }, [hours, customMode])

  function buildOption(metricKey: string, color: string, unit: string) {
    const opt = OPTIMAL[metricKey]
    const ts   = data.map((d) => new Date(d.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }))
    const vals = data.map((d) => parseFloat(((d as any)[metricKey] || 0).toFixed(2)))
    const allVals = vals.filter(Boolean) as number[]
    const minV = allVals.length ? Math.min(...allVals) : 0
    const maxV = allVals.length ? Math.max(...allVals) : 100
    const pad  = (maxV - minV) * 0.12 || 1

    return {
      backgroundColor: 'transparent',
      animation: true,
      grid: { top: 20, right: 16, bottom: 50, left: 56 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: tooltipBg,
        borderColor: `${color}55`,
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: tooltipTxt, fontFamily: '"JetBrains Mono", monospace', fontSize: 11 },
        formatter: (p: any) => `<b style="color:${color};font-size:13px">${p[0].value} ${unit}</b><br/><span style="opacity:0.6;font-size:10px">${p[0].axisValue}</span>`,
      },
      dataZoom: [
        { type: 'inside', start: 70, end: 100 },
        { type: 'slider', start: 70, end: 100, height: 18, bottom: 4,
          borderColor: dark ? 'rgba(0,170,255,0.15)' : 'rgba(0,80,160,0.15)',
          fillerColor: dark ? 'rgba(0,170,255,0.07)' : 'rgba(0,80,160,0.07)',
          handleStyle: { color }, textStyle: { color: labelColor, fontSize: 9 } },
      ],
      xAxis: {
        type: 'category', data: ts, boundaryGap: false,
        axisLine: { lineStyle: { color: axisColor } },
        axisTick: { show: false },
        axisLabel: { color: labelColor, fontSize: 9, fontFamily: '"JetBrains Mono", monospace', rotate: 20, interval: Math.max(0, Math.floor(ts.length / 8) - 1) },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: minV - pad, max: maxV + pad,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: labelColor, fontSize: 9, fontFamily: '"JetBrains Mono", monospace' },
        splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
      },
      series: [{
        type: 'line', data: vals, smooth: 0.3, symbol: 'none',
        lineStyle: { color, width: 2, shadowColor: `${color}44`, shadowBlur: 6 },
        areaStyle: { color: { type: 'linear', x:0, y:0, x2:0, y2:1, colorStops: [{ offset:0, color:`${color}38` }, { offset:1, color:`${color}00` }] } },
        markArea: opt ? { silent:true, itemStyle:{ color:`${color}10` }, data:[[{ yAxis: opt.low??0 },{ yAxis: opt.high??9999 }]] } : undefined,
      }],
    }
  }

  const dtFieldSx = {
    '& .MuiOutlinedInput-root': {
      color: dark ? '#e2ecf8' : '#1a2540', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.78rem',
      '& fieldset': { borderColor: dark ? 'rgba(0,170,255,0.2)' : 'rgba(0,80,160,0.2)' },
      '&:hover fieldset': { borderColor: dark ? '#00aaff' : '#0070d4' },
    },
    '& .MuiInputLabel-root': { color: textSec, fontSize: '0.78rem' },
    '& input::-webkit-calendar-picker-indicator': { filter: dark ? 'invert(0.6)' : 'none' },
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Historique des Données</Typography>
          <Typography variant="body2" sx={{ color: textSec, mt: 0.3 }}>
            {data.length} mesures · zones colorées = plage optimale fraisier
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'flex-end' }}>
          <ToggleButtonGroup value={customMode ? null : hours} exclusive size="small"
            onChange={(_, v) => { if (v !== null) { setCustomMode(false); setHours(v) } }}
            sx={{ '& .MuiToggleButton-root': { color: textSec, borderColor: dark ? 'rgba(0,170,255,0.2)' : 'rgba(0,80,160,0.15)', fontFamily: '"JetBrains Mono", monospace', px: 1.8, fontSize: '0.78rem',
              '&.Mui-selected': { bgcolor: dark ? 'rgba(0,170,255,0.12)' : 'rgba(0,112,212,0.1)', color: dark ? '#00aaff' : '#0070d4' } } }}>
            {TIME_RANGES.map((r) => <ToggleButton key={r.value} value={r.value}>{r.label}</ToggleButton>)}
            <ToggleButton value={-1} selected={customMode} onClick={() => { setCustomMode(true); setHours(null) }}
              sx={{ '&.Mui-selected': { bgcolor: dark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.08)', color: '#f59e0b !important' } }}>
              Personnalisée
            </ToggleButton>
          </ToggleButtonGroup>

          {customMode && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <TextField label="Du" type="datetime-local" size="small" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={dtFieldSx} />
              <Typography sx={{ color: textSec, fontSize: '0.8rem' }}>→</Typography>
              <TextField label="Au" type="datetime-local" size="small" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={dtFieldSx} />
              <Button variant="outlined" size="small" startIcon={<SearchIcon />} onClick={fetchCustom}
                sx={{ borderColor: 'rgba(245,158,11,0.4)', color: '#f59e0b', textTransform: 'none', '&:hover': { borderColor: '#f59e0b', bgcolor: 'rgba(245,158,11,0.06)' } }}>
                Chercher
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Grid container spacing={2}>
        {METRICS.map((m) => (
          <Grid item xs={12} md={6} key={m.key}>
            <Paper sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: m.color, fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {m.label}
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', color: textSec, fontFamily: '"JetBrains Mono", monospace' }}>
                  {m.unit}{OPTIMAL[m.key] ? ` · optimal ${OPTIMAL[m.key].low}–${OPTIMAL[m.key].high}` : ''}
                </Typography>
              </Box>
              {loading
                ? <Skeleton variant="rounded" height={220} sx={{ bgcolor: dark ? 'rgba(0,170,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
                : <ReactECharts option={buildOption(m.key, m.color, m.unit)} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
              }
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
