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
function DropletIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 3C12 3 5 10.5 5 15a7 7 0 0 0 14 0c0-4.5-7-12-7-12Z" stroke="#729C51" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  )
}

// Dummy bar data simulating water flow (L/h)
const data = [2800, 3100, 3400, 3200, 3541, 3300, 3450, 3541, 3200, 3000, 3400, 3541]

export default function WaterFlowChart() {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return
    const chart = echarts.init(chartRef.current, undefined, { renderer: 'svg' })

    chart.setOption({
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
      grid: { top: 10, right: 4, bottom: 4, left: 4, containLabel: false },
      xAxis: {
        type: 'category',
        data: data.map((_, i) => i),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
        min: 2500,
      },
      series: [
        {
          type: 'bar',
          data,
          barWidth: '55%',
          itemStyle: {
            color: (params: any) => {
              const val = params.value
              if (val >= 3500) return '#729C51'
              if (val >= 3300) return 'rgba(114,156,81,0.7)'
              return 'rgba(114,156,81,0.35)'
            },
            borderRadius: [3, 3, 0, 0],
          },
        },
      ],
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#fff',
        borderColor: 'rgba(114,156,81,0.2)',
        borderWidth: 1,
        textStyle: { color: '#0A0909', fontSize: 11 },
        formatter: (p: any) => `${p[0].value.toLocaleString()} L`,
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
      transition={{ duration: 0.4, delay: 0.2 }}
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
            background: 'rgba(114,156,81,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <DropletIcon />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0A0909' }}>Water Flow</span>
        </div>
        <ArrowUpRight />
      </div>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: '#0A0909', letterSpacing: '-0.02em' }}>6.750</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#9EAAB5' }}>L</span>
      </div>

      {/* Annotation */}
      <div style={{ fontSize: 10.5, color: '#9EAAB5', marginBottom: 2 }}>Soem 3.541</div>

      {/* Chart */}
      <div ref={chartRef} style={{ height: 72, width: '100%' }} />
    </motion.div>
  )
}
