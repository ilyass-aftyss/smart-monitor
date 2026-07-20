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
        background: dark ? 'rgba(0,170,255,0.05)' : 'rgba(0,80,160,0.04)',
        borderRadius: '12px',
        p: '3px',
        border: `1px solid ${dark ? 'rgba(0,170,255,0.08)' : 'rgba(0,80,160,0.06)'}`,
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
                  background: dark
                    ? 'linear-gradient(135deg, rgba(0,170,255,0.18) 0%, rgba(0,220,170,0.12) 100%)'
                    : 'linear-gradient(135deg, rgba(0,112,212,0.12) 0%, rgba(0,180,160,0.08) 100%)',
                  boxShadow: dark
                    ? '0 0 12px rgba(0,170,255,0.15), inset 0 1px 0 rgba(255,255,255,0.08)'
                    : '0 2px 6px rgba(0,112,212,0.1)',
                  border: `1px solid ${dark ? 'rgba(0,170,255,0.2)' : 'rgba(0,112,212,0.12)'}`,
                }}
              />
            )}
            <Typography
              sx={{
                position: 'relative',
                zIndex: 1,
                fontSize: '0.78rem',
                fontWeight: isActive ? 700 : 400,
                color: isActive
                  ? (dark ? '#00aaff' : '#0070d4')
                  : (dark ? '#8aaccc' : '#5a7090'),
                whiteSpace: 'nowrap',
                letterSpacing: isActive ? '-0.01em' : '0.01em',
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
