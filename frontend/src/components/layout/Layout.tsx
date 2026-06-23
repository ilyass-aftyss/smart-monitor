import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import NavBar from './NavBar'
import { useThemeMode } from '../../context/ThemeContext'

export default function Layout() {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'

  return (
    <Box sx={{
      minHeight: '100vh',
      background: dark
        ? 'radial-gradient(ellipse 90% 60% at 15% 10%, rgba(0,80,180,0.08) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 85% 85%, rgba(0,180,160,0.05) 0%, transparent 55%), #060d1e'
        : '#f0f4f8',
    }}>
      <NavBar />
      <Box
        component="main"
        sx={{
          pt: '58px',
          px: { xs: 2, sm: 3, md: 4 },
          py: 3,
          maxWidth: 1600,
          mx: 'auto',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
