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

export default function LiveChart({ data, metric, color, unit, optLow, optHigh }: LiveChartProps) {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'

  const axisColor   = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const labelColor  = '#6B7280'
  const gridColor   = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'
  const tooltipBg   = dark ? '#1A2E1F' : '#FFFFFF'
  const tooltipText = dark ? '#F0FDF4' : '#1A2E1A'

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
  const pad  = (maxV - minV) * 0.18 || 1

  const yMin = Math.floor(minV - pad)
  const yMax = Math.ceil(maxV + pad)

  const option = {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 300,
    grid: { top: 12, right: 10, bottom: 32, left: 48 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: 'rgba(16,185,129,0.3)',
      borderWidth: 1,
      padding: [9, 14],
      textStyle: { color: tooltipText, fontFamily: '"JetBrains Mono", monospace', fontSize: 11 },
      formatter: (params: any) => {
        const p = params[0]
        if (p.value === null || p.value === undefined) return ''
        return `<span style="color:#10B981;font-weight:700;font-size:14px">${p.value} <span style="font-size:11px;opacity:0.7">${unit}</span></span><br/><span style="opacity:0.45;font-size:10px">${p.axisValue}</span>`
      },
    },
    xAxis: {
      type: 'category',
      data: timestamps,
      boundaryGap: false,
      axisLine:  { lineStyle: { color: axisColor } },
      axisTick:  { show: false },
      axisLabel: {
        color: labelColor, fontSize: 9,
        fontFamily: '"JetBrains Mono", monospace',
        interval: Math.max(0, Math.floor(timestamps.length / 5) - 1),
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: yMin, max: yMax,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: labelColor, fontSize: 9, fontFamily: '"JetBrains Mono", monospace' },
      splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
    },
    series: [{
      type: 'line',
      data: values,
      smooth: 0.3,
      symbol: 'circle',
      symbolSize: (v: number | null) => (v !== null && timestamps.length <= 40) ? 4 : 0,
      showSymbol: timestamps.length <= 40,
      lineStyle: { color: '#10B981', width: 2 },
      itemStyle: { color: '#10B981' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(16,185,129,0.2)' },
            { offset: 1, color: 'rgba(16,185,129,0)' },
          ],
        },
      },
      markArea: (optLow !== undefined && optHigh !== undefined) ? {
        silent: true,
        itemStyle: { color: 'rgba(16,185,129,0.06)', borderWidth: 0 },
        data: [[
          { yAxis: optLow, label: { show: false } },
          { yAxis: optHigh },
        ]],
      } : undefined,
      markLine: allVals.length ? {
        silent: true,
        symbol: ['none', 'none'],
        lineStyle: { color: 'rgba(16,185,129,0.3)', type: 'dashed', width: 1 },
        label: { show: false },
        data: [{ type: 'average' }],
      } : undefined,
    }],
  }

  return <ReactECharts option={option} style={{ height: 180 }} opts={{ renderer: 'canvas' }} />
}
