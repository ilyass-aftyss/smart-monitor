import { useState, useEffect } from 'react'
import { Box, Typography, Paper, ToggleButton, ToggleButtonGroup, Grid, Skeleton, TextField, Button, Chip, Slider } from '@mui/material'
import ReactECharts from 'echarts-for-react'
import { internalApi, externalApi } from '../services/api'
import { useThemeMode } from '../context/ThemeContext'
import type { InternalData, ExternalData } from '../types'

const INTERNAL_METRICS = [
  { key: 'temperature', label: 'Temperature',     unit: 'C',  color: '#10B981' },
  { key: 'co2',         label: 'CO2',             unit: 'ppm', color: '#10B981' },
  { key: 'humidity',    label: 'Humidite',         unit: '%',   color: '#10B981' },
  { key: 'voc',         label: 'VOC',             unit: 'ppb', color: '#10B981' },
  { key: 'vpd',         label: 'VPD',             unit: 'kPa', color: '#059669' },
  { key: 'pressure',    label: 'Pression Atm.',   unit: 'hPa', color: '#059669' },
  { key: 'dew_point',   label: 'Pt. de Rosee',    unit: 'C',   color: '#059669' },
]

const EXTERNAL_METRICS = [
  { key: 'radiation' as keyof ExternalData,   label: 'Irradiance Solaire',  unit: 'W/m2', color: '#10B981' },
  { key: 'wind_speed' as keyof ExternalData,  label: 'Vent',                unit: 'km/h', color: '#10B981' },
  { key: 'humidity' as keyof ExternalData,    label: 'Humidite Ext.',       unit: '%',    color: '#10B981' },
  { key: 'temperature' as keyof ExternalData, label: 'Temp. Ext.',          unit: 'C',    color: '#10B981' },
  { key: 'rain' as keyof ExternalData,        label: 'Precipitations',      unit: 'mm',   color: '#10B981' },
  { key: 'battery_v' as keyof ExternalData,   label: 'Batterie',            unit: 'V',    color: '#10B981' },
]

const OPTIMAL: Record<string, { low?: number; high?: number }> = {
  temperature: { low: 18,  high: 23   },
  humidity:    { low: 70,  high: 75   },
  co2:         { low: 800, high: 1000 },
}

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

function buildOption(
  data: any[], metricKey: string, color: string, unit: string,
  opt: { low?: number; high?: number } | undefined,
  dark: boolean,
  labelColor: string, axisColor: string, gridColor: string,
  tooltipBg: string, tooltipTxt: string,
  zoomStart: number, zoomEnd: number,
) {
  const ts   = data.map((d: any) => new Date(d.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }))
  const vals = data.map((d: any) => parseFloat(((d[metricKey] as number) || 0).toFixed(2)))
  const allVals = vals.filter(Boolean) as number[]
  const minV = allVals.length ? Math.min(...allVals) : 0
  const maxV = allVals.length ? Math.max(...allVals) : 100
  const pad  = (maxV - minV) * 0.12 || 1

  return {
    backgroundColor: 'transparent',
    animation: true,
    grid: { top: 20, right: 16, bottom: 28, left: 56 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: 'rgba(16,185,129,0.3)',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: tooltipTxt, fontFamily: '"JetBrains Mono", monospace', fontSize: 11 },
      formatter: (p: any) => `<b style="color:#10B981;font-size:13px">${p[0].value} ${unit}</b><br/><span style="opacity:0.6;font-size:10px">${p[0].axisValue}</span>`,
    },
    dataZoom: [
      { type: 'inside', start: zoomStart, end: zoomEnd },
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
      lineStyle: { color, width: 2 },
      areaStyle: { color: { type: 'linear', x:0, y:0, x2:0, y2:1, colorStops: [{ offset:0, color:'rgba(16,185,129,0.2)' }, { offset:1, color:'rgba(16,185,129,0)' }] } },
      markArea: opt ? { silent:true, itemStyle:{ color:'rgba(16,185,129,0.06)' }, data:[[{ yAxis: opt.low??0 },{ yAxis: opt.high??9999 }]] } : undefined,
    }],
  }
}

function downloadCSV(
  data: any[],
  metrics: { key: string; label: string }[],
  filename: string,
) {
  if (data.length === 0) return
  const header = ['timestamp', ...metrics.map((m) => `${m.label} (${m.key})`)]
  const rows = data.map((d) => {
    const ts = new Date(d.timestamp)
    const dateStr = `${ts.getFullYear()}-${String(ts.getMonth()+1).padStart(2,'0')}-${String(ts.getDate()).padStart(2,'0')} ${String(ts.getHours()).padStart(2,'0')}:${String(ts.getMinutes()).padStart(2,'0')}`
    const values = metrics.map((m) => {
      const v = (d as any)[m.key as string]
      return v != null ? v.toFixed(2) : ''
    })
    return [dateStr, ...values].join(';')
  })
  const bom = '\uFEFF'
  const csv = bom + header.join(';') + '\n' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

function ChartCard({
  title, unit, children, zoomRange, onZoomChange, metricKey, optimal,
}: {
  title: string; unit: string; children: React.ReactNode;
  zoomRange: [number, number]; onZoomChange: (range: [number, number]) => void;
  metricKey: string; optimal?: { low?: number; high?: number };
}) {
  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', fontFamily: '"JetBrains Mono", monospace' }}>
            {title}
          </Typography>
          {optimal && (
            <Chip label={`optimal ${optimal.low} - ${optimal.high}`} size="small"
              sx={{ height: 18, fontSize: '0.55rem', bgcolor: 'rgba(16,185,129,0.08)', color: '#6B7280',
                fontFamily: '"JetBrains Mono", monospace' }} />
          )}
        </Box>
        <Typography sx={{ fontSize: '0.65rem', color: '#6B7280', fontFamily: '"JetBrains Mono", monospace' }}>
          {unit}
        </Typography>
      </Box>
      {children}
      <Box sx={{ mt: 1.5, px: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography sx={{ fontSize: '0.6rem', color: '#6B7280', fontFamily: '"JetBrains Mono", monospace' }}>
            {zoomRange[0].toFixed(0)}%
          </Typography>
          <Typography sx={{ fontSize: '0.6rem', color: '#6B7280', fontFamily: '"JetBrains Mono", monospace' }}>
            {zoomRange[1].toFixed(0)}%
          </Typography>
        </Box>
        <Slider
          value={zoomRange}
          onChange={(_, v) => onZoomChange(v as [number, number])}
          min={0} max={100} step={1}
          size="small"
          sx={{
            color: '#10B981',
            py: 0,
            '& .MuiSlider-thumb': { width: 12, height: 12 },
            '& .MuiSlider-rail': { bgcolor: 'rgba(16,185,129,0.15)' },
          }}
        />
      </Box>
    </Paper>
  )
}

export default function HistoryPage() {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const textSec    = '#6B7280'
  const axisColor  = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const gridColor  = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'
  const labelColor = '#6B7280'
  const tooltipBg  = dark ? '#1A2E1F' : '#FFFFFF'
  const tooltipTxt = dark ? '#F0FDF4' : '#1A2E1A'

  const [hours,      setHours]      = useState<number | null>(24)
  const [internalData, setInternal] = useState<InternalData[]>([])
  const [externalData, setExternal] = useState<ExternalData[]>([])
  const [loading,    setLoading]    = useState(true)
  const [customMode, setCustomMode] = useState(false)
  const now = new Date()
  const [dateFrom, setDateFrom] = useState(toLocalDT(new Date(now.getTime() - 24*3600_000)))
  const [dateTo,   setDateTo]   = useState(toLocalDT(now))

  const [zooms, setZooms] = useState<Record<string, [number, number]>>({})

  const getZoom = (key: string, fallback: [number, number] = [0, 100]): [number, number] => zooms[key] ?? fallback
  const setZoom = (key: string, range: [number, number]) => setZooms((prev) => ({ ...prev, [key]: range }))

  const fetchByHours = (h: number) => {
    setLoading(true)
    Promise.all([
      internalApi.history(h, 2000),
      externalApi.history(h, 2000),
    ]).then(([i, e]) => {
      setInternal(i.data)
      setExternal(e.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  const fetchCustom = () => {
    const from = new Date(dateFrom), to = new Date(dateTo)
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || from >= to) return
    const diffH = Math.ceil((to.getTime() - from.getTime()) / 3_600_000)
    setLoading(true)
    Promise.all([
      internalApi.history(diffH, 2000),
      externalApi.history(diffH, 2000),
    ]).then(([i, e]) => {
      const fit = (d: InternalData) => { const ts = new Date(d.timestamp).getTime(); return ts >= from.getTime() && ts <= to.getTime() }
      const fex = (d: ExternalData) => { const ts = new Date(d.timestamp).getTime(); return ts >= from.getTime() && ts <= to.getTime() }
      setInternal(i.data.filter(fit))
      setExternal(e.data.filter(fex))
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    if (!customMode && hours !== null) fetchByHours(hours)
  }, [hours, customMode])

  const dtFieldSx = {
    '& .MuiOutlinedInput-root': {
      color: dark ? '#F0FDF4' : '#1A2E1A', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.78rem',
      '& fieldset': { borderColor: 'rgba(16,185,129,0.2)' },
      '&:hover fieldset': { borderColor: '#10B981' },
    },
    '& .MuiInputLabel-root': { color: textSec, fontSize: '0.78rem' },
    '& input::-webkit-calendar-picker-indicator': { filter: dark ? 'invert(0.6)' : 'none' },
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Historique des Donnees</Typography>
          <Typography variant="body2" sx={{ color: textSec, mt: 0.3 }}>
            {internalData.length + externalData.length} mesures · zones colorees = plage optimale fraisier
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'flex-end' }}>
          <ToggleButtonGroup value={customMode ? null : hours} exclusive size="small"
            onChange={(_, v) => { if (v !== null) { setCustomMode(false); setHours(v) } }}
            sx={{ '& .MuiToggleButton-root': { color: textSec, borderColor: 'rgba(16,185,129,0.15)', fontFamily: '"JetBrains Mono", monospace', px: 1.8, fontSize: '0.78rem',
              '&.Mui-selected': { bgcolor: 'rgba(16,185,129,0.12)', color: '#10B981' } } }}>
            {TIME_RANGES.map((r) => <ToggleButton key={r.value} value={r.value}>{r.label}</ToggleButton>)}
            <ToggleButton value={-1} selected={customMode} onClick={() => { setCustomMode(true); setHours(null) }}
              sx={{ '&.Mui-selected': { bgcolor: 'rgba(245,158,11,0.1)', color: '#F59E0B !important' } }}>
              Personnalisee
            </ToggleButton>
          </ToggleButtonGroup>

          {customMode && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <TextField label="Du" type="datetime-local" size="small" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={dtFieldSx} />
              <Typography sx={{ color: textSec, fontSize: '0.8rem' }}>→</Typography>
              <TextField label="Au" type="datetime-local" size="small" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={dtFieldSx} />
              <Button variant="outlined" size="small" onClick={fetchCustom}
                sx={{ borderColor: 'rgba(245,158,11,0.4)', color: '#F59E0B', textTransform: 'none', '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245,158,11,0.06)' } }}>
                Chercher
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} />
            <Typography variant="subtitle2" fontWeight={700}>Historique Interieur</Typography>
          </Box>
          <Chip
            label="CSV"
            size="small"
            onClick={() => downloadCSV(internalData, INTERNAL_METRICS, `interieur_${hours ?? 'custom'}h.csv`)}
            sx={{
              height: 22, fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer',
              bgcolor: 'rgba(16,185,129,0.12)', color: '#10B981',
              border: '1px solid rgba(16,185,129,0.25)',
              fontFamily: '"JetBrains Mono", monospace',
              transition: 'all 0.15s',
              '&:hover': { bgcolor: 'rgba(16,185,129,0.2)', borderColor: '#10B981' },
            }}
          />
        </Box>
        <Grid container spacing={2}>
          {INTERNAL_METRICS.map((m) => {
            const opt = OPTIMAL[m.key]
            const zoomKey = `int-${m.key}`
            const zoomRange = getZoom(zoomKey, [0, 100])
            return (
              <Grid item xs={12} md={6} key={m.key}>
                <ChartCard
                  title={m.label} unit={m.unit}
                  metricKey={m.key} optimal={opt}
                  zoomRange={zoomRange}
                  onZoomChange={(r) => setZoom(zoomKey, r)}
                >
                  {loading
                    ? <Skeleton variant="rounded" height={200} sx={{ bgcolor: dark ? 'rgba(16,185,129,0.04)' : 'rgba(0,0,0,0.04)' }} />
                    : <ReactECharts option={buildOption(internalData, m.key, '#10B981', m.unit, opt, dark, labelColor, axisColor, gridColor, tooltipBg, tooltipTxt, zoomRange[0], zoomRange[1])} style={{ height: 200 }} opts={{ renderer: 'canvas' }} />
                  }
                </ChartCard>
              </Grid>
            )
          })}
        </Grid>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#059669' }} />
            <Typography variant="subtitle2" fontWeight={700}>Historique Exterieur</Typography>
          </Box>
          <Chip
            label="CSV"
            size="small"
            onClick={() => downloadCSV(externalData, EXTERNAL_METRICS as any, `exterieur_${hours ?? 'custom'}h.csv`)}
            sx={{
              height: 22, fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer',
              bgcolor: 'rgba(16,185,129,0.12)', color: '#10B981',
              border: '1px solid rgba(16,185,129,0.25)',
              fontFamily: '"JetBrains Mono", monospace',
              transition: 'all 0.15s',
              '&:hover': { bgcolor: 'rgba(16,185,129,0.2)', borderColor: '#10B981' },
            }}
          />
        </Box>
        <Grid container spacing={2}>
          {EXTERNAL_METRICS.map((m) => {
            const zoomKey = `ext-${m.key as string}`
            const zoomRange = getZoom(zoomKey, [0, 100])
            return (
              <Grid item xs={12} md={6} key={m.key as string}>
                <ChartCard
                  title={m.label} unit={m.unit}
                  metricKey={m.key as string}
                  zoomRange={zoomRange}
                  onZoomChange={(r) => setZoom(zoomKey, r)}
                >
                  {loading
                    ? <Skeleton variant="rounded" height={200} sx={{ bgcolor: dark ? 'rgba(16,185,129,0.04)' : 'rgba(0,0,0,0.04)' }} />
                    : <ReactECharts option={buildOption(externalData, m.key as string, '#10B981', m.unit, undefined, dark, labelColor, axisColor, gridColor, tooltipBg, tooltipTxt, zoomRange[0], zoomRange[1])} style={{ height: 200 }} opts={{ renderer: 'canvas' }} />
                  }
                </ChartCard>
              </Grid>
            )
          })}
        </Grid>
      </Paper>
    </Box>
  )
}
