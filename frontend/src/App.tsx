import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { ThemeModeProvider, useThemeMode } from './context/ThemeContext'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import HistoryPage from './pages/History'
import ExternalPage from './pages/External'
import DevicesPage from './pages/Devices'
import AlertsPage from './pages/Alerts'
import Visualization3DPage from './pages/Visualization3D'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { theme } = useThemeMode()
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="history"   element={<HistoryPage />} />
            <Route path="external"  element={<ExternalPage />} />
            <Route path="devices"   element={<DevicesPage />} />
            <Route path="alerts"    element={<AlertsPage />} />
            <Route path="3d"        element={<Visualization3DPage />} />
          </Route>
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
