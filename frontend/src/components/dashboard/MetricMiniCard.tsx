import { motion } from 'framer-motion'

function ArrowUpRight({ color = '#9EAAB5' }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M7 17L17 7M17 7H7M17 7v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

interface MetricMiniCardProps {
  label: string
  value: string | number
  unit: string
  icon: React.ReactNode
  color?: string
  delay?: number
}

export default function MetricMiniCard({
  label, value, unit, icon, color = '#729C51', delay = 0
}: MetricMiniCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.025, boxShadow: `0 8px 32px rgba(0,0,0,0.10)` }}
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '14px 16px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.055)',
        border: '1px solid rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        cursor: 'default',
        transition: 'box-shadow 0.25s',
      }}
    >
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8,
          background: `rgba(${hexToRgb(color)},0.10)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7A8D', flex: 1 }}>{label}</span>
      </div>

      {/* Value + arrow */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#0A0909', letterSpacing: '-0.02em' }}>
            {value}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#9EAAB5' }}>{unit}</span>
        </div>
        <ArrowUpRight color="#BFCBD6" />
      </div>
    </motion.div>
  )
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
