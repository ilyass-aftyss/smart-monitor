import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { useThemeMode } from '../../context/ThemeContext'
import { alertsApi } from '../../services/api'
import BadgePulse from './BadgePulse'

const NAV_ITEMS = [
  { label: 'Dashboard',    path: '/dashboard' },
  { label: 'Historique',   path: '/history'   },
  { label: 'Météo',        path: '/meteo' },
  { label: 'Actionneurs', path: '/devices'   },
  { label: 'Alertes',      path: '/alerts'    },
  { label: 'Vue 3D',       path: '/3d'        },
  { label: 'Ask IA',       path: '/ask'       },
  { label: 'Mail',         path: '/mail'      },
  { label: 'Admin',        path: '/admin'     },
]

const INDICATOR_SPRING = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 34,
  mass: 0.75,
}

export default function NavTabs() {
  const location = useLocation()
  const navigate = useNavigate()
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const [alertCount, setAlertCount] = useState(0)
  const indicatorId = 'nav-indicator'

  useEffect(() => {
    alertsApi.list().then((r) => {
      setAlertCount(r.data.filter((a: any) => !a.acknowledged).length)
    }).catch(() => {})
    const t = setInterval(() => {
      alertsApi.list().then((r) =>
        setAlertCount(r.data.filter((a: any) => !a.acknowledged).length)
      ).catch(() => {})
    }, 30000)
    return () => clearInterval(t)
  }, [])

  const primary  = '#10B981'
  const textSec  = '#6B7280'

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        background: dark ? '#1A2E1F' : '#F0FDF4',
        borderRadius: '12px',
        p: '4px',
        border: `1px solid rgba(16,185,129,0.08)`,
        gap: '4px',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = location.pathname === item.path
        const isAlerts = item.path === '/alerts'
        return (
          <Box
            key={item.path}
            onClick={() => navigate(item.path)}
            sx={{
              position: 'relative',
              py: '7px',
              px: '14px',
              cursor: 'pointer',
              borderRadius: '9px',
              userSelect: 'none',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {active && (
              <motion.div
                layoutId={indicatorId}
                transition={INDICATOR_SPRING}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 10,
                  background: 'rgba(16,185,129,0.12)',
                }}
              />
            )}
            <Typography
              sx={{
                position: 'relative',
                zIndex: 1,
                fontSize: '0.78rem',
                fontWeight: active ? 600 : 400,
                color: active ? primary : textSec,
                whiteSpace: 'nowrap',
                transition: 'color 0.2s',
              }}
            >
              {item.label}
            </Typography>
            {isAlerts && alertCount > 0 && <BadgePulse count={alertCount} />}
          </Box>
        )
      })}
    </Box>
  )
}
