import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Box, Typography, Chip, Avatar, Button } from '@mui/material'
import { useAuthStore } from '../../store/authStore'
import { useThemeMode } from '../../context/ThemeContext'
import { useLatestSensorData } from '../../hooks/useSensorData'
import { alertsApi } from '../../services/api'

const NAV_ITEMS = [
  { label: 'Dashboard',      path: '/dashboard' },
  { label: 'Historique',     path: '/history'   },
  { label: 'Capteurs Ext.',  path: '/external'  },
  { label: 'Ventilateurs',   path: '/devices'   },
  { label: 'Alertes',        path: '/alerts'    },
  { label: 'Vue 3D',         path: '/3d'        },
]

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])
  return (
    <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', opacity: 0.6, whiteSpace: 'nowrap' }}>
      {now.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
      {' · '}
      {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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

  useEffect(() => {
    alertsApi.list().then((r) => {
      setAlertCount(r.data.filter((a: any) => !a.acknowledged).length)
    }).catch(() => {})
    const t = setInterval(() => {
      alertsApi.list().then((r) => setAlertCount(r.data.filter((a: any) => !a.acknowledged).length)).catch(() => {})
    }, 30000)
    return () => clearInterval(t)
  }, [])

  const isLive = lastUpdate ? (Date.now() - lastUpdate.getTime()) < 90000 : false

  const handleLogout = () => { logout(); navigate('/login') }

  const navBg   = dark ? 'rgba(6,10,22,0.96)'  : 'rgba(255,255,255,0.97)'
  const border  = dark ? 'rgba(0,170,255,0.12)' : 'rgba(0,80,160,0.1)'
  const primary = dark ? '#00aaff' : '#0070d4'
  const textPri = dark ? '#e2ecf8' : '#1a2540'
  const textSec = dark ? '#8aaccc' : '#5a7090'

  return (
    <Box
      component="nav"
      sx={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1200,
        height: 58,
        background: navBg,
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center',
        px: { xs: 2, md: 3 },
        gap: 0,
      }}
    >
      {/* Logo */}
      <Box
        onClick={() => navigate('/dashboard')}
        sx={{ display: 'flex', alignItems: 'center', gap: 1.2, cursor: 'pointer', mr: 3, flexShrink: 0 }}
      >
        <Box sx={{
          width: 28, height: 28, borderRadius: '8px',
          background: dark ? 'linear-gradient(135deg, #0066bb, #00ddaa)' : 'linear-gradient(135deg, #0060c0, #00b898)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', boxShadow: `0 2px 8px ${primary}55`,
        }}>🍓</Box>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: textPri, lineHeight: 1.1 }}>
            Serre Fraisier
          </Typography>
          <Typography sx={{ fontSize: '0.6rem', color: textSec, fontFamily: '"JetBrains Mono", monospace', lineHeight: 1 }}>
            Supervision climatique
          </Typography>
        </Box>
      </Box>

      {/* Nav links */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path
          const isAlerts = item.path === '/alerts'
          return (
            <Box
              key={item.path}
              onClick={() => navigate(item.path)}
              sx={{
                position: 'relative',
                px: 1.5, py: 0.8,
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.18s',
                background: active ? (dark ? 'rgba(0,170,255,0.1)' : 'rgba(0,112,212,0.08)') : 'transparent',
                '&:hover': { background: dark ? 'rgba(0,170,255,0.07)' : 'rgba(0,112,212,0.06)' },
              }}
            >
              <Typography sx={{
                fontSize: '0.82rem',
                fontWeight: active ? 700 : 400,
                color: active ? primary : textSec,
                transition: 'color 0.18s',
                whiteSpace: 'nowrap',
              }}>
                {item.label}
                {isAlerts && alertCount > 0 && (
                  <Box component="span" sx={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    ml: 0.7, width: 16, height: 16, borderRadius: '50%',
                    bgcolor: '#e8334a', color: '#fff', fontSize: '0.6rem', fontWeight: 700,
                  }}>
                    {alertCount > 9 ? '9+' : alertCount}
                  </Box>
                )}
              </Typography>
              {active && (
                <Box sx={{
                  position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2,
                  background: `linear-gradient(90deg, transparent, ${primary}, transparent)`,
                  borderRadius: 1,
                }} />
              )}
            </Box>
          )
        })}
      </Box>

      <Box sx={{ flex: 1, display: { md: 'none' } }} />

      {/* Right controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
        {/* Live indicator */}
        <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 0.7 }}>
          <Box sx={{
            width: 6, height: 6, borderRadius: '50%',
            bgcolor: isLive ? (dark ? '#00e87a' : '#10b981') : '#f59e0b',
            boxShadow: isLive ? `0 0 6px ${dark ? '#00e87a' : '#10b981'}` : 'none',
          }} />
          <Typography sx={{ fontSize: '0.68rem', color: textSec, fontFamily: '"JetBrains Mono", monospace' }}>
            {isLive ? 'EN DIRECT' : 'Hors ligne'}
          </Typography>
        </Box>

        {/* Clock */}
        <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
          <Clock />
        </Box>

        {/* Dark/Light toggle */}
        <Box
          onClick={toggle}
          sx={{
            px: 1.2, py: 0.5, borderRadius: '20px', cursor: 'pointer',
            border: `1px solid ${border}`,
            background: dark ? 'rgba(0,170,255,0.08)' : 'rgba(0,80,160,0.06)',
            transition: 'all 0.2s',
            '&:hover': { borderColor: primary, background: dark ? 'rgba(0,170,255,0.14)' : 'rgba(0,80,160,0.1)' },
          }}
        >
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: primary, fontFamily: '"JetBrains Mono", monospace', whiteSpace: 'nowrap' }}>
            {dark ? 'Mode clair' : 'Mode sombre'}
          </Typography>
        </Box>

        {/* Role badge */}
        <Chip
          label={role === 'admin' ? 'Admin' : 'Viewer'}
          size="small"
          sx={{
            height: 22, fontSize: '0.65rem',
            bgcolor: role === 'admin' ? (dark ? 'rgba(0,170,255,0.12)' : 'rgba(0,112,212,0.1)') : (dark ? 'rgba(0,232,122,0.1)' : 'rgba(16,185,129,0.1)'),
            color: role === 'admin' ? primary : (dark ? '#00e87a' : '#10b981'),
            border: `1px solid ${role === 'admin' ? primary + '44' : (dark ? '#00e87a44' : '#10b98144')}`,
          }}
        />

        {/* User */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <Avatar sx={{
            width: 26, height: 26, fontSize: '0.7rem', fontWeight: 700,
            bgcolor: dark ? 'rgba(0,170,255,0.18)' : 'rgba(0,112,212,0.12)',
            color: primary, border: `1px solid ${primary}44`,
          }}>
            {username?.charAt(0).toUpperCase()}
          </Avatar>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: textPri, display: { xs: 'none', sm: 'block' } }}>
            {username}
          </Typography>
        </Box>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          size="small"
          sx={{
            fontSize: '0.75rem', px: 1.5, py: 0.5, minWidth: 0,
            color: textSec, border: `1px solid ${border}`,
            borderRadius: '8px',
            '&:hover': { color: '#e8334a', borderColor: '#e8334a44', bgcolor: 'rgba(232,51,74,0.06)' },
          }}
        >
          Quitter
        </Button>
      </Box>
    </Box>
  )
}
