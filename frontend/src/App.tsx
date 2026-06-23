import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material'
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

function AppRoutes() {
  const { theme } = useThemeMode()
  const { isAuthenticated, login } = useAuthStore()
  const [ready, setReady] = useState(isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) { setReady(true); return }
    authApi.login('viewer', 'admin')
      .then(({ data }) => {
        login(data.access_token, data.role ?? 'viewer', data.username ?? 'viewer')
      })
      .catch(() => {
        login('no-auth', 'viewer', 'viewer')
      })
      .finally(() => setReady(true))
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {!ready ? (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="history"   element={<HistoryPage />} />
              <Route path="external"  element={<ExternalPage />} />
              <Route path="devices"   element={<DevicesPage />} />
              <Route path="alerts"    element={<AlertsPage />} />
              <Route path="3d"        element={<Visualization3DPage />} />
              <Route path="login"     element={<Navigate to="/dashboard" replace />} />
              <Route path="*"         element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      )}
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
