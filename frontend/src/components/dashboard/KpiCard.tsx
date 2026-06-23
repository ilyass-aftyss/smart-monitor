import { Box, Typography, LinearProgress } from '@mui/material'
import { motion } from 'framer-motion'
import { useThemeMode } from '../../context/ThemeContext'

interface KpiCardProps {
  label: string
  value: number | string
  unit: string
  icon?: string
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

export default function KpiCard({ label, value, unit, color, min, max, current, status = 'normal', optLow, optHigh }: KpiCardProps) {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'

  const statusColor = status === 'critical' ? '#e8334a' : status === 'warning' ? '#f59e0b' : color
  const textPri     = dark ? '#e2ecf8' : '#1a2540'
  const textSec     = dark ? '#8aaccc' : '#5a7090'
  const cardBg      = dark ? 'rgba(10,22,48,0.88)' : '#ffffff'
  const borderCol   = status === 'normal'
    ? (dark ? 'rgba(0,170,255,0.1)' : 'rgba(0,80,160,0.1)')
    : `${statusColor}40`

  const progress = (min !== undefined && max !== undefined && current !== undefined)
    ? Math.min(100, Math.max(0, ((current - min) / (max - min)) * 100))
    : undefined

  const numVal = typeof value === 'number' ? value : parseFloat(String(value))
  const displayVal = isNaN(numVal) ? '—' : numVal.toFixed(numVal < 10 ? 2 : 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      style={{ height: '100%' }}
    >
      <Box sx={{
        height: '100%',
        background: cardBg,
        backdropFilter: dark ? 'blur(16px)' : 'none',
        border: `1px solid ${borderCol}`,
        borderRadius: '14px',
        p: 2.5,
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        boxShadow: status !== 'normal'
          ? `0 0 18px ${statusColor}18`
          : dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
        '&::before': {
          content: '""',
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: `linear-gradient(90deg, transparent, ${statusColor}99, transparent)`,
        },
      }}>
        {/* Label + status badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: textSec, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.68rem' }}>
            {label}
          </Typography>
          <Box sx={{
            px: 0.8, py: 0.2, borderRadius: '6px',
            bgcolor: `${statusColor}18`,
            border: `1px solid ${statusColor}33`,
          }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: statusColor, fontFamily: '"JetBrains Mono", monospace' }}>
              {STATUS_LABEL[status]}
            </Typography>
          </Box>
        </Box>

        {/* Value */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: progress !== undefined ? 1.5 : 0 }}>
          <Typography sx={{
            color: statusColor,
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: 700,
            fontSize: '2rem',
            lineHeight: 1,
            textShadow: dark ? `0 0 24px ${statusColor}55` : 'none',
          }}>
            {displayVal}
          </Typography>
          <Typography variant="body2" sx={{ color: textSec, fontFamily: '"JetBrains Mono", monospace', mb: 0.3 }}>
            {unit}
          </Typography>
        </Box>

        {/* Progress bar */}
        {progress !== undefined && (
          <Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 3, borderRadius: 2,
                bgcolor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${statusColor}88, ${statusColor})`,
                  borderRadius: 2,
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.4 }}>
              <Typography sx={{ fontSize: '0.6rem', color: textSec, fontFamily: '"JetBrains Mono", monospace' }}>{min}</Typography>
              <Typography sx={{ fontSize: '0.6rem', color: textSec, fontFamily: '"JetBrains Mono", monospace' }}>{max}</Typography>
            </Box>
          </Box>
        )}

        {/* Optimal range */}
        {optLow !== undefined && optHigh !== undefined && (
          <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
            <Typography sx={{
              fontSize: '0.6rem', fontFamily: '"JetBrains Mono", monospace',
              color: status === 'normal' ? (dark ? '#00e87a' : '#10b981') : textSec,
            }}>
              optimal {optLow}–{optHigh} {unit}
            </Typography>
          </Box>
        )}
      </Box>
    </motion.div>
  )
}
