import { useState, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Box, IconButton } from '@mui/material'
import Sidebar, { SIDEBAR_DEFAULT } from './Sidebar'
import { useThemeMode } from '../../context/ThemeContext'
import { Menu } from 'lucide-react'
import bg from '../../assets/greenhouse-bg.jpg'

export default function Layout() {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  )
  const [sidebarWidth, setSidebarWidth] = useState(
    () => {
      const stored = localStorage.getItem('sidebar-width')
      return stored ? Math.min(400, Math.max(180, parseInt(stored, 10))) : SIDEBAR_DEFAULT
    }
  )
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const toggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  const handleResize = useCallback((w: number) => {
    setSidebarWidth(w)
    localStorage.setItem('sidebar-width', String(w))
  }, [])

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      display: 'flex',
    }}>
      {/* Background image */}
      <Box sx={{
        position: 'fixed',
        inset: 0,
        zIndex: -10,
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: dark ? 0.25 : 0.55,
      }} />
      <Box sx={{
        position: 'fixed',
        inset: 0,
        zIndex: -10,
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,0.2), rgba(255,255,255,0.5))',
      }} />

      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        sidebarWidth={sidebarWidth}
        onToggleCollapse={toggleCollapse}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onResize={handleResize}
      />

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Mobile top bar */}
        <Box sx={{
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          px: 2, py: 1.5,
          borderBottom: '1px solid oklch(1 0 0 / 10%)',
          background: dark ? 'oklch(0.15 0.04 265 / 80%)' : 'oklch(1 0 0 / 80%)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
        }}>
          <IconButton
            onClick={() => setMobileSidebarOpen(true)}
            size="small"
            sx={{ color: '#6B7280', '&:hover': { color: '#0D98BA' } }}
          >
            <Menu size={20} />
          </IconButton>
          <Box sx={{
            ml: 2, display: 'flex', alignItems: 'center', gap: 1.2,
            userSelect: 'none',
          }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: '8px',
              bgcolor: '#0D98BA',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 10 Q12 2 21 10" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                <line x1="4" y1="10" x2="4" y2="21" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
                <line x1="20" y1="10" x2="20" y2="21" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
                <line x1="3" y1="21" x2="21" y2="21" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </Box>
            <Box>
              <Box sx={{ fontWeight: 700, fontSize: '0.85rem', color: dark ? '#C4F9FF' : '#0D3040', lineHeight: 1.1 }}>
                Serre Fraisier
              </Box>
              <Box sx={{ fontSize: '0.57rem', color: '#6B7280', fontFamily: '"JetBrains Mono", monospace', lineHeight: 1 }}>
                Supervision climatique
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Content area */}
        <Box sx={{
          flex: 1,
          pb: 5,
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 2, md: 3 },
          maxWidth: 1400,
          width: '100%',
          mx: 'auto',
        }}>
          <Box key={location.pathname}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}