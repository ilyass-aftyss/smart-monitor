import { Outlet, useLocation } from 'react-router-dom'
import { Box } from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'
import NavBar from './NavBar'
import { useThemeMode } from '../../context/ThemeContext'

/* ── Aurora / Blob background ─────────────────────────────────────────────── */
function AuroraBackground({ dark }: { dark: boolean }) {
  if (!dark) {
    // Light-mode: soft blobs
    return (
      <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: 600, height: 600,
          borderRadius: '50%', filter: 'blur(120px)', opacity: 0.06,
          background: 'radial-gradient(circle, #0060c0, transparent)',
          top: '-15%', left: '-10%',
          animation: 'aurora-shift 22s ease-in-out infinite',
        }} className="aurora-blob-a" />
        <div style={{
          position: 'absolute', width: 500, height: 500,
          borderRadius: '50%', filter: 'blur(100px)', opacity: 0.05,
          background: 'radial-gradient(circle, #00b898, transparent)',
          bottom: '-10%', right: '-8%',
          animation: 'aurora-shift-b 28s ease-in-out infinite',
        }} className="aurora-blob-b" />
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {/* Large cyan blob — top left */}
      <div className="aurora-blob-a" style={{
        position: 'absolute',
        width: 700, height: 700,
        borderRadius: '50%',
        filter: 'blur(130px)',
        opacity: 0.09,
        background: 'radial-gradient(circle at center, #0066cc 0%, #00aaff 40%, transparent 70%)',
        top: '-20%', left: '-15%',
      }} />

      {/* Emerald blob — bottom right */}
      <div className="aurora-blob-b" style={{
        position: 'absolute',
        width: 600, height: 600,
        borderRadius: '50%',
        filter: 'blur(120px)',
        opacity: 0.07,
        background: 'radial-gradient(circle at center, #00ddaa 0%, #00b898 50%, transparent 70%)',
        bottom: '-15%', right: '-10%',
      }} />

      {/* Purple accent — center right */}
      <div className="aurora-blob-c" style={{
        position: 'absolute',
        width: 450, height: 450,
        borderRadius: '50%',
        filter: 'blur(100px)',
        opacity: 0.055,
        background: 'radial-gradient(circle at center, #a855f7 0%, #7c3aed 50%, transparent 70%)',
        top: '30%', right: '10%',
      }} />

      {/* Subtle scan line — very faint */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,170,255,0.008) 3px, rgba(0,170,255,0.008) 4px)',
        pointerEvents: 'none',
      }} />
    </Box>
  )
}

/* ── Page transition wrapper ──────────────────────────────────────────────── */
function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ── Layout ───────────────────────────────────────────────────────────────── */
export default function Layout() {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const location = useLocation()

  return (
    <Box sx={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      background: dark
        ? '#060d1e'
        : '#f0f4f8',
    }}>
      {/* Aurora animated background */}
      <AuroraBackground dark={dark} />

      <NavBar />

      <Box
        component="main"
        sx={{
          pt: 'calc(56px + 28px)',
          pb: 5,
          px: { xs: 2, sm: 3, md: 4 },
          maxWidth: 1600,
          mx: 'auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </Box>
    </Box>
  )
}
