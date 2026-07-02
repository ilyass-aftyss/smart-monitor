import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline, Box, CircularProgress, Typography } from '@mui/material'
import { ThemeModeProvider, useThemeMode } from './context/ThemeContext'
import { useAuthStore } from './store/authStore'
import { authApi } from './services/api'
import Layout from './components/layout/Layout'
import DashboardPage from './pages/Dashboard'
import HistoryPage from './pages/History'
import ExternalPage from './pages/External'
import DevicesPage from './pages/Devices'
import AlertsPage from './pages/Alerts'
import Visualization3DPage from './pages/Visualization3D'
import AskIAPage from './pages/AskIA'
import MailServicesPage from './pages/MailServices'

function AutoLogin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, login } = useAuthStore()
  const [loading, setLoading] = useState(!isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      const performAutoLogin = async () => {
        try {
          const { data } = await authApi.login('admin', 'admin')
          login(data.access_token, data.role, data.username)
        } catch (err) {
          console.warn('Auto-login failed, using fallback mock credentials:', err)
          login('mock-access-token', 'admin', 'admin')
        } finally {
          setLoading(false)
        }
      }
      performAutoLogin()
    }
  }, [isAuthenticated, login])

  if (loading) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#060d1e',
        color: '#e2ecf8',
        gap: 2
      }}>
        <CircularProgress size={40} sx={{ color: '#00aaff' }} />
        <Typography variant="body2" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
          Connexion automatique...
        </Typography>
      </Box>
    )
  }

  return <>{children}</>
}

function AppRoutes() {
  const { theme } = useThemeMode()
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <AutoLogin>
                <Layout />
              </AutoLogin>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="history"   element={<HistoryPage />} />
            <Route path="external"  element={<ExternalPage />} />
            <Route path="devices"   element={<DevicesPage />} />
            <Route path="alerts"    element={<AlertsPage />} />
            <Route path="3d"        element={<Visualization3DPage />} />
            <Route path="ask"      element={<AskIAPage />} />
            <Route path="mail"     element={<MailServicesPage />} />
          </Route>
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <ThemeModeProvider>
      <AppRoutes />
    </ThemeModeProvider>
  )
}

