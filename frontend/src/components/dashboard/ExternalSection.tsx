import { useState, useEffect, useRef } from 'react'
import { Box, Typography, Paper, Grid, Chip, Skeleton } from '@mui/material'
import ReactECharts from 'echarts-for-react'
import { externalApi } from '../../services/api'
import { useThemeMode } from '../../context/ThemeContext'
import type { ExternalData } from '../../types'

const REFRESH_MS = 15 * 60 * 1000

const METRICS: { key: string; label: string; unit: string; yMin?: number; yMax?: number }[] = [
  { key: 'radiation',   label: 'Irradiance Solaire',  unit: 'W/m²', yMin: 0 },
  { key: 'wind_speed',  label: 'Vitesse du Vent',     unit: 'km/h', yMin: 0 },
  { key: 'humidity',    label: 'Humidité Extérieure', unit: '%',    yMin: 0, yMax: 100 },
  { key: 'temperature', label: 'Température Ext.',    unit: '°C' },
  { key: 'rain',        label: 'Précipitations',      unit: 'mm',   yMin: 0 },
  { key: 'battery_v',   label: 'Batterie Capteur',    unit: 'V' },
]

export default function ExternalSection() {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const textSec    = '#6B7280'
  const tooltipBg  = dark ? '#1A2E1F' : '#FFFFFF'
  const tooltipTxt = dark ? '#F0FDF4' : '#1A2E1A'
  const axisColor  = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const gridColor  = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'
  const labelColor = '#6B7280'

  const [latest,     setLatest]     = useState<ExternalData | null>(null)
  const [history,    setHistory]    = useState<ExternalData[]>([])
  const [loading,    setLoading]    = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [countdown,  setCountdown]  = useState(REFRESH_MS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = () => {
    Promise.all([externalApi.latest(), externalApi.history(48, 500)])
      .then(([l, h]) => {
        setLatest(l.data); setHistory(h.data)
        setLoading(false); setLastUpdate(new Date()); setCountdown(REFRESH_MS)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    const r = setInterval(fetchData, REFRESH_MS)
    return () => clearInterval(r)
  }, [])

  useEffect(() => {
    timerRef.current = setInterval(() => setCountdown((c) => Math.max(0, c - 1000)), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const minLeft = Math.ceil(countdown / 60000)
  const acqTime = latest ? new Date(latest.timestamp).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'

  function buildChart(cfg: typeof METRICS[0]) {
    const labels = history.map((d) => new Date(d.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    const vals   = history.map((d) => {
      const v = (d as any)[cfg.key] as number
      return v != null ? parseFloat(v.toFixed(2)) : null
    })
    const allVals = vals.filter((v) => v !== null) as number[]
    const minV = allVals.length ? Math.min(...allVals) : 0
    const maxV = allVals.length ? Math.max(...allVals) : 100
    const pad  = (maxV - minV) * 0.15 || 1
    const { unit, yMin, yMax } = cfg

    return {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 300,
      grid: { top: 20, right: 16, bottom: 36, left: 52 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: tooltipBg, borderColor: 'rgba(16,185,129,0.3)', borderWidth: 1, padding: [8, 12],
        textStyle: { color: tooltipTxt, fontFamily: '"JetBrains Mono", monospace', fontSize: 11 },
        formatter: (p: any) => p[0].value == null ? '' : `<b style="color:#10B981;font-size:13px">${p[0].value} ${unit}</b><br/><span style="opacity:0.6;font-size:10px">⏱ ${p[0].axisValue}</span>`,
      },
      xAxis: {
        type: 'category', data: labels, boundaryGap: false,
        axisLine: { lineStyle: { color: axisColor } }, axisTick: { show: false },
        axisLabel: { color: labelColor, fontSize: 9, fontFamily: '"JetBrains Mono", monospace', interval: Math.max(0, Math.floor(labels.length / 6) - 1) },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: yMin !== undefined ? yMin : (minV - pad),
        max: yMax !== undefined ? yMax : (maxV + pad),
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: labelColor, fontSize: 9, fontFamily: '"JetBrains Mono", monospace' },
        splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
      },
      series: [{
        type: 'line', data: vals, smooth: 0.3,
        symbol: 'circle', symbolSize: (v: number|null) => v != null && labels.length <= 24 ? 4 : 0,
        showSymbol: labels.length <= 24,
        lineStyle: { color: '#10B981', width: 2 },
        itemStyle: { color: '#10B981', borderColor: dark ? '#1A2E1F' : '#fff', borderWidth: 1 },
        areaStyle: { color: { type: 'linear', x:0, y:0, x2:0, y2:1, colorStops: [{ offset:0, color:'rgba(16,185,129,0.2)' },{ offset:1, color:'rgba(16,185,129,0)' }] } },
        markPoint: {
          symbol: 'pin', symbolSize: 28,
          data: [
            { type: 'max', itemStyle: { color: '#10B981' }, label: { color: '#fff', fontSize: 9, fontFamily: 'monospace', formatter: (p: any) => `${p.value}` } },
            { type: 'min', itemStyle: { color: '#059669' }, label: { color: '#fff', fontSize: 9, fontFamily: 'monospace', formatter: (p: any) => `${p.value}` } },
          ],
        },
      }],
    }
  }

  return (
    <Box>
      <Paper sx={{ px: 2, py: 1.5, mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.7 }}>
          <Typography sx={{ fontSize: '0.67rem', color: textSec, fontFamily: '"JetBrains Mono", monospace' }}>
            Prochaine acquisition dans :
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#10B981', fontFamily: '"JetBrains Mono", monospace' }}>
            {minLeft} min
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.6rem', color: textSec, mt: 0.5, fontFamily: '"JetBrains Mono", monospace' }}>
          {history.length} points en base · Dernière valeur : {acqTime}
        </Typography>
      </Paper>

      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {METRICS.map((m) => {
          const value = latest ? ((latest as any)[m.key] as number) : null
          return (
            <Grid item xs={12} sm={6} md={4} key={m.key}>
              <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.65rem', color: textSec, mb: 0.3 }}>
                    {m.label}
                  </Typography>
                  {loading || value === null
                    ? <Skeleton height={30} width={80} sx={{ bgcolor: dark ? 'rgba(16,185,129,0.05)' : 'rgba(0,0,0,0.05)' }} />
                    : <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.4 }}>
                        <Typography sx={{ color: '#10B981', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.6rem', lineHeight: 1 }}>
                          {value.toFixed(1)}
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: textSec }}>{m.unit}</Typography>
                      </Box>
                  }
                </Box>
              </Paper>
            </Grid>
          )
        })}
      </Grid>

      <Grid container spacing={2}>
        {METRICS.map((m) => (
          <Grid item xs={12} md={6} key={m.key}>
            <Paper sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', fontFamily: '"JetBrains Mono", monospace' }}>
                  {m.label}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.6 }}>
                  <Chip label={`${history.length} pts`} size="small" sx={{ height: 17, fontSize: '0.58rem', bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }} />
                  <Chip label="1/15 min" size="small" sx={{ height: 17, fontSize: '0.58rem', bgcolor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: textSec }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.4, mb: 1.2 }}>
                {loading || !latest
                  ? <Skeleton width={90} height={32} sx={{ bgcolor: dark ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.04)' }} />
                  : <>
                      <Typography sx={{ color: '#10B981', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.7rem', lineHeight: 1 }}>
                        {(((latest as any)[m.key] as number) ?? 0).toFixed(1)}
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: textSec }}>{m.unit}</Typography>
                      <Typography sx={{ fontSize: '0.6rem', color: textSec, ml: 0.5, fontFamily: '"JetBrains Mono", monospace' }}>· valeur actuelle</Typography>
                    </>
                }
              </Box>
              {loading
                ? <Skeleton variant="rounded" height={200} sx={{ bgcolor: dark ? 'rgba(16,185,129,0.04)' : 'rgba(0,0,0,0.04)' }} />
                : history.length === 0
                  ? <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography sx={{ color: textSec, fontSize: '0.8rem' }}>Aucune donnée</Typography></Box>
                  : <ReactECharts option={buildChart(m)} style={{ height: 200 }} opts={{ renderer: 'canvas' }} />
              }
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
