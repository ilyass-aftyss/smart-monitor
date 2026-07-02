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
  { label: 'Ext.',         path: '/external'  },
  { label: 'Ventilateurs', path: '/devices'   },
  { label: 'Alertes',      path: '/alerts'    },
  { label: 'Vue 3D',       path: '/3d'        },
  { label: 'Ask IA',       path: '/ask'       },
  { label: 'Mail',         path: '/mail'      },
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

  const primary  = dark ? '#00aaff' : '#0070d4'
  const textSec  = dark ? '#8aaccc' : '#5a7090'

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        background: dark ? 'rgba(0,170,255,0.05)' : 'rgba(0,80,160,0.04)',
        borderRadius: '14px',
        p: '4px',
        border: `1px solid ${dark ? 'rgba(0,170,255,0.08)' : 'rgba(0,80,160,0.06)'}`,
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
                  background: dark
                    ? 'linear-gradient(135deg, rgba(0,170,255,0.18) 0%, rgba(0,220,170,0.12) 100%)'
                    : 'linear-gradient(135deg, rgba(0,112,212,0.12) 0%, rgba(0,180,160,0.08) 100%)',
                  boxShadow: dark
                    ? '0 0 16px rgba(0,170,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                    : '0 2px 8px rgba(0,112,212,0.12)',
                  border: `1px solid ${dark ? 'rgba(0,170,255,0.25)' : 'rgba(0,112,212,0.15)'}`,
                }}
              />
            )}
            <motion.span
              animate={{ scale: active ? 1 : 0.97 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.78rem',
                  fontWeight: active ? 700 : 400,
                  color: active ? primary : textSec,
                  whiteSpace: 'nowrap',
                  letterSpacing: active ? '-0.01em' : '0.01em',
                  transition: 'color 0.2s',
                }}
              >
                {item.label}
              </Typography>
              {isAlerts && alertCount > 0 && <BadgePulse count={alertCount} />}
            </motion.span>
          </Box>
        )
      })}
    </Box>
  )
}
