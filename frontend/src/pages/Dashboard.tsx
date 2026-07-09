import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useLatestSensorData } from '../hooks/useSensorData'
import { useThemeMode } from '../context/ThemeContext'
import SubTabs from '../components/layout/SubTabs'
import InternalSection from '../components/dashboard/InternalSection'
import ExternalSection from '../components/dashboard/ExternalSection'

const TABS = [
  { value: 'interieur', label: '🏠 Intérieur' },
  { value: 'exterieur', label: '🌤 Extérieur' },
]

function AnimatedTitle({ text }: { text: string }) {
  return (
    <Box sx={{ overflow: 'hidden' }}>
      {text.split(' ').map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'inline-block', marginRight: '0.3em' }}
        >
          {word}
        </motion.span>
      ))}
    </Box>
  )
}

function SourceBadge({ lastUpdate }: { lastUpdate: Date | null }) {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const isLive = lastUpdate ? (Date.now() - lastUpdate.getTime()) < 90000 : false

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <Box sx={{
        position: 'relative',
        display: 'flex', alignItems: 'center', gap: 0.8,
        px: 1.4, py: 0.5, borderRadius: '20px',
        bgcolor: isLive ? (dark ? 'rgba(0,232,122,0.08)' : 'rgba(16,185,129,0.08)') : 'rgba(245,158,11,0.08)',
        border: `1px solid ${isLive ? (dark ? 'rgba(0,232,122,0.25)' : 'rgba(16,185,129,0.25)') : 'rgba(245,158,11,0.25)'}`,
        '&::before': isLive ? {
          content: '""',
          position: 'absolute', inset: -2,
          borderRadius: '22px',
          background: 'linear-gradient(135deg, #00e87a, #06b6d4, #00e87a)',
          backgroundSize: '200% 200%',
          animation: 'spin-slow 3s linear infinite',
          zIndex: -1,
          opacity: 0.4,
        } : {},
      }}>
        <Box sx={{
          width: 7, height: 7, borderRadius: '50%',
          bgcolor: isLive ? (dark ? '#00e87a' : '#10b981') : '#f59e0b',
          boxShadow: isLive ? `0 0 6px ${dark ? '#00e87a' : '#10b981'}` : 'none',
          animation: isLive ? 'pulse 2s infinite' : 'none',
          '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
        }} />
        <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace',
          color: isLive ? (dark ? '#00e87a' : '#10b981') : '#f59e0b' }}>
          {isLive ? 'Simulateur EN DIRECT' : 'En attente de données'}
        </Typography>
      </Box>
      {lastUpdate && (
        <Typography sx={{ fontSize: '0.68rem', color: dark ? '#8aaccc' : '#5a7090', fontFamily: '"JetBrains Mono", monospace' }}>
          Dernière mesure : {lastUpdate.toLocaleTimeString('fr-FR')}
        </Typography>
      )}
    </Box>
  )
}

export default function DashboardPage() {
  const [tab, setTab] = useState('interieur')
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const { lastUpdate } = useLatestSensorData(30000)
  const textSec = dark ? '#8aaccc' : '#5a7090'

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            <AnimatedTitle text="Surveillance Temps Réel" />
          </Typography>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Typography variant="body2" sx={{ color: textSec, mt: 0.3 }}>
              Culture hors-sol du fraisier · 3 gouttières × 8.5 m · 80 plants
            </Typography>
          </motion.div>
        </Box>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <SourceBadge lastUpdate={lastUpdate} />
        </motion.div>
      </Box>

      <Box sx={{ mb: 3 }}>
        <SubTabs tabs={TABS} active={tab} onChange={setTab} />
      </Box>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'interieur' ? <InternalSection /> : <ExternalSection />}
        </motion.div>
      </AnimatePresence>
    </Box>
  )
}
