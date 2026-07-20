import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────
export type CardStatus = 'ok' | 'warning' | 'critical' | 'info'

const STATUS_CFG: Record<CardStatus, {
  dot: string; bg: string; border: string; label: string; textColor: string
}> = {
  ok:       { dot:'#10b981', bg:'rgba(16,185,129,0.07)',  border:'rgba(16,185,129,0.18)', label:'Optimal',  textColor:'#059669' },
  warning:  { dot:'#f59e0b', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.22)', label:'Attention', textColor:'#d97706' },
  critical: { dot:'#ef4444', bg:'rgba(239,68,68,0.08)',  border:'rgba(239,68,68,0.22)',  label:'Critique',  textColor:'#dc2626' },
  info:     { dot:'#94a3b8', bg:'rgba(148,163,184,0.07)', border:'rgba(0,0,0,0.07)',     label:'',          textColor:'#475569' },
}

export interface DashMetricCardProps {
  label: string
  value: number | null
  unit: string
  icon: ReactNode
  color: string
  status?: CardStatus
  delay?: number
  precision?: number
  /** optional small contextual note, e.g. "Optimal: 18–23" */
  hint?: string
}

export default function DashMetricCard({
  label, value, unit, icon, color,
  status = 'info', delay = 0, precision = 1, hint,
}: DashMetricCardProps) {
  const cfg = STATUS_CFG[status]

  const displayVal = value != null
    ? (precision === 0 ? Math.round(value).toLocaleString('fr-FR') : value.toFixed(precision))
    : '—'

  const valueColor = status === 'info' ? '#0A0909' : cfg.textColor

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -2 }}
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: '12px 13px 11px',
        border: `1.5px solid ${cfg.border}`,
        boxShadow: status !== 'info'
          ? `0 2px 10px ${cfg.dot}18`
          : '0 1px 6px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
        cursor: 'default',
        transition: 'box-shadow 0.2s, transform 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2.5,
        background: status === 'critical'
          ? `linear-gradient(90deg, #ef4444cc, #ef444466)`
          : status === 'warning'
          ? `linear-gradient(90deg, #f59e0bcc, #f59e0b55)`
          : `linear-gradient(90deg, ${color}cc, ${color}33)`,
        borderRadius: '14px 14px 0 0',
      }} />

      {/* Header: icon + label + status dot */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {icon}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#5A6A7A',
            lineHeight: 1.25, letterSpacing: '-0.005em',
          }}>
            {label}
          </span>
        </div>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: cfg.dot, flexShrink: 0,
          boxShadow: status === 'critical' ? `0 0 0 3px ${cfg.dot}28` : 'none',
          animation: status === 'critical' ? 'critPulse 1.5s ease-in-out infinite' : 'none',
        }} />
      </div>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{
          fontSize: 21, fontWeight: 800,
          color: valueColor,
          letterSpacing: '-0.025em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {displayVal}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9EAAB5', marginBottom: 1 }}>
          {unit}
        </span>
      </div>

      {/* Status label / hint */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {status !== 'info' ? (
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: cfg.textColor,
            letterSpacing: '0.01em',
          }}>
            {cfg.label}
          </span>
        ) : hint ? (
          <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{hint}</span>
        ) : <span />}
      </div>

      <style>{`
        @keyframes critPulse {
          0%,100% { box-shadow: 0 0 0 3px rgba(239,68,68,0.18); }
          50%      { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
      `}</style>
    </motion.div>
  )
}
