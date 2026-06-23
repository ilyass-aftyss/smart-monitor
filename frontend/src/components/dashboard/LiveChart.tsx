import ReactECharts from 'echarts-for-react'
import type { InternalData } from '../../types'
import { useThemeMode } from '../../context/ThemeContext'

interface LiveChartProps {
  data: InternalData[]
  metric: keyof InternalData
  label: string
  color: string
  unit: string
  optLow?: number
  optHigh?: number
}

export default function LiveChart({ data, metric, label, color, unit, optLow, optHigh }: LiveChartProps) {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'

  const axisColor    = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
  const labelColor   = dark ? '#8aaccc' : '#5a7090'
  const gridColor    = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'
  const tooltipBg    = dark ? '#0a1628' : '#ffffff'
  const tooltipBorder = dark ? `${color}55` : `${color}88`
  const tooltipText  = dark ? '#e2ecf8' : '#1a2540'

  const timestamps = data.map((d) =>
    new Date(d.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  )
  const values = data.map((d) => {
    const v = d[metric]
    return typeof v === 'number' ? parseFloat(v.toFixed(2)) : null
  })

  const allVals = values.filter((v) => v !== null) as number[]
  const minV = allVals.length ? Math.min(...allVals) : 0
  const maxV = allVals.length ? Math.max(...allVals) : 100
  const pad  = (maxV - minV) * 0.15 || 1

  const markArea = (optLow !== undefined && optHigh !== undefined) ? {
    silent: true,
    itemStyle: { color: `${color}12`, borderWidth: 0 },
    data: [[{ yAxis: optLow }, { yAxis: optHigh }]],
  } : undefined

  const option = {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 400,
    grid: { top: 16, right: 12, bottom: 36, left: 50 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: tooltipText, fontFamily: '"JetBrains Mono", monospace', fontSize: 11 },
      formatter: (params: any) => {
        const p = params[0]
        return `<span style="color:${color};font-weight:700;font-size:13px">${p.value ?? '–'} ${unit}</span><br/><span style="opacity:0.6;font-size:10px">${p.axisValue}</span>`
      },
    },
    xAxis: {
      type: 'category',
      data: timestamps,
      boundaryGap: false,
      axisLine:  { lineStyle: { color: axisColor } },
      axisTick:  { show: false },
      axisLabel: { color: labelColor, fontSize: 9, fontFamily: '"JetBrains Mono", monospace', interval: Math.max(0, Math.floor(timestamps.length / 5) - 1) },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: minV - pad,
      max: maxV + pad,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: labelColor, fontSize: 9, fontFamily: '"JetBrains Mono", monospace' },
      splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
    },
    series: [{
      type: 'line',
      data: values,
      smooth: 0.35,
      symbol: 'circle',
      symbolSize: (v: number | null) => (v !== null && timestamps.length <= 30) ? 4 : 0,
      showSymbol: timestamps.length <= 30,
      lineStyle:  { color, width: 2, shadowColor: `${color}55`, shadowBlur: 6 },
      itemStyle:  { color, borderColor: dark ? '#0a1628' : '#fff', borderWidth: 2 },
      areaStyle:  {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: `${color}40` }, { offset: 1, color: `${color}00` }],
        },
      },
      markArea,
      markLine: {
        silent: true,
        symbol: ['none', 'none'],
        lineStyle: { color: `${color}55`, type: 'dashed', width: 1 },
        data: allVals.length ? [
          [{ coord: [0, Math.max(...allVals)], label: { show: false } }, { coord: [timestamps.length - 1, Math.max(...allVals)] }],
        ] : [],
      },
    }],
  }

  return <ReactECharts option={option} style={{ height: 170 }} opts={{ renderer: 'canvas' }} />
}
