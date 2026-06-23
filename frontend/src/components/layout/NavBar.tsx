import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Box, Typography, Avatar } from '@mui/material'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useThemeMode } from '../../context/ThemeContext'
import { useLatestSensorData } from '../../hooks/useSensorData'
import { alertsApi } from '../../services/api'

const NAV_ITEMS = [
  { label: 'Dashboard',   path: '/dashboard' },
  { label: 'Historique',  path: '/history'   },
  { label: 'Ext.',        path: '/external'  },
  { label: 'Ventilateurs',path: '/devices'   },
  { label: 'Alertes',     path: '/alerts'    },
  { label: 'Vue 3D',      path: '/3d'        },
]

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.68rem', opacity: 0.55, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
      {now.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
      {' · '}
      {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </Typography>
  )
}

export default function NavBar() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { username, role, logout } = useAuthStore()
  const { mode, toggle } = useThemeMode()
  const dark = mode === 'dark'
  const { lastUpdate } = useLatestSensorData(60000)
  const [alertCount, setAlertCount] = useState(0)
  const navRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  useEffect(() => {
    alertsApi.list().then((r) => {
      setAlertCount(r.data.filter((a: any) => !a.acknowledged).length)
    }).catch(() => {})
    const t = setInterval(() => {
      alertsApi.list().then((r) => setAlertCount(r.data.filter((a: any) => !a.acknowledged).length)).catch(() => {})
    }, 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!navRef.current) return
    const activeEl = navRef.current.querySelector('[data-active="true"]') as HTMLElement
    if (activeEl) {
      const navRect = navRef.current.getBoundingClientRect()
      const elRect = activeEl.getBoundingClientRect()
      setIndicatorStyle({ left: elRect.left - navRect.left, width: elRect.width })
    }
  }, [location.pathname])

  const isLive = lastUpdate ? (Date.now() - lastUpdate.getTime()) < 90000 : false

  const primary  = dark ? '#00aaff' : '#0070d4'
  const textPri  = dark ? '#e2ecf8' : '#1a2540'
  const textSec  = dark ? '#8aaccc' : '#5a7090'
  const navBg    = dark ? 'rgba(6,10,22,0.97)'  : 'rgba(255,255,255,0.98)'
  const border   = dark ? 'rgba(0,170,255,0.1)' : 'rgba(0,80,160,0.1)'

  return (
    <Box
      component="nav"
      sx={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1200,
        height: 56,
        background: navBg,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center',
        px: { xs: 2, md: 3 },
        gap: 0,
      }}
    >
      {/* Logo */}
      <Box
        onClick={() => navigate('/dashboard')}
        sx={{ display: 'flex', alignItems: 'center', gap: 1.2, cursor: 'pointer', mr: 4, flexShrink: 0, userSelect: 'none' }}
      >
        <Box sx={{
          width: 26, height: 26, borderRadius: '7px',
          background: dark
            ? 'linear-gradient(135deg, #0066bb 0%, #00ddaa 100%)'
            : 'linear-gradient(135deg, #0060c0 0%, #00b898 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', boxShadow: `0 2px 10px ${primary}44`, flexShrink: 0,
        }}>🌿</Box>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: textPri, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            Serre Fraisier
          </Typography>
          <Typography sx={{ fontSize: '0.57rem', color: textSec, fontFamily: '"JetBrains Mono", monospace', lineHeight: 1, opacity: 0.7 }}>
            Supervision climatique
          </Typography>
        </Box>
      </Box>

      {/* Nav links with sliding indicator */}
      <Box
        ref={navRef}
        sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0, flex: 1, position: 'relative' }}
      >
        {/* Animated sliding background indicator */}
        <motion.div
          animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          transition={{ type: 'spring', stiffness: 400, damping: 36 }}
          style={{
            position: 'absolute',
            bottom: -16,
            height: 2,
            borderRadius: 4,
            background: `linear-gradient(90deg, transparent, ${primary}, transparent)`,
            pointerEvents: 'none',
          }}
        />

        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path
          const isAlerts = item.path === '/alerts'
          return (
            <Box
              key={item.path}
              data-active={active ? 'true' : 'false'}
              onClick={() => navigate(item.path)}
              sx={{
                position: 'relative',
                px: 1.6, py: 1,
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'background 0.18s, color 0.18s',
                userSelect: 'none',
                background: active
                  ? (dark ? 'rgba(0,170,255,0.09)' : 'rgba(0,112,212,0.07)')
                  : 'transparent',
                '&:hover': {
                  background: dark ? 'rgba(0,170,255,0.06)' : 'rgba(0,112,212,0.05)',
                },
              }}
            >
              <Typography sx={{
                fontSize: '0.8rem',
                fontWeight: active ? 700 : 400,
                color: active ? primary : textSec,
                transition: 'color 0.18s, font-weight 0.18s',
                whiteSpace: 'nowrap',
                letterSpacing: active ? '0' : '0.01em',
                display: 'flex', alignItems: 'center', gap: 0.5,
              }}>
                {item.label}
                {isAlerts && alertCount > 0 && (
                  <Box component="span" sx={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 16, height: 16, borderRadius: '50%',
                    bgcolor: '#e8334a', color: '#fff', fontSize: '0.58rem', fontWeight: 700,
                    lineHeight: 1,
                  }}>
                    {alertCount > 9 ? '9+' : alertCount}
                  </Box>
                )}
              </Typography>
            </Box>
          )
        })}
      </Box>

      {/* Mobile spacer */}
      <Box sx={{ flex: 1, display: { md: 'none' } }} />

      {/* Right controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>

        {/* Live dot */}
        <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 0.7 }}>
          <Box sx={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            bgcolor: isLive ? (dark ? '#00e87a' : '#10b981') : '#f59e0b',
            boxShadow: isLive ? `0 0 8px ${dark ? '#00e87a' : '#10b981'}` : 'none',
            animation: isLive ? 'navPulse 2s infinite' : 'none',
            '@keyframes navPulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.45 } },
          }} />
          <Typography sx={{ fontSize: '0.65rem', color: textSec, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.04em' }}>
            {isLive ? 'EN DIRECT' : 'Hors ligne'}
          </Typography>
        </Box>

        {/* Clock */}
        <Box sx={{ display: { xs: 'none', xl: 'block' } }}>
          <Clock />
        </Box>

        {/* Dark / Light toggle */}
        <Box
          onClick={toggle}
          sx={{
            display: 'flex', alignItems: 'center', gap: 0.6,
            px: 1.2, py: 0.5, borderRadius: '20px', cursor: 'pointer', userSelect: 'none',
            border: `1px solid ${border}`,
            background: dark ? 'rgba(0,170,255,0.07)' : 'rgba(0,80,160,0.05)',
            transition: 'all 0.2s',
            '&:hover': { borderColor: primary, background: dark ? 'rgba(0,170,255,0.13)' : 'rgba(0,80,160,0.1)' },
          }}
        >
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: primary, fontFamily: '"JetBrains Mono", monospace', whiteSpace: 'nowrap' }}>
            {dark ? '☀ Clair' : '◑ Sombre'}
          </Typography>
        </Box>

        {/* Role badge */}
        <Box sx={{
          px: 0.9, py: 0.3, borderRadius: '6px',
          bgcolor: role === 'admin'
            ? (dark ? 'rgba(0,170,255,0.1)' : 'rgba(0,112,212,0.08)')
            : (dark ? 'rgba(0,232,122,0.1)' : 'rgba(16,185,129,0.08)'),
          border: `1px solid ${role === 'admin' ? primary + '33' : (dark ? '#00e87a33' : '#10b98133')}`,
          display: { xs: 'none', sm: 'flex' }, alignItems: 'center',
        }}>
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: role === 'admin' ? primary : (dark ? '#00e87a' : '#10b981'), fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {role === 'admin' ? 'Admin' : 'Viewer'}
          </Typography>
        </Box>

        {/* User avatar + name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
          <Avatar sx={{
            width: 24, height: 24, fontSize: '0.65rem', fontWeight: 700,
            bgcolor: dark ? 'rgba(0,170,255,0.18)' : 'rgba(0,112,212,0.12)',
            color: primary, border: `1px solid ${primary}33`,
          }}>
            {username?.charAt(0).toUpperCase()}
          </Avatar>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: textPri, display: { xs: 'none', sm: 'block' } }}>
            {username}
          </Typography>
        </Box>

        {/* Logout */}
        <Box
          onClick={() => { logout(); navigate('/login') }}
          sx={{
            px: 1.2, py: 0.4, borderRadius: '8px', cursor: 'pointer', userSelect: 'none',
            border: `1px solid ${border}`, fontSize: '0.72rem', fontWeight: 500, color: textSec,
            transition: 'all 0.18s', fontFamily: '"Inter", sans-serif',
            '&:hover': { color: '#e8334a', borderColor: 'rgba(232,51,74,0.4)', background: 'rgba(232,51,74,0.05)' },
          }}
        >
          Quitter
        </Box>
      </Box>
    </Box>
  )
}
