import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Box, IconButton } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar, { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED } from './Sidebar'
import { useThemeMode } from '../../context/ThemeContext'
import { Menu } from 'lucide-react'

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

export default function Layout() {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  )
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const toggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      background: dark ? '#0F1F14' : '#F8FAF9',
      display: 'flex',
    }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onToggleCollapse={toggleCollapse}
        onCloseMobile={() => setMobileSidebarOpen(false)}
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
          borderBottom: '1px solid rgba(16,185,129,0.08)',
          bgcolor: dark ? '#0F1F14' : '#FFFFFF',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
        }}>
          <IconButton
            onClick={() => setMobileSidebarOpen(true)}
            size="small"
            sx={{ color: '#6B7280', '&:hover': { color: '#10B981' } }}
          >
            <Menu size={20} />
          </IconButton>
          <Box sx={{
            ml: 2, display: 'flex', alignItems: 'center', gap: 1.2,
            userSelect: 'none',
          }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: '8px',
              bgcolor: '#10B981',
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
              <Box sx={{ fontWeight: 700, fontSize: '0.85rem', color: dark ? '#F0FDF4' : '#1A2E1A', lineHeight: 1.1 }}>
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
          maxWidth: 1600,
          width: '100%',
          mx: 'auto',
        }}>
          <AnimatePresence mode="popLayout">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  )
}
