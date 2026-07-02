import { useLocation, useNavigate } from 'react-router-dom'
import {
  Drawer, Box, Typography, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Divider, Chip
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import TimelineIcon from '@mui/icons-material/Timeline'
import WbSunnyIcon from '@mui/icons-material/WbSunny'
import DevicesIcon from '@mui/icons-material/Devices'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import ViewInArIcon from '@mui/icons-material/ViewInAr'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import EmailIcon from '@mui/icons-material/Email'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Historique', path: '/history', icon: <TimelineIcon /> },
  { label: 'Données Externes', path: '/external', icon: <WbSunnyIcon /> },
  { label: 'État Ventilateurs', path: '/devices', icon: <DevicesIcon /> },
  { label: 'Alertes', path: '/alerts', icon: <NotificationsActiveIcon /> },
  { label: 'Vue 3D', path: '/3d', icon: <ViewInArIcon /> },
  { label: 'Ask IA', path: '/ask', icon: <SmartToyIcon /> },
  { label: 'Mail',   path: '/mail', icon: <EmailIcon /> },
]

interface Props {
  open: boolean
  width: number
}

export default function Sidebar({ open, width }: Props) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: open ? width : 0,
        flexShrink: 0,
        position: 'fixed',
        height: '100vh',
        '& .MuiDrawer-paper': {
          width,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: '8px',
              background: 'linear-gradient(135deg, #0077cc, #00ffcc)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px rgba(0,170,255,0.5)',
              fontSize: '18px',
            }}
          >
            🍓
          </Box>
          <Box>
            <Typography variant="body1" fontWeight={700} sx={{ color: '#e0e8f8', lineHeight: 1.2 }}>
              Serre Fraisier
            </Typography>
            <Typography variant="caption" sx={{ color: '#8aaccc', fontFamily: '"JetBrains Mono", monospace' }}>
              Supervision climatique
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(0,170,255,0.1)', mx: 2 }} />

      <Box sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ color: '#8aaccc', letterSpacing: '0.1em', textTransform: 'uppercase', pl: 1 }}>
          Navigation
        </Typography>
      </Box>

      <List sx={{ px: 1.5, flex: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: '10px',
                  py: 1.2,
                  px: 1.5,
                  position: 'relative',
                  overflow: 'hidden',
                  background: active ? 'rgba(0,170,255,0.12)' : 'transparent',
                  '&::before': active ? {
                    content: '""',
                    position: 'absolute',
                    left: 0, top: '20%', bottom: '20%',
                    width: '3px',
                    background: 'linear-gradient(180deg, #00aaff, #00ffcc)',
                    borderRadius: '0 2px 2px 0',
                  } : {},
                  '&:hover': {
                    background: 'rgba(0,170,255,0.08)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: active ? '#00aaff' : '#8aaccc',
                    '& .MuiSvgIcon-root': { fontSize: '1.2rem' },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: active ? 600 : 400,
                    color: active ? '#e0e8f8' : '#8aaccc',
                  }}
                />
                {item.path === '/alerts' && (
                  <Chip label="!" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#ff3366', color: '#fff', ml: 1 }} />
                )}
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(0,170,255,0.1)', mx: 2 }} />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#00ff88', boxShadow: '0 0 8px #00ff88', animation: 'pulse-glow 2s infinite' }} />
        <Typography variant="caption" sx={{ color: '#8aaccc', fontFamily: '"JetBrains Mono", monospace' }}>
          Système en ligne
        </Typography>
      </Box>
    </Drawer>
  )
}
