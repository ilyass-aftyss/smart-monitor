import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { motion } from 'framer-motion'
import type { InternalData } from '../../types'

function ArrowUpRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M7 17L17 7M17 7H7M17 7v10" stroke="#9EAAB5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function CO2Icon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="#729C51" strokeWidth="1.8"/>
      <text x="12" y="16" textAnchor="middle" fill="#729C51" fontSize="7" fontWeight="700" fontFamily="monospace">CO₂</text>
    </svg>
  )
}
function PersonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7" r="4" stroke="#9EAAB5" strokeWidth="1.8"/>
      <path d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#9EAAB5" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

// Dummy step-like CO2 data (ppm)
const times = ['','','','','','16:47','','']
const co2Vals = [620, 680, 720, 780, 820, 870, 900, 900]

interface Props {
  liveData?: InternalData | null
}

export default function CO2Chart({ liveData }: Props) {
  const chartRef = useRef<HTMLDivElement>(null)
  const liveValue = liveData?.co2 ?? 900

  useEffect(() => {
    if (!chartRef.current) return
    const chart = echarts.init(chartRef.current, undefined, { renderer: 'svg' })

    chart.setOption({
      animation: true,
      animationDuration: 1000,
      grid: { top: 8, right: 32, bottom: 24, left: 36, containLabel: false },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontSize: 9, color: '#B0BEC5' },
        splitLine: { show: false },
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        min: 400, max: 950,
        interval: 200,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontSize: 9, color: '#B0BEC5', formatter: '{value}' },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.05)', type: 'dashed' } },
      },
      series: [
        {
          type: 'line',
          data: co2Vals,
          step: 'end',
          smooth: false,
          symbol: 'none',
          lineStyle: { color: '#729C51', width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(114,156,81,0.25)' },
              { offset: 1, color: 'rgba(114,156,81,0.02)' },
            ]),
          },
          markPoint: {
            data: [{ type: 'max', symbol: 'circle', symbolSize: 8,
              itemStyle: { color: '#729C51' },
              label: { fontSize: 9, color: '#729C51', offset: [0, -10] } }],
          },
        },
      ],
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#fff',
        borderColor: 'rgba(114,156,81,0.2)',
        borderWidth: 1,
        textStyle: { color: '#0A0909', fontSize: 11 },
        formatter: (p: any) => `${p[0].value} ppm`,
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
      transition={{ duration: 0.4, delay: 0.5 }}
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
          <PersonIcon />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0A0909' }}>Air CO₂</span>
        </div>
        <ArrowUpRight />
      </div>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: '#0A0909', letterSpacing: '-0.02em' }}>
          {liveValue.toLocaleString()}
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#9EAAB5' }}>ppm</span>
      </div>

      {/* Chart */}
      <div ref={chartRef} style={{ flex: 1, minHeight: 100, width: '100%' }} />
    </motion.div>
  )
}
