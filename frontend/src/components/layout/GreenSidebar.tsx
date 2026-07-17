import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'

// ─── SVG Icons ──────────────────────────────────────────────────────────────
function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
function DropletIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3C12 3 5 10.5 5 15a7 7 0 0 0 14 0c0-4.5-7-12-7-12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8 2v3M16 2v3M3 9h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
function SlidersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="8" cy="6" r="2" fill="currentColor"/>
      <circle cx="16" cy="12" r="2" fill="currentColor"/>
      <circle cx="10" cy="18" r="2" fill="currentColor"/>
    </svg>
  )
}
function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  )
}

/** Cube 3D — vue isométrique */
function CubeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M2 7l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M12 12v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

/** Robot / IA */
function BrainIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="8" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="9" cy="14" r="1.5" fill="currentColor"/>
      <circle cx="15" cy="14" r="1.5" fill="currentColor"/>
      <path d="M9 4h6M12 4v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

// Greenhouse logo
function GreenhouseLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 10 Q12 2 21 10" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <line x1="4" y1="10" x2="4" y2="21" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="20" y1="10" x2="20" y2="21" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="3" y1="21" x2="21" y2="21" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      <rect x="9.5" y="14" width="5" height="7" rx="2.5" stroke="white" strokeWidth="1.4" fill="none"/>
      <path d="M12 18 C12 18 10 15 10 13.5 C10 12.5 11 12 12 13 C13 12 14 12.5 14 13.5 C14 15 12 18 12 18Z" fill="white" opacity="0.8"/>
    </svg>
  )
}

const NAV_ITEMS = [
  { path: '/dashboard', icon: HomeIcon,    label: 'Dashboard'       },
  { path: '/history',   icon: DropletIcon, label: 'Historique'      },
  { path: '/meteo',     icon: CalendarIcon,label: 'Météo'           },
  { path: '/devices',   icon: SlidersIcon, label: 'Actionneurs'     },
  { path: '/alerts',    icon: BellIcon,    label: 'Alertes'         },
  { path: '/3d',        icon: CubeIcon,    label: 'Vision 3D'       },
  { path: '/admin',     icon: GridIcon,    label: 'Administration'  },
]

export default function GreenSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { username } = useAuthStore()

  return (
    <div style={{
      width: 72,
      minHeight: '100vh',
      background: '#FFFFFF',
      boxShadow: '2px 0 16px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 16,
      paddingBottom: 20,
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 100,
      gap: 0,
    }}>
      {/* Logo */}
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => navigate('/dashboard')}
        title="Dashboard"
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #729C51 0%, #5a7c3c 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          marginBottom: 24,
          boxShadow: '0 4px 16px rgba(114,156,81,0.35)',
          flexShrink: 0,
        }}
      >
        <GreenhouseLogo />
      </motion.div>

      {/* Nav items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, width: '100%', alignItems: 'center' }}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path
          const Icon = item.icon
          return (
            <div key={item.path} style={{ position: 'relative' }}>
              <motion.div
                title={item.label}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate(item.path)}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: active
                    ? 'linear-gradient(135deg, rgba(114,156,81,0.18) 0%, rgba(90,124,60,0.12) 100%)'
                    : 'transparent',
                  color: active ? '#729C51' : '#9EAAB5',
                  position: 'relative',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 14,
                      background: 'rgba(114,156,81,0.12)',
                      border: '1.5px solid rgba(114,156,81,0.3)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>
                  <Icon />
                </span>
              </motion.div>
            </div>
          )
        })}
      </div>

      {/* Bottom — Ask IA + Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        {/* Ask IA */}
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate('/ask')}
          title="Ask IA"
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: location.pathname === '/ask'
              ? 'linear-gradient(135deg, rgba(114,156,81,0.18) 0%, rgba(90,124,60,0.12) 100%)'
              : 'transparent',
            color: location.pathname === '/ask' ? '#729C51' : '#9EAAB5',
            position: 'relative',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          {location.pathname === '/ask' && (
            <motion.div
              layoutId="sidebar-active"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 14,
                background: 'rgba(114,156,81,0.12)',
                border: '1.5px solid rgba(114,156,81,0.3)',
              }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            />
          )}
          <span style={{ position: 'relative', zIndex: 1 }}>
            <BrainIcon />
          </span>
        </motion.div>

        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate('/admin')}
          title={username || 'Admin'}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #729C51, #a8c97a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(114,156,81,0.35)',
          }}
        >
          {username?.charAt(0).toUpperCase() || 'A'}
        </motion.div>
      </div>
    </div>
  )
}
