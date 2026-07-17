import { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Typography, Paper, Grid, Chip, Skeleton, IconButton, Tooltip } from '@mui/material'
import ReactECharts from 'echarts-for-react'
import { fetchWeatherApi } from 'openmeteo'
import { useThemeMode } from '../context/ThemeContext'
import { AlertTriangle, Droplets, Thermometer, Wind, Sun, Cloud, Gauge, RefreshCw, MapPin } from 'lucide-react'

const LAT = 34.261
const LON = -6.5802

const WMO_CODES: Record<number, { label: string; icon: string }> = {
  0:  { label: 'Ciel dégagé',       icon: '☀️' },
  1:  { label: 'Principalement clair', icon: '🌤' },
  2:  { label: 'Partiellement nuageux', icon: '⛅' },
  3:  { label: 'Couvert',            icon: '☁️' },
  45: { label: 'Brouillard',         icon: '🌫' },
  48: { label: 'Brouillard givrant', icon: '🌫' },
  51: { label: 'Bruine légère',      icon: '🌦' },
  53: { label: 'Bruine modérée',     icon: '🌦' },
  55: { label: 'Bruine dense',       icon: '🌧' },
  61: { label: 'Pluie légère',       icon: '🌧' },
  63: { label: 'Pluie modérée',      icon: '🌧' },
  65: { label: 'Pluie forte',        icon: '🌧' },
  71: { label: 'Neige légère',       icon: '🌨' },
  73: { label: 'Neige modérée',      icon: '🌨' },
  75: { label: 'Neige forte',        icon: '❄️' },
  80: { label: 'Averses légères',    icon: '🌦' },
  81: { label: 'Averses modérées',   icon: '🌧' },
  82: { label: 'Averses violentes',  icon: '🌧' },
  95: { label: 'Orage',              icon: '⛈' },
  96: { label: 'Orage + grêle légère', icon: '⛈' },
  99: { label: 'Orage + grêle forte',  icon: '⛈' },
}

function wmoInfo(code: number | undefined): { label: string; icon: string } {
  return WMO_CODES[code ?? 999] ?? { label: 'Inconnu', icon: '❓' }
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDay(d: Date): string {
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function degToCompass(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO']
  return dirs[Math.round(deg / 22.5) % 16]
}

interface WeatherData {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    wind_speed_10m: number
    wind_direction_10m: number
    wind_gusts_10m: number
    cloud_cover: number
    weather_code: number
    pressure_msl: number
    is_day: number
  }
  hourly: {
    time: Date[]
    temperature_2m: (number | null)[]
    relative_humidity_2m: (number | null)[]
    precipitation_probability: (number | null)[]
    precipitation: (number | null)[]
    wind_speed_10m: (number | null)[]
    wind_gusts_10m: (number | null)[]
    cloud_cover: (number | null)[]
    shortwave_radiation: (number | null)[]
    pressure_msl: (number | null)[]
    weather_code: (number | null)[]
  }
  daily: {
    time: Date[]
    temperature_2m_max: (number | null)[]
    temperature_2m_min: (number | null)[]
    sunrise: (number | null)[]
    sunset: (number | null)[]
    uv_index_max: (number | null)[]
    precipitation_sum: (number | null)[]
    wind_speed_10m_max: (number | null)[]
    weather_code: (number | null)[]
  }
}

export default function MeteoPage() {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const textSec    = dark ? '#8aaccc' : '#5a7090'
  const tooltipBg  = dark ? '#0a1628' : '#ffffff'
  const tooltipTxt = dark ? '#e2ecf8' : '#1a2540'
  const axisColor  = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const gridColor  = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'
  const labelColor = dark ? '#8aaccc' : '#5a7090'

  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        latitude: LAT,
        longitude: LON,
        current: ['temperature_2m', 'relative_humidity_2m', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'cloud_cover', 'weather_code', 'pressure_msl', 'is_day'],
        hourly: ['temperature_2m', 'relative_humidity_2m', 'precipitation_probability', 'precipitation', 'wind_speed_10m', 'wind_gusts_10m', 'cloud_cover', 'shortwave_radiation', 'pressure_msl', 'weather_code'],
        daily: ['temperature_2m_max', 'temperature_2m_min', 'sunrise', 'sunset', 'uv_index_max', 'precipitation_sum', 'wind_speed_10m_max', 'weather_code'],
        timezone: 'Africa/Casablanca',
        forecast_days: 7,
      }
      const url = 'https://api.open-meteo.com/v1/forecast'
      const responses = await fetchWeatherApi(url, params)
      const response = responses[0]
      const utcOffsetSeconds = response.utcOffsetSeconds()

      const current = response.current()
      const hourly = response.hourly()
      const daily = response.daily()

      if (!current || !hourly || !daily) {
        throw new Error('Données météo non disponibles (section manquante dans la réponse)')
      }

      const hourlyTime = Array.from(
        { length: (Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval() },
        (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
      )
      const dailyTime = Array.from(
        { length: (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval() },
        (_, i) => new Date((Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000)
      )

      const toArr = (vt: typeof hourly, i: number): (number | null)[] => {
        const v = vt.variables(i)
        if (!v) return []
        const arr = v.valuesArray()
        if (!arr) return []
        return Array.from(arr).map(x => (x === null || x === undefined || isNaN(x)) ? null : x)
      }

      const cv = (i: number) => current.variables(i)?.value() ?? 0

      setData({
        current: {
          temperature_2m: cv(0),
          relative_humidity_2m: cv(1),
          wind_speed_10m: cv(2),
          wind_direction_10m: cv(3),
          wind_gusts_10m: cv(4),
          cloud_cover: cv(5),
          weather_code: cv(6),
          pressure_msl: cv(7),
          is_day: cv(8),
        },
        hourly: {
          time: hourlyTime,
          temperature_2m: toArr(hourly, 0),
          relative_humidity_2m: toArr(hourly, 1),
          precipitation_probability: toArr(hourly, 2),
          precipitation: toArr(hourly, 3),
          wind_speed_10m: toArr(hourly, 4),
          wind_gusts_10m: toArr(hourly, 5),
          cloud_cover: toArr(hourly, 6),
          shortwave_radiation: toArr(hourly, 7),
          pressure_msl: toArr(hourly, 8),
          weather_code: toArr(hourly, 9),
        },
        daily: {
          time: dailyTime,
          temperature_2m_max: toArr(daily, 0),
          temperature_2m_min: toArr(daily, 1),
          sunrise: toArr(daily, 2),
          sunset: toArr(daily, 3),
          uv_index_max: toArr(daily, 4),
          precipitation_sum: toArr(daily, 5),
          wind_speed_10m_max: toArr(daily, 6),
          weather_code: toArr(daily, 7),
        },
      })
      setLastUpdate(new Date())
    } catch (e: any) {
      console.error('Open-Meteo fetch error:', e)
      setError(e?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const now = data?.current
  const curWeather = now ? wmoInfo(now.weather_code) : null

  function tempColor(v: number): string { if (v >= 35) return '#ef4444'; if (v >= 28) return '#f97316'; if (v >= 20) return '#f59e0b'; if (v >= 10) return '#3b82f6'; return '#06b6d4' }
  function humColor(v: number): string { if (v >= 80) return '#06b6d4'; if (v >= 60) return '#3b82f6'; if (v >= 40) return '#8b5cf6'; return '#f97316' }

  function buildLineChart(key: keyof WeatherData['hourly'], color: string, unit: string, label: string, yMin?: number, yMax?: number) {
    if (!data) return {}
    const vals = data.hourly[key] as (number | null)[]
    const labels = data.hourly.time.map(t => formatTime(t))
    const allVals = vals.filter(v => v !== null) as number[]
    const minV = allVals.length ? Math.min(...allVals) : 0
    const maxV = allVals.length ? Math.max(...allVals) : 100
    const pad = (maxV - minV) * 0.15 || 1

    return {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 500,
      grid: { top: 20, right: 16, bottom: 36, left: 52 },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          snap: true,
          z: 100,
          label: { show: true, backgroundColor: color, color: '#fff', fontSize: 9 },
          lineStyle: { color, width: 1, type: 'dashed', opacity: 0.5 },
        },
        backgroundColor: tooltipBg, borderColor: `${color}55`, borderWidth: 1, padding: [8, 12],
        textStyle: { color: tooltipTxt, fontFamily: '"JetBrains Mono", monospace', fontSize: 11 },
        formatter: (p: any) => p[0].value == null ? '' : `<b style="color:${color};font-size:13px">${p[0].value} ${unit}</b><br/><span style="opacity:0.6;font-size:10px">⏱ ${p[0].axisValue}</span>`,
      },
      xAxis: {
        type: 'category', data: labels, boundaryGap: false,
        axisLine: { lineStyle: { color: axisColor } }, axisTick: { show: false },
        axisLabel: { color: labelColor, fontSize: 9, fontFamily: '"JetBrains Mono", monospace', interval: Math.max(0, Math.floor(labels.length / 8) - 1) },
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
        symbol: 'circle', symbolSize: 3,
        showSymbol: false,
        lineStyle: { color, width: 2.5, shadowColor: `${color}44`, shadowBlur: 8 },
        itemStyle: { color, borderColor: dark ? '#0a1628' : '#fff', borderWidth: 2 },
        areaStyle: { color: { type: 'linear', x:0, y:0, x2:0, y2:1, colorStops: [{ offset:0, color:`${color}40` },{ offset:1, color:`${color}05` }] } },
      }],
    }
  }

  function buildAreaChart(key: keyof WeatherData['hourly'], color: string, unit: string) {
    return buildLineChart(key, color, unit, '', 0)
  }

  function buildWindChart() {
    if (!data) return {}
    const labels = data.hourly.time.map(t => formatTime(t))
    const speed = data.hourly.wind_speed_10m as (number | null)[]
    const gusts = data.hourly.wind_gusts_10m as (number | null)[]
    const allVals = [...speed.filter(v => v !== null), ...gusts.filter(v => v !== null)] as number[]
    const maxV = allVals.length ? Math.max(...allVals) : 10
    const pad = (maxV - maxV) * 0.15 || 2

    return {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 500,
      grid: { top: 24, right: 16, bottom: 36, left: 52 },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          snap: true,
          z: 100,
          label: { show: true, backgroundColor: '#06b6d4', color: '#fff', fontSize: 9 },
          lineStyle: { color: '#06b6d4', width: 1, type: 'dashed', opacity: 0.5 },
        },
        backgroundColor: tooltipBg, borderColor: '#06b6d455', borderWidth: 1, padding: [8, 12],
        textStyle: { color: tooltipTxt, fontFamily: '"JetBrains Mono", monospace', fontSize: 11 },
        formatter: (p: any) => {
          let html = ''
          p.forEach((s: any) => {
            if (s.value != null) html += `<span style="color:${s.color}">●</span> ${s.seriesName}: <b>${s.value}</b> km/h<br/>`
          })
          html += `<span style="opacity:0.6;font-size:10px">⏱ ${p[0].axisValue}</span>`
          return html
        },
      },
      legend: { data: ['Vent', 'Rafales'], textStyle: { color: labelColor, fontSize: 10 }, top: 0, right: 0 },
      xAxis: {
        type: 'category', data: labels, boundaryGap: false,
        axisLine: { lineStyle: { color: axisColor } }, axisTick: { show: false },
        axisLabel: { color: labelColor, fontSize: 9, fontFamily: '"JetBrains Mono", monospace', interval: Math.max(0, Math.floor(labels.length / 8) - 1) },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value', min: 0, max: maxV + pad + 5,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: labelColor, fontSize: 9, fontFamily: '"JetBrains Mono", monospace' },
        splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
      },
      series: [
        {
          name: 'Vent', type: 'line', data: speed, smooth: 0.4,
          symbol: 'none',
          lineStyle: { color: '#06b6d4', width: 2.5, shadowColor: '#06b6d444', shadowBlur: 8 },
          itemStyle: { color: '#06b6d4' },
          areaStyle: { color: { type: 'linear', x:0, y:0, x2:0, y2:1, colorStops: [{ offset:0, color:'#06b6d440' },{ offset:1, color:'#06b6d405' }] } },
        },
        {
          name: 'Rafales', type: 'line', data: gusts, smooth: 0.3,
          symbol: 'diamond', symbolSize: 4, showSymbol: false,
          lineStyle: { color: '#f97316', width: 1.5, type: 'dashed' },
          itemStyle: { color: '#f97316' },
        },
      ],
    }
  }

  function buildHumidityGauge() {
    const v = now?.relative_humidity_2m ?? 0
    return {
      backgroundColor: 'transparent',
      series: [{
        type: 'gauge',
        center: ['50%', '55%'],
        radius: '80%',
        startAngle: 220,
        endAngle: -40,
        min: 0, max: 100,
        axisLine: {
          lineStyle: {
            width: 12,
            color: [
              [0.3, '#f97316'],
              [0.5, '#8b5cf6'],
              [0.8, '#3b82f6'],
              [1, '#06b6d4'],
            ],
          },
        },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: { show: false },
        data: [{ value: v, name: 'Humidité' }],
      }],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: '32%',
          style: {
            text: `${v.toFixed(0)}%`,
            fill: dark ? '#e2ecf8' : '#1a2540',
            font: 'bold 28px "JetBrains Mono", monospace',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          left: 'center',
          top: '56%',
          style: {
            text: 'Humidité',
            fill: textSec,
            font: '11px Inter, sans-serif',
            textAlign: 'center',
            opacity: 0.7,
          },
        },
      ],
    }
  }

  const paperSx = (color: string) => ({
    p: 2.5,
    border: `1px solid ${color}15`,
    height: '100%',
  })

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Météo</Typography>
          <Typography variant="body2" sx={{ color: textSec, mt: 0.3, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MapPin size={13} /> Station météo professionnelle · Open-Meteo
            <Chip label="Mise à jour en temps réel" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: dark ? 'rgba(0,232,122,0.07)' : 'rgba(16,185,129,0.08)', color: dark ? '#00e87a' : '#10b981', border: `1px solid ${dark ? 'rgba(0,232,122,0.2)' : 'rgba(16,185,129,0.2)'}`, ml: 0.5 }} />
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {lastUpdate && (
            <Chip
              label={`Dernière mise à jour : ${lastUpdate.toLocaleTimeString('fr-FR')}`}
              size="small"
              sx={{ bgcolor: dark ? 'rgba(0,170,255,0.07)' : 'rgba(0,80,160,0.06)', color: textSec,
                border: `1px solid ${dark ? 'rgba(0,170,255,0.15)' : 'rgba(0,80,160,0.1)'}`, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.67rem' }}
            />
          )}
          <Tooltip title="Rafraîchir">
            <IconButton onClick={fetchData} size="small" sx={{ color: textSec, '&:hover': { color: dark ? '#00aaff' : '#0070d4' } }}>
              <RefreshCw size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 2.5, border: '1px solid #ef444440', bgcolor: dark ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.03)' }}>
          <Typography sx={{ color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AlertTriangle size={16} /> {error}
          </Typography>
        </Paper>
      )}

      {/* KPI Cards */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {/* Temperature */}
        <Grid item xs={6} sm={3} md={1.5}>
          <Paper sx={{ p: 1.5, textAlign: 'center', border: `1px solid ${now ? tempColor(now.temperature_2m) : '#888'}20`,
            background: dark ? `linear-gradient(135deg, rgba(10,22,48,0.9), ${now ? tempColor(now.temperature_2m) : '#888'}08)` : `linear-gradient(135deg, #fff, ${now ? tempColor(now.temperature_2m) : '#888'}06)`,
            position: 'relative', overflow: 'hidden',
            '&::before': { content: '""', position: 'absolute', top:0, left:0, width:3, height:'100%', bgcolor: now ? tempColor(now.temperature_2m) : '#888', opacity:0.7 },
          }}>
            <Thermometer size={16} style={{ color: now ? tempColor(now.temperature_2m) : textSec, marginBottom: 4 }} />
            <Typography sx={{ fontSize: '0.55rem', color: textSec, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.3 }}>Température</Typography>
            {loading ? <Skeleton height={28} width={60} sx={{ mx: 'auto', bgcolor: dark ? 'rgba(0,170,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
              : <Typography sx={{ color: now ? tempColor(now.temperature_2m) : textSec, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.4rem', lineHeight: 1.2 }}>
                  {now?.temperature_2m.toFixed(1)}°C
                </Typography>}
          </Paper>
        </Grid>
        {/* Humidity */}
        <Grid item xs={6} sm={3} md={1.5}>
          <Paper sx={{ p: 1.5, textAlign: 'center', border: `1px solid ${now ? humColor(now.relative_humidity_2m) : '#888'}20`,
            background: dark ? `linear-gradient(135deg, rgba(10,22,48,0.9), ${now ? humColor(now.relative_humidity_2m) : '#888'}08)` : `linear-gradient(135deg, #fff, ${now ? humColor(now.relative_humidity_2m) : '#888'}06)`,
            position: 'relative', overflow: 'hidden',
            '&::before': { content: '""', position: 'absolute', top:0, left:0, width:3, height:'100%', bgcolor: now ? humColor(now.relative_humidity_2m) : '#888', opacity:0.7 },
          }}>
            <Droplets size={16} style={{ color: now ? humColor(now.relative_humidity_2m) : textSec, marginBottom: 4 }} />
            <Typography sx={{ fontSize: '0.55rem', color: textSec, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.3 }}>Humidité</Typography>
            {loading ? <Skeleton height={28} width={60} sx={{ mx: 'auto', bgcolor: dark ? 'rgba(0,170,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
              : <Typography sx={{ color: now ? humColor(now.relative_humidity_2m) : textSec, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.4rem', lineHeight: 1.2 }}>
                  {now?.relative_humidity_2m.toFixed(0)}%
                </Typography>}
          </Paper>
        </Grid>
        {/* Wind */}
        <Grid item xs={6} sm={3} md={1.5}>
          <Paper sx={{ p: 1.5, textAlign: 'center', border: '1px solid #06b6d420',
            background: dark ? 'linear-gradient(135deg, rgba(10,22,48,0.9), rgba(6,182,212,0.06))' : 'linear-gradient(135deg, #fff, rgba(6,182,212,0.04))',
            position: 'relative', overflow: 'hidden',
            '&::before': { content: '""', position: 'absolute', top:0, left:0, width:3, height:'100%', bgcolor: '#06b6d4', opacity:0.7 },
          }}>
            <Wind size={16} style={{ color: '#06b6d4', marginBottom: 4 }} />
            <Typography sx={{ fontSize: '0.55rem', color: textSec, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.3 }}>Vent</Typography>
            {loading ? <Skeleton height={28} width={60} sx={{ mx: 'auto', bgcolor: dark ? 'rgba(0,170,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
              : <Typography sx={{ color: '#06b6d4', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.4rem', lineHeight: 1.2 }}>
                  {now?.wind_speed_10m.toFixed(1)}
                </Typography>}
            <Typography sx={{ fontSize: '0.6rem', color: textSec }}>km/h · {now ? degToCompass(now.wind_direction_10m) : '—'}</Typography>
          </Paper>
        </Grid>
        {/* Weather */}
        <Grid item xs={6} sm={3} md={1.5}>
          <Paper sx={{ p: 1.5, textAlign: 'center', border: '1px solid rgba(168,85,247,0.2)',
            background: dark ? 'linear-gradient(135deg, rgba(10,22,48,0.9), rgba(168,85,247,0.06))' : 'linear-gradient(135deg, #fff, rgba(168,85,247,0.04))',
            position: 'relative', overflow: 'hidden',
            '&::before': { content: '""', position: 'absolute', top:0, left:0, width:3, height:'100%', bgcolor: '#a855f7', opacity:0.7 },
          }}>
            <Cloud size={16} style={{ color: '#a855f7', marginBottom: 4 }} />
            <Typography sx={{ fontSize: '0.55rem', color: textSec, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.3 }}>État</Typography>
            {loading ? <Skeleton height={28} width={60} sx={{ mx: 'auto', bgcolor: dark ? 'rgba(0,170,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
              : <Typography sx={{ fontSize: '1.6rem', lineHeight: 1.2 }}>{curWeather?.icon}</Typography>}
            {curWeather && <Typography sx={{ fontSize: '0.6rem', color: textSec, mt: 0.2 }}>{curWeather.label}</Typography>}
          </Paper>
        </Grid>
        {/* Rain Probability */}
        <Grid item xs={6} sm={3} md={1.5}>
          <Paper sx={{ p: 1.5, textAlign: 'center', border: '1px solid #3b82f620',
            background: dark ? 'linear-gradient(135deg, rgba(10,22,48,0.9), rgba(59,130,246,0.06))' : 'linear-gradient(135deg, #fff, rgba(59,130,246,0.04))',
            position: 'relative', overflow: 'hidden',
            '&::before': { content: '""', position: 'absolute', top:0, left:0, width:3, height:'100%', bgcolor: '#3b82f6', opacity:0.7 },
          }}>
            <Droplets size={16} style={{ color: '#3b82f6', marginBottom: 4 }} />
            <Typography sx={{ fontSize: '0.55rem', color: textSec, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.3 }}>Risque pluie</Typography>
            {loading ? <Skeleton height={28} width={60} sx={{ mx: 'auto', bgcolor: dark ? 'rgba(0,170,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
              : <Typography sx={{ color: '#3b82f6', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.4rem', lineHeight: 1.2 }}>
                  {data?.hourly.precipitation_probability[0]?.toFixed(0) ?? '0'}%
                </Typography>}
          </Paper>
        </Grid>
        {/* Solar Radiation */}
        <Grid item xs={6} sm={3} md={1.5}>
          <Paper sx={{ p: 1.5, textAlign: 'center', border: '1px solid #eab30820',
            background: dark ? 'linear-gradient(135deg, rgba(10,22,48,0.9), rgba(234,179,8,0.06))' : 'linear-gradient(135deg, #fff, rgba(234,179,8,0.04))',
            position: 'relative', overflow: 'hidden',
            '&::before': { content: '""', position: 'absolute', top:0, left:0, width:3, height:'100%', bgcolor: '#eab308', opacity:0.7 },
          }}>
            <Sun size={16} style={{ color: '#eab308', marginBottom: 4 }} />
            <Typography sx={{ fontSize: '0.55rem', color: textSec, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.3 }}>Rayonnement</Typography>
            {loading ? <Skeleton height={28} width={60} sx={{ mx: 'auto', bgcolor: dark ? 'rgba(0,170,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
              : <Typography sx={{ color: '#eab308', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.4rem', lineHeight: 1.2 }}>
                  {data?.hourly.shortwave_radiation[0]?.toFixed(0) ?? '0'}
                </Typography>}
            <Typography sx={{ fontSize: '0.6rem', color: textSec }}>W/m²</Typography>
          </Paper>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
          <Typography sx={{ color: textSec, fontSize: '0.85rem', fontFamily: '"JetBrains Mono", monospace' }}>
            Chargement des données météo...
          </Typography>
        </Box>
      ) : !data ? null : (
        <>
          {/* Charts Row 1: Temperature + Rain */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={paperSx('#f59e0b')}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <Thermometer size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Température (24h)
                  </Typography>
                  <Chip label={`${now?.temperature_2m.toFixed(1)}°C actuel`} size="small" sx={{ height: 18, fontSize: '0.58rem', bgcolor: `${'#f59e0b'}10`, color: '#f59e0b', border: `1px solid ${'#f59e0b'}22` }} />
                </Box>
                <ReactECharts option={buildLineChart('temperature_2m', '#f59e0b', '°C', 'Température')} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={paperSx('#3b82f6')}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <Droplets size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Probabilité de pluie
                  </Typography>
                  <Chip label="24h" size="small" sx={{ height: 18, fontSize: '0.58rem', bgcolor: `${'#3b82f6'}10`, color: '#3b82f6', border: `1px solid ${'#3b82f6'}22` }} />
                </Box>
                <ReactECharts option={buildAreaChart('precipitation_probability', '#3b82f6', '%')} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
              </Paper>
            </Grid>
          </Grid>

          {/* Charts Row 2: Wind + Solar Radiation */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={paperSx('#06b6d4')}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#06b6d4', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <Wind size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Vent & Rafales
                  </Typography>
                  <Chip label={`${now?.wind_speed_10m.toFixed(1)} km/h`} size="small" sx={{ height: 18, fontSize: '0.58rem', bgcolor: `${'#06b6d4'}10`, color: '#06b6d4', border: `1px solid ${'#06b6d4'}22` }} />
                </Box>
                <ReactECharts option={buildWindChart()} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={paperSx('#eab308')}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#eab308', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <Sun size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Rayonnement Solaire
                  </Typography>
                  <Chip label="W/m²" size="small" sx={{ height: 18, fontSize: '0.58rem', bgcolor: `${'#eab308'}10`, color: '#eab308', border: `1px solid ${'#eab308'}22` }} />
                </Box>
                <ReactECharts option={buildAreaChart('shortwave_radiation', '#eab308', 'W/m²')} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
              </Paper>
            </Grid>
          </Grid>

          {/* Charts Row 3: Humidity Gauge + Cloud Cover + Pressure */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={paperSx('#3b82f6')}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
                  <Droplets size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Humidité
                </Typography>
                <ReactECharts option={buildHumidityGauge()} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={paperSx('#a855f7')}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#a855f7', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <Cloud size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Couverture Nuageuse
                  </Typography>
                  <Chip label={`${now?.cloud_cover.toFixed(0) ?? '—'}%`} size="small" sx={{ height: 18, fontSize: '0.58rem', bgcolor: `${'#a855f7'}10`, color: '#a855f7', border: `1px solid ${'#a855f7'}22` }} />
                </Box>
                <ReactECharts option={buildAreaChart('cloud_cover', '#a855f7', '%')} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={paperSx('#10b981')}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <Gauge size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Pression Atm.
                  </Typography>
                  <Chip label="hPa" size="small" sx={{ height: 18, fontSize: '0.58rem', bgcolor: `${'#10b981'}10`, color: '#10b981', border: `1px solid ${'#10b981'}22` }} />
                </Box>
                <Box sx={{ textAlign: 'center', py: 1 }}>
                  <Typography sx={{ color: '#10b981', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '2rem', lineHeight: 1 }}>
                    {now?.pressure_msl.toFixed(1)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: textSec, mb: 1 }}>hPa</Typography>
                  <ReactECharts option={buildAreaChart('pressure_msl', '#10b981', 'hPa')} style={{ height: 120 }} opts={{ renderer: 'canvas' }} />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* 7-Day Forecast */}
          <Paper sx={{ p: 2.5, mb: 2, border: '1px solid rgba(168,85,247,0.15)' }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#a855f7', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 2 }}>
              <Sun size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Prévisions 7 Jours
            </Typography>
            <Grid container spacing={1}>
              {data.daily.time.map((d, i) => {
                const wCode = data.daily.weather_code[i]
                const wi = wmoInfo(wCode ?? undefined)
                const tMax = data.daily.temperature_2m_max[i]
                const tMin = data.daily.temperature_2m_min[i]
                const prec = data.daily.precipitation_sum[i]
                const wind = data.daily.wind_speed_10m_max[i]
                return (
                  <Grid item xs={6} sm={3} md={12/7} key={i} sx={{ minWidth: 0 }}>
                    <Paper sx={{
                      p: 1.5, textAlign: 'center',
                      border: i === 0 ? '1px solid rgba(168,85,247,0.3)' : `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                      background: i === 0 ? (dark ? 'rgba(168,85,247,0.06)' : 'rgba(168,85,247,0.04)') : 'transparent',
                    }}>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: i === 0 ? '#a855f7' : textSec, mb: 0.5 }}>
                        {i === 0 ? "Aujourd'hui" : formatDay(d)}
                      </Typography>
                      <Typography sx={{ fontSize: '1.3rem', lineHeight: 1.2 }}>{wi.icon}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: dark ? '#e2ecf8' : '#1a2540', fontFamily: '"JetBrains Mono", monospace', mt: 0.3 }}>
                        {tMax?.toFixed(0) ?? '—'}° / {tMin?.toFixed(0) ?? '—'}°
                      </Typography>
                      {prec != null && prec > 0 && (
                        <Typography sx={{ fontSize: '0.55rem', color: '#3b82f6', fontFamily: '"JetBrains Mono", monospace', mt: 0.2 }}>
                          💧 {prec.toFixed(1)}mm
                        </Typography>
                      )}
                      {wind != null && (
                        <Typography sx={{ fontSize: '0.5rem', color: textSec, mt: 0.2, opacity: 0.6 }}>
                          🌬 {wind.toFixed(0)} km/h
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                )
              })}
            </Grid>
          </Paper>

          {/* Footer Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mt: 1, mb: 1 }}>
            <Typography sx={{ fontSize: '0.6rem', color: textSec, opacity: 0.6, fontFamily: '"JetBrains Mono", monospace' }}>
              Données fournies par Open-Meteo · API gratuite · Modèle GFS/ECMWF
            </Typography>
            <Typography sx={{ fontSize: '0.6rem', color: textSec, opacity: 0.6, fontFamily: '"JetBrains Mono", monospace' }}>
              Coordonnées : {LAT}°N, {LON}°E · {lastUpdate?.toLocaleString('fr-FR') ?? '—'}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  )
}
