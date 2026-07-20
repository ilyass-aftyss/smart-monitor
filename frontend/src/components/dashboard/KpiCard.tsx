import { Box, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { useThemeMode } from '../../context/ThemeContext'

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

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  normal:   { bg: 'rgba(16,185,129,0.12)',  text: '#10B981' },
  warning:  { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B' },
  critical: { bg: 'rgba(239,68,68,0.12)',   text: '#EF4444' },
}

export default function KpiCard({
  label, value, unit, color,
  min, max, current, status = 'normal', optLow, optHigh,
}: KpiCardProps) {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'

  const statusCfg = STATUS_CONFIG[status]
  const textPri = dark ? '#F0FDF4' : '#1A2E1A'
  const textSec = '#6B7280'

  const progress = (min !== undefined && max !== undefined && current !== undefined)
    ? Math.min(100, Math.max(0, ((current - min) / (max - min)) * 100))
    : undefined

  const numVal = typeof value === 'number' ? value : parseFloat(String(value))
  const displayVal = isNaN(numVal) ? '—' : numVal

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ height: '100%' }}
    >
      <Box sx={{
        height: '100%',
        background: dark ? '#1A2E1F' : '#FFFFFF',
        border: `1px solid ${status === 'normal' ? 'rgba(16,185,129,0.15)' : `${statusCfg.text}40`}`,
        borderRadius: '12px',
        p: 2.5,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{
            color: textSec, fontSize: '0.75rem', fontWeight: 500,
          }}>
            {label}
          </Typography>

          <Box sx={{
            px: 0.8, py: 0.2, borderRadius: '6px',
            bgcolor: statusCfg.bg,
          }}>
            <Typography sx={{
              fontSize: '0.6rem', fontWeight: 600,
              color: statusCfg.text, fontFamily: '"JetBrains Mono", monospace',
            }}>
              {STATUS_LABEL[status]}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: progress !== undefined ? 2 : 0 }}>
          <Typography sx={{
            color: '#10B981',
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: 700,
            fontSize: '2.5rem',
            lineHeight: 1,
          }}>
            {displayVal}
          </Typography>
          <Typography sx={{
            color: textSec,
            fontFamily: '"JetBrains Mono", monospace',
            mb: 0.3, fontSize: '0.8rem',
          }}>
            {unit}
          </Typography>
        </Box>

        {progress !== undefined && (
          <Box sx={{ mt: 0.5 }}>
            <Box sx={{
              height: 6, borderRadius: 3,
              bgcolor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}>
              <Box sx={{
                height: '100%', borderRadius: 3,
                bgcolor: '#10B981',
                width: `${progress}%`,
                transition: 'width 0.5s ease',
              }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography sx={{ fontSize: '0.55rem', color: textSec, fontFamily: '"JetBrains Mono", monospace' }}>
                {min}
              </Typography>
              <Typography sx={{ fontSize: '0.55rem', color: textSec, fontFamily: '"JetBrains Mono", monospace' }}>
                {max}
              </Typography>
            </Box>
          </Box>
        )}

        {optLow !== undefined && optHigh !== undefined && (
          <Box sx={{
            mt: 0.5, pt: 1,
            borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          }}>
            <Typography sx={{
              fontSize: '0.6rem', fontFamily: '"JetBrains Mono", monospace',
              color: status === 'normal' ? '#10B981' : textSec,
            }}>
              optimal {optLow}–{optHigh} {unit}
            </Typography>
          </Box>
        )}
      </Box>
    </motion.div>
  )
}
