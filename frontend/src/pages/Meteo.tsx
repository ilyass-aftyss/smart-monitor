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
  const textSec    = '#6B7280'
  const tooltipBg  = dark ? '#1A2E1F' : '#FFFFFF'
  const tooltipTxt = dark ? '#F0FDF4' : '#1A2E1A'
  const axisColor  = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const gridColor  = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'
  const labelColor = '#6B7280'

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

  function buildLineChart(key: keyof WeatherData['hourly'], color: string, unit: string, yMin?: number, yMax?: number) {
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
        type: 'line', data: vals, smooth: 0.3,
        symbol: 'circle', symbolSize: 3,
        showSymbol: false,
        lineStyle: { color, width: 2 },
        itemStyle: { color, borderColor: dark ? '#1A2E1F' : '#fff', borderWidth: 1 },
        areaStyle: { color: { type: 'linear', x:0, y:0, x2:0, y2:1, colorStops: [{ offset:0, color:'rgba(16,185,129,0.2)' },{ offset:1, color:'rgba(16,185,129,0)' }] } },
      }],
    }
  }

  function buildWindChart() {
    if (!data) return {}
    const labels = data.hourly.time.map(t => formatTime(t))
    const speed = data.hourly.wind_speed_10m as (number | null)[]
    const gusts = data.hourly.wind_gusts_10m as (number | null)[]
    const allVals = [...speed.filter(v => v !== null), ...gusts.filter(v => v !== null)] as number[]
    const maxV = allVals.length ? Math.max(...allVals) : 10
    const pad = 2

    return {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 300,
      grid: { top: 24, right: 16, bottom: 36, left: 52 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: tooltipBg, borderColor: 'rgba(16,185,129,0.3)', borderWidth: 1, padding: [8, 12],
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
          name: 'Vent', type: 'line', data: speed, smooth: 0.3,
          symbol: 'none',
          lineStyle: { color: '#10B981', width: 2 },
          itemStyle: { color: '#10B981' },
          areaStyle: { color: { type: 'linear', x:0, y:0, x2:0, y2:1, colorStops: [{ offset:0, color:'rgba(16,185,129,0.2)' },{ offset:1, color:'rgba(16,185,129,0)' }] } },
        },
        {
          name: 'Rafales', type: 'line', data: gusts, smooth: 0.3,
          symbol: 'none',
          lineStyle: { color: '#059669', width: 1.5, type: 'dashed' },
          itemStyle: { color: '#059669' },
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
              [0.3, '#F59E0B'],
              [0.6, '#34D399'],
              [0.8, '#10B981'],
              [1, '#059669'],
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
            fill: dark ? '#F0FDF4' : '#1A2E1A',
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

  const paperSx = {
    p: 2.5,
    height: '100%',
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Météo</Typography>
          <Typography variant="body2" sx={{ color: textSec, mt: 0.3, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MapPin size={13} /> Station météo professionnelle · Open-Meteo
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {lastUpdate && (
            <Chip
              label={`Dernière mise à jour : ${lastUpdate.toLocaleTimeString('fr-FR')}`}
              size="small"
              sx={{ bgcolor: 'rgba(16,185,129,0.07)', color: textSec,
                border: '1px solid rgba(16,185,129,0.15)', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.67rem' }}
            />
          )}
          <Tooltip title="Rafraîchir">
            <IconButton onClick={fetchData} size="small" sx={{ color: textSec, '&:hover': { color: '#10B981' } }}>
              <RefreshCw size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 2.5, border: '1px solid rgba(239,68,68,0.4)' }}>
          <Typography sx={{ color: '#EF4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AlertTriangle size={16} /> {error}
          </Typography>
        </Paper>
      )}

      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={3} md={1.5}>
          <Paper sx={{ p: 1.5, textAlign: 'center' }}>
            <Thermometer size={16} style={{ color: '#10B981', marginBottom: 4 }} />
            <Typography sx={{ fontSize: '0.55rem', color: textSec, mb: 0.3 }}>Température</Typography>
            {loading ? <Skeleton height={28} width={60} sx={{ mx: 'auto', bgcolor: dark ? 'rgba(16,185,129,0.05)' : 'rgba(0,0,0,0.05)' }} />
              : <Typography sx={{ color: '#10B981', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.4rem', lineHeight: 1.2 }}>
                  {now?.temperature_2m.toFixed(1)}°C
                </Typography>}
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3} md={1.5}>
          <Paper sx={{ p: 1.5, textAlign: 'center' }}>
            <Droplets size={16} style={{ color: '#10B981', marginBottom: 4 }} />
            <Typography sx={{ fontSize: '0.55rem', color: textSec, mb: 0.3 }}>Humidité</Typography>
            {loading ? <Skeleton height={28} width={60} sx={{ mx: 'auto', bgcolor: dark ? 'rgba(16,185,129,0.05)' : 'rgba(0,0,0,0.05)' }} />
              : <Typography sx={{ color: '#10B981', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.4rem', lineHeight: 1.2 }}>
                  {now?.relative_humidity_2m.toFixed(0)}%
                </Typography>}
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3} md={1.5}>
          <Paper sx={{ p: 1.5, textAlign: 'center' }}>
            <Wind size={16} style={{ color: '#10B981', marginBottom: 4 }} />
            <Typography sx={{ fontSize: '0.55rem', color: textSec, mb: 0.3 }}>Vent</Typography>
            {loading ? <Skeleton height={28} width={60} sx={{ mx: 'auto', bgcolor: dark ? 'rgba(16,185,129,0.05)' : 'rgba(0,0,0,0.05)' }} />
              : <Typography sx={{ color: '#10B981', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.4rem', lineHeight: 1.2 }}>
                  {now?.wind_speed_10m.toFixed(1)}
                </Typography>}
            <Typography sx={{ fontSize: '0.6rem', color: textSec }}>km/h · {now ? degToCompass(now.wind_direction_10m) : '—'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3} md={1.5}>
          <Paper sx={{ p: 1.5, textAlign: 'center' }}>
            <Cloud size={16} style={{ color: '#10B981', marginBottom: 4 }} />
            <Typography sx={{ fontSize: '0.55rem', color: textSec, mb: 0.3 }}>État</Typography>
            {loading ? <Skeleton height={28} width={60} sx={{ mx: 'auto', bgcolor: dark ? 'rgba(16,185,129,0.05)' : 'rgba(0,0,0,0.05)' }} />
              : <Typography sx={{ fontSize: '1.6rem', lineHeight: 1.2 }}>{curWeather?.icon}</Typography>}
            {curWeather && <Typography sx={{ fontSize: '0.6rem', color: textSec, mt: 0.2 }}>{curWeather.label}</Typography>}
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3} md={1.5}>
          <Paper sx={{ p: 1.5, textAlign: 'center' }}>
            <Droplets size={16} style={{ color: '#10B981', marginBottom: 4 }} />
            <Typography sx={{ fontSize: '0.55rem', color: textSec, mb: 0.3 }}>Risque pluie</Typography>
            {loading ? <Skeleton height={28} width={60} sx={{ mx: 'auto', bgcolor: dark ? 'rgba(16,185,129,0.05)' : 'rgba(0,0,0,0.05)' }} />
              : <Typography sx={{ color: '#10B981', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.4rem', lineHeight: 1.2 }}>
                  {data?.hourly.precipitation_probability[0]?.toFixed(0) ?? '0'}%
                </Typography>}
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3} md={1.5}>
          <Paper sx={{ p: 1.5, textAlign: 'center' }}>
            <Sun size={16} style={{ color: '#10B981', marginBottom: 4 }} />
            <Typography sx={{ fontSize: '0.55rem', color: textSec, mb: 0.3 }}>Rayonnement</Typography>
            {loading ? <Skeleton height={28} width={60} sx={{ mx: 'auto', bgcolor: dark ? 'rgba(16,185,129,0.05)' : 'rgba(0,0,0,0.05)' }} />
              : <Typography sx={{ color: '#10B981', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.4rem', lineHeight: 1.2 }}>
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
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={paperSx}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', fontFamily: '"JetBrains Mono", monospace' }}>
                    <Thermometer size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Température (24h)
                  </Typography>
                  <Chip label={`${now?.temperature_2m.toFixed(1)}°C actuel`} size="small" sx={{ height: 18, fontSize: '0.58rem', bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }} />
                </Box>
                <ReactECharts option={buildLineChart('temperature_2m', '#10B981', '°C')} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={paperSx}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', fontFamily: '"JetBrains Mono", monospace' }}>
                    <Droplets size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Probabilité de pluie
                  </Typography>
                  <Chip label="24h" size="small" sx={{ height: 18, fontSize: '0.58rem', bgcolor: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }} />
                </Box>
                <ReactECharts option={buildLineChart('precipitation_probability', '#059669', '%', 0)} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={paperSx}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', fontFamily: '"JetBrains Mono", monospace' }}>
                    <Wind size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Vent & Rafales
                  </Typography>
                  <Chip label={`${now?.wind_speed_10m.toFixed(1)} km/h`} size="small" sx={{ height: 18, fontSize: '0.58rem', bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }} />
                </Box>
                <ReactECharts option={buildWindChart()} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={paperSx}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', fontFamily: '"JetBrains Mono", monospace' }}>
                    <Sun size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Rayonnement Solaire
                  </Typography>
                  <Chip label="W/m²" size="small" sx={{ height: 18, fontSize: '0.58rem', bgcolor: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }} />
                </Box>
                <ReactECharts option={buildLineChart('shortwave_radiation', '#059669', 'W/m²', 0)} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={paperSx}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', fontFamily: '"JetBrains Mono", monospace', mb: 1 }}>
                  <Droplets size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Humidité
                </Typography>
                <ReactECharts option={buildHumidityGauge()} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={paperSx}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', fontFamily: '"JetBrains Mono", monospace' }}>
                    <Cloud size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Couverture Nuageuse
                  </Typography>
                  <Chip label={`${now?.cloud_cover.toFixed(0) ?? '—'}%`} size="small" sx={{ height: 18, fontSize: '0.58rem', bgcolor: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }} />
                </Box>
                <ReactECharts option={buildLineChart('cloud_cover', '#059669', '%')} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={paperSx}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#34D399', fontFamily: '"JetBrains Mono", monospace' }}>
                    <Gauge size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Pression Atm.
                  </Typography>
                  <Chip label="hPa" size="small" sx={{ height: 18, fontSize: '0.58rem', bgcolor: 'rgba(52,211,153,0.1)', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }} />
                </Box>
                <Box sx={{ textAlign: 'center', py: 1 }}>
                  <Typography sx={{ color: '#34D399', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '2rem', lineHeight: 1 }}>
                    {now?.pressure_msl.toFixed(1)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: textSec, mb: 1 }}>hPa</Typography>
                  <ReactECharts option={buildLineChart('pressure_msl', '#34D399', 'hPa')} style={{ height: 120 }} opts={{ renderer: 'canvas' }} />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 2.5, mb: 2 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', fontFamily: '"JetBrains Mono", monospace', mb: 2 }}>
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
                      border: i === 0 ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(16,185,129,0.06)',
                      bgcolor: i === 0 ? 'rgba(16,185,129,0.04)' : 'transparent',
                    }}>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: i === 0 ? '#10B981' : textSec, mb: 0.5 }}>
                        {i === 0 ? "Aujourd'hui" : formatDay(d)}
                      </Typography>
                      <Typography sx={{ fontSize: '1.3rem', lineHeight: 1.2 }}>{wi.icon}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: dark ? '#F0FDF4' : '#1A2E1A', fontFamily: '"JetBrains Mono", monospace', mt: 0.3 }}>
                        {tMax?.toFixed(0) ?? '—'}° / {tMin?.toFixed(0) ?? '—'}°
                      </Typography>
                      {prec != null && prec > 0 && (
                        <Typography sx={{ fontSize: '0.55rem', color: '#059669', fontFamily: '"JetBrains Mono", monospace', mt: 0.2 }}>
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
