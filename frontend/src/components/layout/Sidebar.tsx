import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Box, Typography, Drawer, IconButton,
} from '@mui/material'
import { useThemeMode } from '../../context/ThemeContext'
import { useLatestSensorData } from '../../hooks/useSensorData'
import { alertsApi } from '../../services/api'
import {
  LayoutDashboard, History, CloudSun, Fan, Bell, Brain, Boxes,
  Mail, Shield, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'

export const SIDEBAR_MIN = 180
export const SIDEBAR_MAX = 400
export const SIDEBAR_DEFAULT = 260
export const SIDEBAR_COLLAPSED = 68

function GreenhouseSVG({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10 Q12 2 21 10" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <line x1="4"  y1="10" x2="4"  y2="21" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="20" y1="10" x2="20" y2="21" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="3"  y1="21" x2="21" y2="21" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <rect x="9.5" y="14" width="5" height="7" rx="2.5" stroke={color} strokeWidth="1.4" fill="none"/>
      <line x1="12" y1="10" x2="12" y2="13.5" stroke={color} strokeWidth="1" opacity="0.5"/>
      <line x1="7"  y1="10" x2="7"  y2="21"   stroke={color} strokeWidth="1" opacity="0.35"/>
      <line x1="17" y1="10" x2="17" y2="21"   stroke={color} strokeWidth="1" opacity="0.35"/>
      <path d="M12 18 C12 18 10 15 10 13.5 C10 12.5 11 12 12 13 C13 12 14 12.5 14 13.5 C14 15 12 18 12 18Z"
        fill={color} opacity="0.7"/>
    </svg>
  )
}

interface NavItem {
  label: string
  path: string
  icon: React.ElementType
  badge?: 'alert'
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Dashboard',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { label: 'Historique',  path: '/history', icon: History },
      { label: 'Meteo',       path: '/meteo',   icon: CloudSun },
      { label: 'Actionneurs', path: '/devices', icon: Fan },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Alertes', path: '/alerts', icon: Bell, badge: 'alert' },
      { label: 'Ask IA',  path: '/ask',    icon: Brain },
      { label: 'Vue 3D',  path: '/3d',     icon: Boxes },
    ],
  },
  {
    label: 'Systeme',
    items: [
      { label: 'Mail',  path: '/mail',  icon: Mail },
      { label: 'Admin', path: '/admin', icon: Shield },
    ],
  },
]

function NavItemRow({
  item, collapsed, active, alertCount,
}: {
  item: NavItem; collapsed: boolean; active: boolean; alertCount: number
}) {
  const Icon = item.icon
  const nav  = useNavigate()
  return (
    <Box
      onClick={(e) => { e.stopPropagation(); nav(item.path) }}
      sx={{
        display: 'flex', alignItems: 'center', gap: 2,
        px: collapsed ? 0 : 2, py: 1.6,
        mx: collapsed ? 0 : 1.5,
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 2,
        cursor: 'pointer',
        userSelect: 'none',
        bgcolor: active ? 'rgba(13,152,186,0.1)' : 'transparent',
        color:   active ? '#0D98BA'               : '#6B7280',
        transition: 'all 0.15s',
        position: 'relative',
        '&:hover': {
          bgcolor: active ? 'rgba(13,152,186,0.14)' : 'rgba(13,152,186,0.06)',
          color:   active ? '#0D98BA'               : '#C4F9FF',
        },
      }}
    >
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22 }}>
        <Icon size={20} strokeWidth={active ? 2.2 : 1.7} />
        {item.badge === 'alert' && alertCount > 0 && (
          <Box sx={{
            position: 'absolute', top: -6, right: -6,
            width: 16, height: 16, borderRadius: '50%',
            bgcolor: '#EF4444', color: '#fff',
            fontSize: '0.5rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}>
            {alertCount > 9 ? '9+' : alertCount}
          </Box>
        )}
      </Box>
      {!collapsed && (
        <Typography sx={{ fontSize: '0.82rem', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
          {item.label}
        </Typography>
      )}
      {active && !collapsed && (
        <Box sx={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: 3, height: 20, borderRadius: '0 3px 3px 0',
          bgcolor: '#0D98BA',
        }} />
      )}
    </Box>
  )
}

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  sidebarWidth: number
  onToggleCollapse: () => void
  onCloseMobile: () => void
  onResize: (width: number) => void
}

export default function Sidebar({
  collapsed, mobileOpen, sidebarWidth,
  onToggleCollapse, onCloseMobile, onResize,
}: SidebarProps) {
  const location   = useLocation()
  const navigate   = useNavigate()
  const { mode }   = useThemeMode()
  const dark       = false
  const { lastUpdate } = useLatestSensorData(60000)
  const resizingRef = useRef(false)
  const startXRef   = useRef(0)
  const startWRef   = useRef(0)

  const [alertCount, setAlertCount] = useState(0)

  const isLive = lastUpdate ? (Date.now() - lastUpdate.getTime()) < 90000 : false

  useEffect(() => {
    alertsApi.list().then((r) => {
      setAlertCount(r.data.filter((a: any) => !a.acknowledged).length)
    }).catch(() => {})
    const t = setInterval(() => {
      alertsApi.list().then((r) =>
        setAlertCount(r.data.filter((a: any) => !a.acknowledged).length)
      ).catch(() => {})
    }, 30000)
    return () => clearInterval(t)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    resizingRef.current = true
    startXRef.current   = e.clientX
    startWRef.current   = sidebarWidth
    document.body.style.cursor     = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup',   handleMouseUp)
  }, [sidebarWidth])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return
    const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWRef.current + e.clientX - startXRef.current))
    onResize(newWidth)
  }, [onResize])

  const handleMouseUp = useCallback(() => {
    resizingRef.current            = false
    document.body.style.cursor     = ''
    document.body.style.userSelect = ''
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup',   handleMouseUp)
  }, [])

  const activePath = location.pathname
  const border     = '1px solid rgba(13,152,186,0.08)'
  const textPri    = dark ? '#C4F9FF' : '#0D3040'

  const handleNavigate = (path: string) => {
    navigate(path)
    onCloseMobile()
  }

  const sidebarContent = (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      bgcolor: 'var(--glass-bg-strong)',
      backdropFilter: 'blur(var(--glass-blur)) saturate(160%)',
      WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(160%)',
      borderRight: '1px solid var(--glass-border)',
      position: 'relative',
    }}>
      {/* Resize handle */}
      {!collapsed && (
        <Box
          onMouseDown={handleMouseDown}
          sx={{
            position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 10,
            width: 8, cursor: 'col-resize',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.15s',
            '&:hover': { opacity: 1 },
            '&::before': {
              content: '""', width: 3, height: 40, borderRadius: 2,
              bgcolor: 'rgba(13,152,186,0.25)', transition: 'background 0.15s, height 0.15s',
            },
            '&:hover::before': { bgcolor: '#0D98BA', height: 60 },
          }}
        />
      )}

      {/* Logo */}
      <Box sx={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        px: collapsed ? 1 : 2, py: 1.5, minHeight: 60, borderBottom: border,
      }}>
        {!collapsed && (
          <Box
            onClick={() => handleNavigate('/dashboard')}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', userSelect: 'none' }}
          >
            <Box sx={{ width: 32, height: 32, borderRadius: '9px', bgcolor: '#0D98BA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GreenhouseSVG size={18} color="#ffffff" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: textPri, lineHeight: 1.2 }}>
                Serre Fraisier
              </Typography>
              <Typography sx={{ fontSize: '0.55rem', color: '#6B7280', fontFamily: '"JetBrains Mono", monospace', lineHeight: 1 }}>
                Supervision climatique
              </Typography>
            </Box>
          </Box>
        )}
        {collapsed && (
          <Box onClick={() => handleNavigate('/dashboard')} sx={{ cursor: 'pointer' }}>
            <Box sx={{ width: 32, height: 32, borderRadius: '9px', bgcolor: '#0D98BA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GreenhouseSVG size={18} color="#ffffff" />
            </Box>
          </Box>
        )}
        <IconButton
          onClick={onToggleCollapse} size="small"
          sx={{ color: '#6B7280', display: collapsed ? 'flex' : { xs: 'none', md: 'flex' }, '&:hover': { color: '#0D98BA', bgcolor: 'rgba(13,152,186,0.1)' } }}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </IconButton>
      </Box>

      {/* Live indicator */}
      {!collapsed && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mx: 2, mb: 1 }}>
          <Box sx={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            bgcolor: isLive ? '#0D98BA' : '#F59E0B',
            animation: isLive ? 'sidebarPulse 2s infinite' : 'none',
            '@keyframes sidebarPulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
          }} />
          <Typography sx={{ fontSize: '0.62rem', color: '#6B7280', fontFamily: '"JetBrains Mono", monospace' }}>
            {isLive ? 'EN DIRECT' : 'Hors ligne'}
          </Typography>
        </Box>
      )}

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 0.5 }}>
        {NAV_GROUPS.map((group) => (
          <Box key={group.label} sx={{ mb: 1 }}>
            {!collapsed && (
              <Typography sx={{
                px: 2.5, py: 1,
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em',
                color: 'rgba(107,114,128,0.6)', textTransform: 'uppercase',
              }}>
                {group.label}
              </Typography>
            )}
            {group.items.map((item) => (
              <NavItemRow
                key={item.path}
                item={item}
                collapsed={collapsed}
                active={activePath === item.path}
                alertCount={alertCount}
              />
            ))}
          </Box>
        ))}
      </Box>

      {/* Version */}
      <Box sx={{ borderTop: border, p: collapsed ? 1 : 1.5 }}>
        {!collapsed && (
          <Box sx={{
            mx: 1.5, my: 1, p: 1.5, borderRadius: 2, textAlign: 'center',
            bgcolor: 'rgba(13,152,186,0.04)', border: '1px dashed rgba(13,152,186,0.15)',
          }}>
            <Typography sx={{ fontSize: '0.65rem', color: '#6B7280', mb: 0.5 }}>Smart Monitor v1.0</Typography>
            <Typography sx={{ fontSize: '0.55rem', color: 'rgba(107,114,128,0.5)', fontFamily: '"JetBrains Mono", monospace' }}>
              Serre Fraisier
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )

  const currentWidth = collapsed ? SIDEBAR_COLLAPSED : sidebarWidth

  return (
    <>
      <Drawer
        variant="temporary" open={mobileOpen} onClose={onCloseMobile}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: SIDEBAR_DEFAULT, border: 'none' } }}
      >
        {sidebarContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' }, flexShrink: 0, width: currentWidth,
          transition: collapsed ? 'width 0.25s ease' : 'none',
          '& .MuiDrawer-paper': {
            width: currentWidth, transition: collapsed ? 'width 0.25s ease' : 'none',
            overflow: 'hidden', border: 'none', boxSizing: 'border-box',
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    </>
  )
}
