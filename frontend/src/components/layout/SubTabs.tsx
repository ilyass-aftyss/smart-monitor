import { Box, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { useThemeMode } from '../../context/ThemeContext'

interface Tab {
  value: string
  label: string
}

interface Props {
  tabs: Tab[]
  active: string
  onChange: (value: string) => void
}

const spring = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 34,
  mass: 0.75,
}

export default function SubTabs({ tabs, active, onChange }: Props) {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'

  return (
    <Box
      sx={{
        display: 'inline-flex',
        background: dark ? '#1A2E1F' : '#F0FDF4',
        borderRadius: '12px',
        p: '3px',
        border: '1px solid rgba(16,185,129,0.08)',
        gap: '2px',
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.value
        return (
          <Box
            key={tab.value}
            onClick={() => onChange(tab.value)}
            sx={{
              position: 'relative',
              py: '6px',
              px: '18px',
              cursor: 'pointer',
              borderRadius: '8px',
              userSelect: 'none',
              textAlign: 'center',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="subtab-indicator"
                transition={spring}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 8,
                  background: 'rgba(16,185,129,0.12)',
                }}
              />
            )}
            <Typography
              sx={{
                position: 'relative',
                zIndex: 1,
                fontSize: '0.78rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#10B981' : '#6B7280',
                whiteSpace: 'nowrap',
                transition: 'color 0.2s',
              }}
            >
              {tab.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}
