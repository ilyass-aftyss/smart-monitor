import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useLatestSensorData } from '../hooks/useSensorData'
import { useThemeMode } from '../context/ThemeContext'
import SubTabs from '../components/layout/SubTabs'
import InternalSection from '../components/dashboard/InternalSection'
import ExternalSection from '../components/dashboard/ExternalSection'

const TABS = [
  { value: 'interieur', label: 'Intérieur' },
  { value: 'exterieur', label: 'Extérieur' },
]

function SourceBadge({ lastUpdate }: { lastUpdate: Date | null }) {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const isLive = lastUpdate ? (Date.now() - lastUpdate.getTime()) < 90000 : false

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 0.8,
        px: 1.4, py: 0.5, borderRadius: '20px',
        bgcolor: isLive ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
        border: `1px solid ${isLive ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
      }}>
        <Box sx={{
          width: 7, height: 7, borderRadius: '50%',
          bgcolor: isLive ? '#10B981' : '#F59E0B',
          animation: isLive ? 'pulse 2s infinite' : 'none',
          '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
        }} />
        <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace',
          color: isLive ? '#10B981' : '#F59E0B' }}>
          {isLive ? 'Simulateur EN DIRECT' : 'En attente de données'}
        </Typography>
      </Box>
      {lastUpdate && (
        <Typography sx={{ fontSize: '0.68rem', color: '#6B7280', fontFamily: '"JetBrains Mono", monospace' }}>
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
  const textSec = '#6B7280'

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Surveillance Temps Réel
          </Typography>
          <Typography variant="body2" sx={{ color: textSec, mt: 0.3 }}>
            Culture hors-sol du fraisier · 3 gouttières × 8.5 m · 80 plants
          </Typography>
        </Box>
        <SourceBadge lastUpdate={lastUpdate} />
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
