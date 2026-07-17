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
function BoltIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z" stroke="#EB5011" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(235,80,17,0.15)"/>
    </svg>
  )
}

const hours = ['07:00','08:00','09:00','10:00','11:00','12:00','01:00']
// lighting (green), other (orange-ish), grey fill
const lighting = [95, 102, 112, 108, 112, 105, 98]
const other    = [18, 20, 20, 22, 20, 18, 20]
const base     = [40, 35, 42, 38, 40, 35, 38]

export default function PowerConsumptionChart() {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return
    const chart = echarts.init(chartRef.current, undefined, { renderer: 'svg' })

    chart.setOption({
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
      grid: { top: 4, right: 4, bottom: 18, left: 4, containLabel: false },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontSize: 9, color: '#B0BEC5', interval: 0 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: base,
          stack: 'total',
          barWidth: '50%',
          itemStyle: { color: 'rgba(180,195,210,0.5)', borderRadius: [0,0,0,0] },
        },
        {
          type: 'bar',
          data: other,
          stack: 'total',
          itemStyle: { color: '#EB5011', opacity: 0.85 },
        },
        {
          type: 'bar',
          data: lighting,
          stack: 'total',
          itemStyle: { color: 'rgba(114,156,81,0.75)', borderRadius: [3,3,0,0] },
        },
      ],
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#fff',
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        textStyle: { color: '#0A0909', fontSize: 11 },
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
      transition={{ duration: 0.4, delay: 0.3 }}
      style={{
        background: '#FFFFFF',
        borderRadius: 18,
        padding: '16px 18px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flex: 1,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(235,80,17,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BoltIcon />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0A0909' }}>Power Consumption</span>
        </div>
        <ArrowUpRight />
      </div>

      {/* Value row */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: '#0A0909', letterSpacing: '-0.02em' }}>144</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#9EAAB5' }}>kWh</span>
        <div style={{ marginLeft: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10.5, color: '#729C51', fontWeight: 600 }}>Lighting: 112 kWh</span>
          <span style={{ fontSize: 10.5, color: '#EB5011', fontWeight: 600 }}>Other: 20 kWh</span>
        </div>
      </div>

      {/* Chart */}
      <div ref={chartRef} style={{ height: 80, width: '100%' }} />
    </motion.div>
  )
}
