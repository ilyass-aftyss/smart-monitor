import { useState, useEffect, useRef } from 'react'
import { Box, Typography, Paper, Grid, Chip, Skeleton, IconButton, Tooltip, LinearProgress } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ReactECharts from 'echarts-for-react'
import { externalApi } from '../services/api'
import { useThemeMode } from '../context/ThemeContext'
import type { ExternalData } from '../types'

const REFRESH_MS = 15 * 60 * 1000

const METRICS = [
  { key: 'radiation' as keyof ExternalData,   label: 'Radiation Solaire',   unit: 'W/m²', color: '#f97316', yMin: 0 },
  { key: 'wind_speed' as keyof ExternalData,  label: 'Vitesse du Vent',     unit: 'm/s',  color: '#06b6d4', yMin: 0 },
  { key: 'humidity' as keyof ExternalData,    label: 'Humidité Extérieure', unit: '%',    color: '#3b82f6', yMin: 0, yMax: 100 },
  { key: 'temperature' as keyof ExternalData, label: 'Température Ext.',    unit: '°C',   color: '#f59e0b' },
]

export default function ExternalPage() {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const textSec    = dark ? '#8aaccc' : '#5a7090'
  const tooltipBg  = dark ? '#0a1628' : '#ffffff'
  const tooltipTxt = dark ? '#e2ecf8' : '#1a2540'
  const axisColor  = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const gridColor  = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'
  const labelColor = dark ? '#8aaccc' : '#5a7090'

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
  const secLeft = Math.floor((countdown % 60000) / 1000)
  const progress = ((REFRESH_MS - countdown) / REFRESH_MS) * 100
  const acqTime = latest ? new Date(latest.timestamp).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'

  function buildChart(cfg: typeof METRICS[0]) {
    const labels = history.map((d) => new Date(d.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    const vals   = history.map((d) => {
      const v = d[cfg.key] as number
      return v != null ? parseFloat(v.toFixed(2)) : null
    })
    const allVals = vals.filter((v) => v !== null) as number[]
    const minV = allVals.length ? Math.min(...allVals) : 0
    const maxV = allVals.length ? Math.max(...allVals) : 100
    const pad  = (maxV - minV) * 0.15 || 1
    const { color, unit, yMin, yMax } = cfg

    return {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 500,
      grid: { top: 20, right: 16, bottom: 36, left: 52 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: tooltipBg, borderColor: `${color}55`, borderWidth: 1, padding: [8, 12],
        textStyle: { color: tooltipTxt, fontFamily: '"JetBrains Mono", monospace', fontSize: 11 },
        formatter: (p: any) => p[0].value == null ? '' : `<b style="color:${color};font-size:13px">${p[0].value} ${unit}</b><br/><span style="opacity:0.6;font-size:10px">⏱ ${p[0].axisValue}</span>`,
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
        type: 'line', data: vals, smooth: 0.4,
        symbol: 'circle', symbolSize: (v: number|null) => v != null && labels.length <= 24 ? 4 : 0,
        showSymbol: labels.length <= 24,
        lineStyle: { color, width: 2.5, shadowColor: `${color}44`, shadowBlur: 8 },
        itemStyle: { color, borderColor: dark ? '#0a1628' : '#fff', borderWidth: 2 },
        areaStyle: { color: { type: 'linear', x:0, y:0, x2:0, y2:1, colorStops: [{ offset:0, color:`${color}40` },{ offset:1, color:`${color}05` }] } },
        markPoint: {
          symbol: 'pin', symbolSize: 30,
          data: [
            { type: 'max', itemStyle: { color: `${color}cc` }, label: { color: '#fff', fontSize: 9, fontFamily: 'monospace', formatter: (p: any) => `${p.value}` } },
            { type: 'min', itemStyle: { color: `${color}77` }, label: { color: '#fff', fontSize: 9, fontFamily: 'monospace', formatter: (p: any) => `${p.value}` } },
          ],
        },
      }],
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Données Externes</Typography>
          <Typography variant="body2" sx={{ color: textSec, mt: 0.3 }}>
            Capteurs météo · acquisition toutes les <b style={{ color: '#f97316' }}>15 minutes</b>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {lastUpdate && (
            <Chip
              label={`Acquisition : ${latest ? new Date(latest.timestamp).toLocaleTimeString('fr-FR') : '—'}`}
              size="small"
              sx={{ bgcolor: dark ? 'rgba(0,232,122,0.07)' : 'rgba(16,185,129,0.08)', color: dark ? '#00e87a' : '#10b981',
                border: `1px solid ${dark ? 'rgba(0,232,122,0.2)' : 'rgba(16,185,129,0.2)'}`, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.67rem' }}
            />
          )}
          <Tooltip title="Rafraîchir maintenant">
            <IconButton onClick={fetchData} size="small"
              sx={{ color: textSec, border: `1px solid ${dark ? 'rgba(0,170,255,0.2)' : 'rgba(0,80,160,0.15)'}`,
                '&:hover': { color: dark ? '#00aaff' : '#0070d4' } }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Countdown */}
      <Paper sx={{ px: 2, py: 1.5, mb: 2.5, border: `1px solid ${dark ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.12)'}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.7 }}>
          <Typography sx={{ fontSize: '0.67rem', color: textSec, fontFamily: '"JetBrains Mono", monospace' }}>
            Prochaine acquisition dans :
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#f97316', fontFamily: '"JetBrains Mono", monospace' }}>
            {minLeft}min {String(secLeft).padStart(2, '0')}s
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress}
          sx={{ height: 3, borderRadius: 2, bgcolor: dark ? 'rgba(249,115,22,0.1)' : 'rgba(249,115,22,0.08)',
            '& .MuiLinearProgress-bar': { bgcolor: '#f97316', borderRadius: 2 } }} />
        <Typography sx={{ fontSize: '0.6rem', color: textSec, mt: 0.5, fontFamily: '"JetBrains Mono", monospace' }}>
          {history.length} points en base · Dernière valeur enregistrée : {acqTime}
        </Typography>
      </Paper>

      {/* Value cards */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {METRICS.map((m) => {
          const value = latest ? (latest[m.key] as number) : null
          return (
            <Grid item xs={12} sm={6} md={3} key={m.key}>
              <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
                border: `1px solid ${m.color}20`,
                background: dark ? `linear-gradient(135deg, rgba(10,22,48,0.9) 0%, ${m.color}08 100%)` : `linear-gradient(135deg, #fff 0%, ${m.color}06 100%)`,
                position: 'relative', overflow: 'hidden',
                '&::before': { content: '""', position: 'absolute', top:0, left:0, width:3, height:'100%', bgcolor: m.color, opacity:0.7 },
              }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.65rem', color: textSec, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.3 }}>
                    {m.label}
                  </Typography>
                  {loading || value === null
                    ? <Skeleton height={30} width={80} sx={{ bgcolor: dark ? 'rgba(0,170,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                    : <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.4 }}>
                        <Typography sx={{ color: m.color, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.6rem', lineHeight: 1, textShadow: dark ? `0 0 16px ${m.color}44` : 'none' }}>
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

      {/* Charts */}
      <Grid container spacing={2}>
        {METRICS.map((m) => (
          <Grid item xs={12} md={6} key={m.key}>
            <Paper sx={{ p: 2.5, border: `1px solid ${m.color}15` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: m.color, fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {m.label}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.6 }}>
                  <Chip label={`${history.length} pts`} size="small" sx={{ height: 17, fontSize: '0.58rem', bgcolor: `${m.color}10`, color: m.color, border: `1px solid ${m.color}22` }} />
                  <Chip label="1/15 min" size="small" sx={{ height: 17, fontSize: '0.58rem', bgcolor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: textSec }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.4, mb: 1.2 }}>
                {loading || !latest
                  ? <Skeleton width={90} height={32} sx={{ bgcolor: dark ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.04)' }} />
                  : <>
                      <Typography sx={{ color: m.color, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.7rem', lineHeight: 1, textShadow: dark ? `0 0 18px ${m.color}44` : 'none' }}>
                        {((latest[m.key] as number) ?? 0).toFixed(1)}
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: textSec }}>{m.unit}</Typography>
                      <Typography sx={{ fontSize: '0.6rem', color: textSec, ml: 0.5, fontFamily: '"JetBrains Mono", monospace' }}>· valeur actuelle</Typography>
                    </>
                }
              </Box>
              {loading
                ? <Skeleton variant="rounded" height={200} sx={{ bgcolor: dark ? 'rgba(0,170,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
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
