import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { motion } from 'framer-motion'

function ArrowUpRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M7 17L17 7M17 7H7M17 7v10" stroke="#9EAAB5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function TrendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M2 17L9 10l4 4 9-9" stroke="#729C51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 8h5v5" stroke="#729C51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const days = ['July 20','July 21','July 22','July 23','July 24','July 25','July 26']
// Two bars per day: background (grey) and highlight (green on peak days)
const vals = [
  [0.42,0.38,0.51,0.46,0.39,0.44,0.48,0.41,0.50,0.43,0.47,0.40,0.49,0.44],
  [0.45,0.40,0.54,0.50,0.41,0.46,0.51,0.43,0.52,0.45,0.50,0.42,0.52,0.46],
  [0.58,0.52,0.65,0.60,0.55,0.62,0.58,0.64,0.70,0.66,0.68,0.63,0.69,0.67],
  [0.70,0.68,0.72,0.66,0.70,0.68,0.70,0.72,0.69,0.71,0.70,0.68,0.70,0.72],
  [0.55,0.52,0.58,0.54,0.56,0.53,0.57,0.55,0.56,0.54,0.57,0.55,0.56,0.54],
  [0.60,0.57,0.63,0.59,0.61,0.58,0.62,0.60,0.61,0.59,0.62,0.60,0.61,0.59],
  [0.65,0.62,0.68,0.64,0.66,0.63,0.67,0.65,0.66,0.64,0.67,0.65,0.66,0.64],
]
const allVals = vals.flat()
const xLabels = days.flatMap(d => Array(14).fill(d))

export default function GrowthRateChart() {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return
    const chart = echarts.init(chartRef.current, undefined, { renderer: 'svg' })

    // Color each bar: green on July 22-23 (peak), grey otherwise
    const colors = xLabels.map((d, i) => {
      const v = allVals[i]
      if (v >= 0.65) return '#729C51'
      if (v >= 0.55) return 'rgba(114,156,81,0.55)'
      return 'rgba(180,195,210,0.5)'
    })

    chart.setOption({
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
      grid: { top: 4, right: 8, bottom: 28, left: 8, containLabel: false },
      xAxis: {
        type: 'category',
        data: days,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontSize: 9.5, color: '#B0BEC5', interval: 0 },
        splitLine: { show: false },
        boundaryGap: true,
      },
      yAxis: {
        type: 'value',
        min: 0, max: 0.85,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: days.map((_, i) => ({
            value: Math.max(...vals[i]),
            itemStyle: {
              color: i === 3 || i === 2 ? '#729C51' :
                     i === 5 || i === 6 ? 'rgba(114,156,81,0.65)' :
                     'rgba(190,205,215,0.65)',
              borderRadius: [3,3,0,0],
            },
          })),
          barWidth: '55%',
        },
      ],
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#fff',
        borderColor: 'rgba(114,156,81,0.2)',
        borderWidth: 1,
        textStyle: { color: '#0A0909', fontSize: 11 },
        formatter: (p: any) => `${days[p[0].dataIndex]}: ${p[0].value.toFixed(2)}`,
      },
    })

    const obs = new ResizeObserver(() => chart.resize())
    obs.observe(chartRef.current)
    return () => { chart.dispose(); obs.disconnect() }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      style={{
        background: '#FFFFFF',
        borderRadius: 18,
        padding: '16px 18px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        height: '100%',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <TrendIcon />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0A0909' }}>Growth Rate</span>
        </div>
        <ArrowUpRight />
      </div>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: '#0A0909', letterSpacing: '-0.02em' }}>0.70</span>
      </div>

      {/* Chart */}
      <div ref={chartRef} style={{ flex: 1, minHeight: 100, width: '100%' }} />
    </motion.div>
  )
}
