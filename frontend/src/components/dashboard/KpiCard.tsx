import { Box, Typography } from '@mui/material'
import { motion, useMotionValue, useSpring, useTransform, useInView } from 'framer-motion'
import { useThemeMode } from '../../context/ThemeContext'
import { useRef, useEffect, useState, useCallback } from 'react'

interface KpiCardProps {
  label: string
  value: number | string
  unit: string
  color: string
  min?: number
  max?: number
  current?: number
  status?: 'normal' | 'warning' | 'critical'
  optLow?: number
  optHigh?: number
}

const STATUS_LABEL: Record<string, string> = {
  normal:   'Optimal',
  warning:  'Attention',
  critical: 'Critique',
}

/* ─── Animated Count-Up ─────────────────────────────────────────────────── */
function CountUp({ value, duration = 1.4 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { stiffness: 50, damping: 18, restDelta: 0.01 })
  const decimals = value < 10 ? 2 : value < 100 ? 1 : 0
  const rounded = useTransform(springValue, (v) => v.toFixed(decimals))

  useEffect(() => {
    if (inView) motionValue.set(value)
  }, [inView, value, motionValue])

  return <motion.span ref={ref}>{rounded}</motion.span>
}

/* ─── SVG Measure Icons ──────────────────────────────────────────────────── */
function MeasureIcon({ label, color, critical }: { label: string; color: string; critical: boolean }) {
  const shakeStyle: React.CSSProperties = critical
    ? { animation: 'kpi-shake 0.4s ease-in-out infinite' }
    : {}

  if (label.toLowerCase().includes('temp')) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={shakeStyle}>
        <path d="M12 3a2 2 0 0 0-2 2v9.17A4 4 0 1 0 14 14V5a2 2 0 0 0-2-2Z" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="12" cy="17" r="2.2" fill={color} opacity="0.85"/>
        <line x1="14.5" y1="7" x2="16" y2="7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="14.5" y1="10" x2="16" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  }
  if (label.toLowerCase().includes('hum')) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={shakeStyle}>
        <path d="M12 3 C12 3 5 11 5 15.5a7 7 0 0 0 14 0C19 11 12 3 12 3Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={color} fillOpacity="0.18"/>
        <path d="M9 16a3 3 0 0 0 4.5 2.6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  }
  if (label.toLowerCase().includes('co')) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={shakeStyle}>
        <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.8"/>
        <text x="12" y="16" textAnchor="middle" fill={color} fontSize="7" fontWeight="700" fontFamily="monospace">CO₂</text>
        <circle cx="12" cy="12" r="11" stroke={color} strokeWidth="0.6" strokeDasharray="2 3" opacity="0.4"/>
      </svg>
    )
  }
  if (label.toLowerCase().includes('vent') || label.toLowerCase().includes('voc')) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={shakeStyle}>
        <path d="M3 8h10a3 3 0 1 0-3-3" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M3 12h14a3 3 0 1 1-3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M3 16h8a2 2 0 1 0-2-2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
  }
  // Default — gauge
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={shakeStyle}>
      <path d="M5 17a7 7 0 1 1 14 0" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12 10l-2 5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="1.5" fill={color}/>
    </svg>
  )
}

/* ─── Gradient Segmented Progress ────────────────────────────────────────── */
function GradientProgress({
  progress,
  color,
  optLow,
  optHigh,
  min,
  max,
}: {
  progress: number
  color: string
  optLow?: number
  optHigh?: number
  min?: number
  max?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    if (containerRef.current) setWidth(containerRef.current.offsetWidth)
    const t = setTimeout(() => setAnimated(true), 200)
    return () => clearTimeout(t)
  }, [])

  const barWidth = 2
  const gap = 2
  const bars = Math.floor(width / (barWidth + gap))

  const getBarColor = useCallback((index: number) => {
    const pct = index / bars
    const val = min !== undefined && max !== undefined
      ? min + pct * (max - min)
      : pct * 100

    const inOpt =
      optLow !== undefined && optHigh !== undefined
        ? val >= optLow && val <= optHigh
        : false

    const currentPct = animated ? progress / 100 : 0
    const highlight = index / bars < currentPct

    if (!highlight) return 'rgba(255,255,255,0.07)'
    if (inOpt) return color
    if (pct > 0.85) return '#e8334a'
    if (pct > 0.7) return '#f59e0b'
    return color
  }, [animated, progress, bars, color, optLow, optHigh, min, max])

  // Marker positions for optLow / optHigh
  const optLowBar = optLow !== undefined && min !== undefined && max !== undefined && bars > 0
    ? Math.floor(((optLow - min) / (max - min)) * bars)
    : null
  const optHighBar = optHigh !== undefined && min !== undefined && max !== undefined && bars > 0
    ? Math.floor(((optHigh - min) / (max - min)) * bars)
    : null

  return (
    <div ref={containerRef} style={{ position: 'relative', height: 14, width: '100%' }}>
      <div style={{ display: 'flex', gap: 2, height: '100%', overflow: 'hidden' }}>
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            style={{
              width: barWidth,
              height: '100%',
              borderRadius: 1,
              background: getBarColor(i),
              transition: `background ${animated ? 80 + i * 4 : 0}ms ease`,
              flexShrink: 0,
              // Taller marker bars at optLow / optHigh
              ...(i === optLowBar || i === optHighBar
                ? { height: '140%', marginTop: '-20%', borderRadius: 2, opacity: 0.9 }
                : {}),
            }}
          />
        ))}
      </div>
      {/* Marker labels */}
      {optLowBar !== null && optLow !== undefined && (
        <div style={{
          position: 'absolute', bottom: -14,
          left: optLowBar * (barWidth + gap),
          fontSize: '0.5rem', color: color, opacity: 0.7,
          fontFamily: '"JetBrains Mono", monospace', whiteSpace: 'nowrap',
        }}>
          ▲{optLow}
        </div>
      )}
      {optHighBar !== null && optHigh !== undefined && (
        <div style={{
          position: 'absolute', bottom: -14,
          left: optHighBar * (barWidth + gap),
          fontSize: '0.5rem', color: color, opacity: 0.7,
          fontFamily: '"JetBrains Mono", monospace', whiteSpace: 'nowrap',
        }}>
          ▲{optHigh}
        </div>
      )}
    </div>
  )
}

/* ─── Spotlight Card ─────────────────────────────────────────────────────── */
function SpotlightCard({
  children,
  color,
  status,
}: {
  children: React.ReactNode
  color: string
  status: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, visible: false })
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springRotX = useSpring(rotateX, { stiffness: 180, damping: 24 })
  const springRotY = useSpring(rotateY, { stiffness: 180, damping: 24 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    rotateX.set(((y - cy) / cy) * -8)
    rotateY.set(((x - cx) / cx) * 8)
    setSpotlight({ x, y, visible: true })
  }

  const handleMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
    setSpotlight(s => ({ ...s, visible: false }))
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: springRotX,
        rotateY: springRotY,
        transformStyle: 'preserve-3d',
        perspective: 800,
        height: '100%',
        borderRadius: 14,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Spotlight glow */}
      {spotlight.visible && (
        <div style={{
          position: 'absolute',
          pointerEvents: 'none',
          zIndex: 2,
          width: 180,
          height: 180,
          borderRadius: '50%',
          left: spotlight.x - 90,
          top: spotlight.y - 90,
          background: `radial-gradient(circle at center, ${color}22 0%, transparent 70%)`,
          transition: 'opacity 0.15s',
        }} />
      )}
      {children}
    </motion.div>
  )
}

/* ─── Main KpiCard ───────────────────────────────────────────────────────── */
export default function KpiCard({
  label, value, unit, color,
  min, max, current, status = 'normal', optLow, optHigh,
}: KpiCardProps) {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'

  const statusColor = status === 'critical' ? '#e8334a' : status === 'warning' ? '#f59e0b' : color
  const textPri = dark ? '#e2ecf8' : '#1a2540'
  const textSec = dark ? '#8aaccc' : '#5a7090'
  const borderCol = status === 'normal'
    ? (dark ? 'rgba(0,170,255,0.1)' : 'rgba(0,80,160,0.1)')
    : `${statusColor}40`

  const progress = (min !== undefined && max !== undefined && current !== undefined)
    ? Math.min(100, Math.max(0, ((current - min) / (max - min)) * 100))
    : undefined

  const numVal = typeof value === 'number' ? value : parseFloat(String(value))
  const displayVal = isNaN(numVal) ? '—' : numVal
  const isCritical = status === 'critical'

  return (
    <>
      {/* Inject shake keyframe once */}
      <style>{`
        @keyframes kpi-shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-2px) rotate(-1deg); }
          40% { transform: translateX(2px) rotate(1deg); }
          60% { transform: translateX(-2px) rotate(-0.5deg); }
          80% { transform: translateX(2px) rotate(0.5deg); }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ height: '100%', perspective: 900 }}
      >
        <SpotlightCard color={statusColor} status={status}>
          <Box sx={{
            height: '100%',
            background: dark ? 'rgba(10,22,48,0.88)' : '#ffffff',
            backdropFilter: dark ? 'blur(16px)' : 'none',
            border: `1px solid ${borderCol}`,
            borderRadius: '14px',
            p: 2.5,
            position: 'relative',
            overflow: 'hidden',
            transition: 'box-shadow 0.3s, border-color 0.3s',
            boxShadow: status !== 'normal'
              ? `0 0 20px ${statusColor}20`
              : dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
            '&::before': {
              content: '""',
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
              background: `linear-gradient(90deg, transparent, ${statusColor}cc, transparent)`,
              zIndex: 1,
            },
          }}>

            {/* Label row */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MeasureIcon label={label} color={statusColor} critical={isCritical} />
                <Typography variant="caption" sx={{
                  color: textSec, textTransform: 'uppercase',
                  letterSpacing: '0.08em', fontSize: '0.68rem',
                }}>
                  {label}
                </Typography>
              </Box>

              {/* Status badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
              >
                <Box sx={{
                  px: 0.8, py: 0.2, borderRadius: '6px',
                  bgcolor: `${statusColor}18`,
                  border: `1px solid ${statusColor}33`,
                  animation: isCritical ? 'kpi-badge-pulse 1.5s ease-in-out infinite' : 'none',
                  '@keyframes kpi-badge-pulse': {
                    '0%,100%': { boxShadow: `0 0 0 0 ${statusColor}55` },
                    '50%': { boxShadow: `0 0 0 5px ${statusColor}00` },
                  },
                }}>
                  <Typography sx={{
                    fontSize: '0.6rem', fontWeight: 700,
                    color: statusColor, fontFamily: '"JetBrains Mono", monospace',
                  }}>
                    {STATUS_LABEL[status]}
                  </Typography>
                </Box>
              </motion.div>
            </Box>

            {/* Value with count-up */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: progress !== undefined ? 2 : 0 }}>
              <Typography sx={{
                color: statusColor,
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 700,
                fontSize: '2rem',
                lineHeight: 1,
                textShadow: dark ? `0 0 28px ${statusColor}66` : 'none',
              }}>
                {typeof displayVal === 'number' ? <CountUp value={displayVal} /> : displayVal}
              </Typography>
              <Typography variant="body2" sx={{
                color: textSec,
                fontFamily: '"JetBrains Mono", monospace',
                mb: 0.3, fontSize: '0.8rem',
              }}>
                {unit}
              </Typography>
            </Box>

            {/* Gradient progress bar */}
            {progress !== undefined && (
              <Box sx={{ mt: 0.5, mb: optLow !== undefined ? 2 : 0.5 }}>
                <GradientProgress
                  progress={progress}
                  color={statusColor}
                  optLow={optLow}
                  optHigh={optHigh}
                  min={min}
                  max={max}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Typography sx={{ fontSize: '0.55rem', color: textSec, fontFamily: '"JetBrains Mono", monospace' }}>
                    {min}
                  </Typography>
                  <Typography sx={{ fontSize: '0.55rem', color: textSec, fontFamily: '"JetBrains Mono", monospace' }}>
                    {max}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Optimal range */}
            {optLow !== undefined && optHigh !== undefined && (
              <Box sx={{
                mt: 0.5, pt: 1,
                borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
              }}>
                <Typography sx={{
                  fontSize: '0.6rem', fontFamily: '"JetBrains Mono", monospace',
                  color: status === 'normal' ? (dark ? '#00e87a' : '#10b981') : textSec,
                }}>
                  optimal {optLow}–{optHigh} {unit}
                </Typography>
              </Box>
            )}
          </Box>
        </SpotlightCard>
      </motion.div>
    </>
  )
}
