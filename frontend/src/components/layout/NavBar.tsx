import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, Avatar, ClickAwayListener } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useThemeMode } from '../../context/ThemeContext'
import { useLatestSensorData } from '../../hooks/useSensorData'
import NavTabs from './NavTabs'

function GreenhouseSVG({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10 Q12 2 21 10" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <line x1="4"  y1="10" x2="4"  y2="21" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="20" y1="10" x2="20" y2="21" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="3"  y1="21" x2="21" y2="21" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <rect x="9.5" y="14" width="5" height="7" rx="2.5" stroke={color} strokeWidth="1.4" fill="none"/>
      <line x1="12" y1="10" x2="12" y2="13.5" stroke={color} strokeWidth="1" opacity="0.5"/>
      <line x1="7"  y1="10" x2="7"  y2="21"   stroke={color} strokeWidth="1" opacity="0.35"/>
      <line x1="17" y1="10" x2="17" y2="21"   stroke={color} strokeWidth="1" opacity="0.35"/>
      <path d="M12 18 C12 18 10 15 10 13.5 C10 12.5 11 12 12 13 C13 12 14 12.5 14 13.5 C14 15 12 18 12 18Z"
        fill={color} opacity="0.7"/>
    </svg>
  )
}

function AvatarMenu() {
  const { username, role, logout } = useAuthStore()
  const navigate = useNavigate()
  const { mode } = useThemeMode()
  const dark = false
  const [open, setOpen] = useState(false)

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: 'relative' }}>
        <Avatar
          onClick={(e) => { setOpen(!open) }}
          sx={{
            width: 28, height: 28, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
            bgcolor: 'rgba(13,152,186,0.15)',
            color: '#0D98BA',
            border: '2px solid rgba(13,152,186,0.3)',
          }}
        >
          {username?.charAt(0).toUpperCase()}
        </Avatar>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -8 }}
              animate={{ opacity: 1, scale: 1,    y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -8 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                minWidth: 170, zIndex: 9999,
                background: dark ? '#102A33' : '#FFFFFF',
                border: '1px solid rgba(13,152,186,0.15)',
                borderRadius: 12, padding: '12px',
                boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.12)',
              }}
            >
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, mb: 0.3, color: dark ? '#C4F9FF' : '#0D3040' }}>
                {username}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', opacity: 0.55, mb: 1.5, fontFamily: '"JetBrains Mono", monospace', color: '#6B7280' }}>
                {role === 'admin' ? 'Administrateur' : 'Observateur'}
              </Typography>
              <Box
                onClick={() => { logout(); navigate('/login'); setOpen(false) }}
                sx={{
                  width: '100%', px: 1.5, py: 0.7, borderRadius: '8px', cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 500, textAlign: 'left',
                  transition: 'all 0.15s', color: '#6B7280',
                  '&:hover': { bgcolor: 'rgba(239,68,68,0.08)', color: '#EF4444' },
                }}
              >
                Déconnexion
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </ClickAwayListener>
  )
}

export default function NavBar() {
  const navigate  = useNavigate()
  const { username, role, logout } = useAuthStore()
  const { mode } = useThemeMode()
  const dark = false
  const { lastUpdate } = useLatestSensorData(60000)

  const isLive = lastUpdate ? (Date.now() - lastUpdate.getTime()) < 90000 : false

  const textPri  = dark ? '#C4F9FF' : '#0D3040'
  const textSec  = '#6B7280'
  const navBg    = dark ? '#091E24' : '#FFFFFF'
  const border   = 'rgba(13,152,186,0.1)'

  return (
    <Box
      component="nav"
      sx={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1200,
        height: 56,
        background: navBg,
        borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center',
        px: { xs: 2, md: 3 },
      }}
    >
      <Box
        onClick={() => navigate('/dashboard')}
        sx={{ display: 'flex', alignItems: 'center', gap: 1.2, cursor: 'pointer', mr: 4, flexShrink: 0, userSelect: 'none' }}
      >
        <Box sx={{
          width: 30, height: 30, borderRadius: '9px',
          flexShrink: 0,
          bgcolor: '#0D98BA',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <GreenhouseSVG size={17} color="#ffffff" />
        </Box>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: textPri, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            Serre Fraisier
          </Typography>
          <Typography sx={{ fontSize: '0.57rem', color: textSec, fontFamily: '"JetBrains Mono", monospace', lineHeight: 1 }}>
            Supervision climatique
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <NavTabs />
      </Box>

      <Box sx={{ flex: 1, display: { md: 'none' } }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
        <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 0.7 }}>
          <Box sx={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            bgcolor: isLive ? '#0D98BA' : '#F59E0B',
            animation: isLive ? 'navPulse 2s infinite' : 'none',
            '@keyframes navPulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
          }} />
          <Typography sx={{
            fontSize: '0.65rem', color: textSec,
            fontFamily: '"JetBrains Mono", monospace',
          }}>
            {isLive ? 'EN DIRECT' : 'Hors ligne'}
          </Typography>
        </Box>

        <Box sx={{
          px: 0.9, py: 0.3, borderRadius: '6px',
          bgcolor: role === 'admin'
            ? 'rgba(13,152,186,0.1)'
            : 'rgba(13,152,186,0.08)',
          border: '1px solid rgba(13,152,186,0.25)',
          display: { xs: 'none', sm: 'flex' }, alignItems: 'center',
        }}>
          <Typography sx={{
            fontSize: '0.62rem', fontWeight: 700,
            color: '#0D98BA',
            fontFamily: '"JetBrains Mono", monospace',
          }}>
            {role === 'admin' ? 'Admin' : 'Viewer'}
          </Typography>
        </Box>

        <AvatarMenu />
      </Box>
    </Box>
  )
}
