import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  History,
  CloudSun,
  Fan,
  Bell,
  Bot,
  ChevronDown,
  LogOut,
  User,
  Settings,
  HelpCircle,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useThemeMode } from '@/context/ThemeContext'
import { useAuthStore } from '@/store/authStore'

const NAV_ITEMS = [
  { label: 'Dashboard',    path: '/dashboard', icon: LayoutDashboard },
  { label: 'Historique',   path: '/history',   icon: History },
  { label: 'Météo',        path: '/meteo',     icon: CloudSun },
  { label: 'Ventilateurs', path: '/devices',   icon: Fan },
  { label: 'Alertes',      path: '/alerts',    icon: Bell },
  { label: 'Ask IA',       path: '/ask',       icon: Bot },
]

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { username, role, logout } = useAuthStore()
  const { mode } = useThemeMode()
  const dark = mode === 'dark'

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #0077cc, #00ffcc)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 10 Q12 2 21 10" />
                  <line x1="4" y1="10" x2="4" y2="21" />
                  <line x1="20" y1="10" x2="20" y2="21" />
                  <line x1="3" y1="21" x2="21" y2="21" />
                  <rect x="9.5" y="14" width="5" height="7" rx="2.5" />
                  <path d="M12 18 C12 18 10 15 10 13.5 C10 12.5 11 12 12 13 C13 12 14 12.5 14 13.5 C14 15 12 18 12 18Z" />
                </svg>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Serre Fraisier</span>
                <span className="truncate text-xs" style={{ color: dark ? '#8aaccc' : '#6b7280' }}>Supervision climatique</span>
              </div>
              <ChevronDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-popper-anchor-width)" align="start">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate('/dashboard')}>
              <LayoutDashboard className="size-4" /> Serre Fraisier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="size-4" /> Paramètres
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const active = location.pathname === item.path
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      asChild
                    >
                      <a href={item.path} onClick={(e) => { e.preventDefault(); navigate(item.path) }}>
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full" style={{ background: dark ? 'rgba(0,170,255,0.15)' : 'rgba(0,112,212,0.1)', color: dark ? '#00aaff' : '#0070d4', fontSize: '0.75rem', fontWeight: 700 }}>
                    {username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{username}</span>
                    <span className="truncate text-xs" style={{ color: dark ? '#8aaccc' : '#6b7280' }}>{role === 'admin' ? 'Administrateur' : 'Observateur'}</span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-popper-anchor-width)" align="end">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuItem>
                  <User className="size-4" /> Profil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="size-4" /> Paramètres
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="size-4" /> Aide
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); navigate('/login') }} style={{ color: '#e8334a' }}>
                  <LogOut className="size-4" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
