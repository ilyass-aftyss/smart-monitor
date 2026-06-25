import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Box, Typography, Avatar, ClickAwayListener } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useThemeMode } from '../../context/ThemeContext'
import { useLatestSensorData } from '../../hooks/useSensorData'
import { alertsApi } from '../../services/api'
import ClickSparkWrapper from '../common/ClickSpark'

const NAV_ITEMS = [
  { label: 'Dashboard',    path: '/dashboard' },
  { label: 'Historique',   path: '/history'   },
  { label: 'Ext.',         path: '/external'  },
  { label: 'Ventilateurs', path: '/devices'   },
  { label: 'Alertes',      path: '/alerts'    },
  { label: 'Vue 3D',       path: '/3d'        },
]

/* ── Greenhouse SVG Logo ─────────────────────────────────────────────────── */
function GreenhouseSVG({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Roof arc */}
      <path
        d="M3 10 Q12 2 21 10"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"
      />
      {/* Side walls */}
      <line x1="4"  y1="10" x2="4"  y2="21" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="20" y1="10" x2="20" y2="21" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      {/* Base */}
      <line x1="3"  y1="21" x2="21" y2="21" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      {/* Door */}
      <rect x="9.5" y="14" width="5" height="7" rx="2.5" stroke={color} strokeWidth="1.4" fill="none"/>
      {/* Glass panels */}
      <line x1="12" y1="10" x2="12" y2="13.5" stroke={color} strokeWidth="1" opacity="0.5"/>
      <line x1="7"  y1="10" x2="7"  y2="21"   stroke={color} strokeWidth="1" opacity="0.35"/>
      <line x1="17" y1="10" x2="17" y2="21"   stroke={color} strokeWidth="1" opacity="0.35"/>
      {/* Plant inside */}
      <path d="M12 18 C12 18 10 15 10 13.5 C10 12.5 11 12 12 13 C13 12 14 12.5 14 13.5 C14 15 12 18 12 18Z"
        fill={color} opacity="0.7"/>
    </svg>
  )
}

function Logo() {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}
    >
      {/* Animated luminous border ring */}
      <motion.div
        animate={hovered
          ? { opacity: 1, scale: 1.12, rotate: 180 }
          : { opacity: 0.5, scale: 1,    rotate: 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: -3, borderRadius: 11,
          background: 'conic-gradient(from 0deg, #00aaff, #00ffcc, #a855f7, #00aaff)',
          zIndex: 0,
          filter: 'blur(1px)',
        }}
      />

      {/* Logo container */}
      <Box sx={{
        width: 30, height: 30, borderRadius: '9px',
        position: 'relative', zIndex: 1, flexShrink: 0,
        background: dark
          ? 'linear-gradient(135deg, #0066bb 0%, #00ddaa 100%)'
          : 'linear-gradient(135deg, #0060c0 0%, #00b898 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <motion.div
          animate={hovered ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          <GreenhouseSVG size={17} color="#ffffff" />
        </motion.div>

        {/* Shine sweep on hover */}
        <motion.div
          animate={hovered ? { x: 60, opacity: [0, 0.6, 0] } : { x: -40, opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'absolute',
            top: 0, left: -40,
            width: 20, height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            transform: 'skewX(-20deg)',
            pointerEvents: 'none',
          }}
        />
      </Box>
    </motion.div>
  )
}

/* ── Alert Badge with pulse ring ─────────────────────────────────────────── */
function BadgePulse({ count }: { count: number }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {count > 0 && (
        <Box sx={{
          position: 'absolute',
          width: 16, height: 16, borderRadius: '50%',
          background: 'rgba(232,51,74,0.5)',
          animation: 'badge-ring 1.4s ease-out infinite',
          '@keyframes badge-ring': {
            '0%':   { transform: 'scale(1)',   opacity: 0.8 },
            '100%': { transform: 'scale(2.4)', opacity: 0 },
          },
        }} />
      )}
      <motion.span
        animate={count > 0 ? {
          scale: [1, 1.22, 1],
          transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' },
        } : { scale: 1 }}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 16, height: 16, borderRadius: '50%',
          background: '#e8334a', color: '#fff', fontSize: '0.55rem', fontWeight: 700,
          lineHeight: 1,
          boxShadow: count > 0 ? '0 0 8px rgba(232,51,74,0.7)' : 'none',
          position: 'relative', zIndex: 1,
        }}
      >
        {count > 9 ? '9+' : count}
      </motion.span>
    </Box>
  )
}

/* ── Avatar with tooltip + animated dropdown ─────────────────────────────── */
function AvatarMenu() {
  const { username, role, logout } = useAuthStore()
  const navigate = useNavigate()
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const [open, setOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const primary = dark ? '#00aaff' : '#0070d4'

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: 'relative' }}>
        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && !open && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.9 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', bottom: '130%', left: '50%',
                transform: 'translateX(-50%)',
                background: dark ? 'rgba(6,10,22,0.95)' : '#1a2540',
                color: '#e2ecf8',
                padding: '4px 10px', borderRadius: 6,
                fontSize: '0.62rem', fontFamily: '"JetBrains Mono", monospace',
                whiteSpace: 'nowrap', pointerEvents: 'none',
                border: `1px solid ${primary}33`,
                zIndex: 99999,
              }}
            >
              {username} · {role === 'admin' ? 'Administrateur' : 'Observateur'}
              <div style={{
                position: 'absolute', top: '100%', left: '50%',
                transform: 'translateX(-50%)',
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: `5px solid ${dark ? 'rgba(6,10,22,0.95)' : '#1a2540'}`,
              }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar button */}
        <motion.div
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          onHoverStart={() => setShowTooltip(true)}
          onHoverEnd={() => setShowTooltip(false)}
        >
          <Avatar
            onClick={(e) => { setOpen(!open); setShowTooltip(false) }}
            sx={{
              width: 28, height: 28, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
              bgcolor: dark ? 'rgba(0,170,255,0.15)' : 'rgba(0,112,212,0.1)',
              color: dark ? '#00aaff' : '#0070d4',
              border: `2px solid ${dark ? 'rgba(0,170,255,0.35)' : 'rgba(0,112,212,0.25)'}`,
              transition: 'box-shadow 0.2s',
              '&:hover': {
                boxShadow: dark
                  ? '0 0 0 3px rgba(0,170,255,0.25), 0 0 20px rgba(0,170,255,0.3)'
                  : '0 0 0 3px rgba(0,112,212,0.2)',
              },
            }}
          >
            {username?.charAt(0).toUpperCase()}
          </Avatar>
        </motion.div>

        {/* Animated dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -8 }}
              animate={{ opacity: 1, scale: 1,    y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -8 }}
              transition={{ type: 'spring', stiffness: 340, damping: 26 }}
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                minWidth: 170, zIndex: 9999,
                background: dark ? 'rgba(6,10,22,0.97)' : '#ffffff',
                border: `1px solid ${dark ? 'rgba(0,170,255,0.15)' : 'rgba(0,80,160,0.12)'}`,
                borderRadius: 12, padding: '12px',
                boxShadow: dark
                  ? '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,170,255,0.08)'
                  : '0 8px 32px rgba(0,0,0,0.12)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, mb: 0.3, color: dark ? '#e2ecf8' : '#1a2540' }}>
                {username}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', opacity: 0.55, mb: 1.5, fontFamily: '"JetBrains Mono", monospace', color: dark ? '#8aaccc' : '#5a7090' }}>
                {role === 'admin' ? 'Administrateur' : 'Observateur'}
              </Typography>
              <ClickSparkWrapper color="#e8334a" count={6} style={{ width: '100%' }}>
                <Box
                  onClick={() => { logout(); navigate('/login'); setOpen(false) }}
                  sx={{
                    width: '100%', px: 1.5, py: 0.7, borderRadius: '8px', cursor: 'pointer',
                    fontSize: '0.78rem', fontWeight: 500, textAlign: 'left',
                    transition: 'all 0.15s', color: dark ? '#8aaccc' : '#5a7090',
                    '&:hover': { bgcolor: 'rgba(232,51,74,0.08)', color: '#e8334a' },
                  }}
                >
                  Déconnexion
                </Box>
              </ClickSparkWrapper>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </ClickAwayListener>
  )
}

/* ── Clock ───────────────────────────────────────────────────────────────── */
function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <Typography sx={{
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '0.68rem', opacity: 0.55, whiteSpace: 'nowrap', letterSpacing: '0.04em',
    }}>
      {now.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
      {' · '}
      {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </Typography>
  )
}

/* ── NavBar ──────────────────────────────────────────────────────────────── */
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
      alertsApi.list().then((r) =>
        setAlertCount(r.data.filter((a: any) => !a.acknowledged).length)
      ).catch(() => {})
    }, 30000)
    return () => clearInterval(t)
  }, [])

  const isLive = lastUpdate ? (Date.now() - lastUpdate.getTime()) < 90000 : false

  const primary  = dark ? '#00aaff' : '#0070d4'
  const textPri  = dark ? '#e2ecf8' : '#1a2540'
  const textSec  = dark ? '#8aaccc' : '#5a7090'
  const navBg    = dark ? 'rgba(6,10,22,0.97)'  : 'rgba(255,255,255,0.98)'
  const border   = dark ? 'rgba(0,170,255,0.1)' : 'rgba(0,80,160,0.1)'

  const NAV_WIDTH = 612
  const TAB_W = NAV_WIDTH / NAV_ITEMS.length

  const currentIndex = NAV_ITEMS.findIndex((item) => location.pathname === item.path)
  const activeIndex = currentIndex >= 0 ? currentIndex : 0

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
      }}
    >
      {/* Logo + Branding */}
      <Box
        onClick={() => navigate('/dashboard')}
        sx={{ display: 'flex', alignItems: 'center', gap: 1.2, cursor: 'pointer', mr: 4, flexShrink: 0, userSelect: 'none' }}
      >
        <Logo />
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: textPri, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            Serre Fraisier
          </Typography>
          <Typography sx={{ fontSize: '0.57rem', color: textSec, fontFamily: '"JetBrains Mono", monospace', lineHeight: 1, opacity: 0.7 }}>
            Supervision climatique
          </Typography>
        </Box>
      </Box>

      {/* ── Pill Navigation ───────────────────────────────────────────── */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', flex: 1, position: 'relative', height: 40 }}>
        <Box sx={{
          position: 'relative', display: 'flex', alignItems: 'center',
          background: dark ? 'rgba(0,170,255,0.05)' : 'rgba(0,80,160,0.04)',
          borderRadius: '12px', p: 0.4,
          border: `1px solid ${dark ? 'rgba(0,170,255,0.08)' : 'rgba(0,80,160,0.06)'}`,
        }}>
          {/* Sliding pill — spring animated */}
          <motion.div
            layout
            animate={{
              x: activeIndex >= 0 ? activeIndex * TAB_W : 0,
              width: TAB_W - 6,
            }}
            transition={{ type: 'spring', stiffness: 420, damping: 36, mass: 0.7 }}
            style={{
              position: 'absolute',
              height: 'calc(100% - 6px)',
              borderRadius: 9,
              background: dark
                ? 'linear-gradient(135deg, rgba(0,170,255,0.18) 0%, rgba(0,220,170,0.12) 100%)'
                : 'linear-gradient(135deg, rgba(0,112,212,0.12) 0%, rgba(0,180,160,0.08) 100%)',
              boxShadow: dark
                ? `0 0 16px rgba(0,170,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1)`
                : '0 2px 8px rgba(0,112,212,0.12)',
              border: `1px solid ${dark ? 'rgba(0,170,255,0.25)' : 'rgba(0,112,212,0.15)'}`,
              pointerEvents: 'none',
              top: 3,
            }}
          />

          {NAV_ITEMS.map((item, i) => {
            const active = location.pathname === item.path
            const isAlerts = item.path === '/alerts'
            return (
              <ClickSparkWrapper
                key={item.path}
                color={primary}
                count={6}
              >
                <motion.div
                  onClick={() => navigate(item.path)}
                  style={{
                    position: 'relative', zIndex: 1,
                    padding: '6px 0',
                    cursor: 'pointer',
                    borderRadius: 8,
                    userSelect: 'none',
                    width: TAB_W,
                    textAlign: 'center',
                  }}
                  whileHover={{ scale: active ? 1 : 1.03 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Typography sx={{
                    fontSize: '0.78rem',
                    fontWeight: active ? 700 : 400,
                    color: active ? primary : textSec,
                    transition: 'color 0.2s',
                    whiteSpace: 'nowrap',
                    letterSpacing: active ? '-0.01em' : '0.01em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.6,
                  }}>
                    {item.label}
                    {isAlerts && alertCount > 0 && <BadgePulse count={alertCount} />}
                  </Typography>
                </motion.div>
              </ClickSparkWrapper>
            )
          })}
        </Box>
      </Box>

      {/* Mobile spacer */}
      <Box sx={{ flex: 1, display: { md: 'none' } }} />

      {/* ── Right controls ────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>

        {/* Live indicator */}
        <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 0.7 }}>
          <Box sx={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            bgcolor: isLive ? (dark ? '#00e87a' : '#10b981') : '#f59e0b',
            boxShadow: isLive ? `0 0 10px ${dark ? '#00e87a' : '#10b981'}` : 'none',
            animation: isLive ? 'navPulse 2s infinite' : 'none',
            '@keyframes navPulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
          }} />
          <Typography sx={{
            fontSize: '0.65rem', color: textSec,
            fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.04em',
          }}>
            {isLive ? 'EN DIRECT' : 'Hors ligne'}
          </Typography>
        </Box>

        {/* Clock */}
        <Box sx={{ display: { xs: 'none', xl: 'block' } }}>
          <Clock />
        </Box>

        {/* Dark/Light toggle */}
        <ClickSparkWrapper color={primary} count={5}>
          <Box
            onClick={toggle}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.6,
              px: 1.2, py: 0.5, borderRadius: '20px', cursor: 'pointer', userSelect: 'none',
              border: `1px solid ${border}`,
              background: dark ? 'rgba(0,170,255,0.07)' : 'rgba(0,80,160,0.05)',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: primary,
                background: dark ? 'rgba(0,170,255,0.14)' : 'rgba(0,80,160,0.1)',
                boxShadow: `0 0 12px ${primary}33`,
              },
            }}
          >
            <Typography sx={{
              fontSize: '0.7rem', fontWeight: 600, color: primary,
              fontFamily: '"JetBrains Mono", monospace', whiteSpace: 'nowrap',
            }}>
              {dark ? '☀ Clair' : '◑ Sombre'}
            </Typography>
          </Box>
        </ClickSparkWrapper>

        {/* Role badge */}
        <Box sx={{
          px: 0.9, py: 0.3, borderRadius: '6px',
          bgcolor: role === 'admin'
            ? (dark ? 'rgba(0,170,255,0.1)' : 'rgba(0,112,212,0.08)')
            : (dark ? 'rgba(0,232,122,0.1)' : 'rgba(16,185,129,0.08)'),
          border: `1px solid ${role === 'admin' ? primary + '33' : (dark ? '#00e87a33' : '#10b98133')}`,
          display: { xs: 'none', sm: 'flex' }, alignItems: 'center',
        }}>
          <Typography sx={{
            fontSize: '0.62rem', fontWeight: 700,
            color: role === 'admin' ? primary : (dark ? '#00e87a' : '#10b981'),
            fontFamily: '"JetBrains Mono", monospace',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {role === 'admin' ? 'Admin' : 'Viewer'}
          </Typography>
        </Box>

        {/* Avatar */}
        <AvatarMenu />

        {/* Quitter */}
        <ClickSparkWrapper color="#e8334a" count={6}>
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
        </ClickSparkWrapper>
      </Box>
    </Box>
  )
}
