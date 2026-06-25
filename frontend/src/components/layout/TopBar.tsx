import { AppBar, Toolbar, IconButton, Typography, Box, Chip, Avatar } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard Temps Réel',
  '/history': 'Historique des Données',
  '/external': 'Capteurs Externes',
  '/devices': 'Gestion des Ventilateurs',
  '/alerts': 'Alertes & Notifications',
  '/3d': 'Visualisation 3D',
}

interface Props {
  onToggleSidebar: () => void
}

export default function TopBar({ onToggleSidebar }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const { username, role } = useAuthStore()
  const now = new Date()

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: 'rgba(5, 12, 28, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,170,255,0.1)',
        zIndex: 10,
      }}
    >
      <Toolbar sx={{ gap: 2, minHeight: '56px !important', px: 2 }}>
        <IconButton size="small" onClick={onToggleSidebar} sx={{ color: '#8aaccc' }}>
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" fontWeight={600} sx={{ color: '#e0e8f8', fontSize: '1rem' }}>
          {pageTitles[location.pathname] || 'Smart Monitor'}
        </Typography>

        <Box sx={{ flex: 1 }} />

        <Typography variant="caption" sx={{ color: '#8aaccc', fontFamily: '"JetBrains Mono", monospace', display: { xs: 'none', md: 'block' } }}>
          {now.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
          {' '}
          {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Typography>

        <Chip
          label={role === 'admin' ? 'Admin' : 'Viewer'}
          size="small"
          sx={{
            bgcolor: role === 'admin' ? 'rgba(0,170,255,0.15)' : 'rgba(0,255,136,0.1)',
            color: role === 'admin' ? '#00aaff' : '#00ff88',
            border: `1px solid ${role === 'admin' ? 'rgba(0,170,255,0.3)' : 'rgba(0,255,136,0.3)'}`,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.7rem',
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(0,170,255,0.2)', fontSize: '0.75rem', color: '#00aaff', border: '1px solid rgba(0,170,255,0.3)' }}>
            {username?.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body2" sx={{ color: '#e0e8f8', display: { xs: 'none', sm: 'block' } }}>
            {username}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
