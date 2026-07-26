import { useState, useEffect, useCallback } from 'react'
import { Box, Typography, Paper, TextField, Slider, FormControlLabel, Switch, Chip, Button, Tabs, Tab } from '@mui/material'
import {
  Palette, Save, RotateCcw, Eye, EyeOff, SlidersHorizontal, Layout,
} from 'lucide-react'
import { useThemeMode } from '../context/ThemeContext'

function ColorPicker({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  return (
    <input
      type="color"
      value={color}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: 40, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0, background: 'none' }}
    />
  )
}

interface AdminThemeConfig {
  primaryMain: string
  primaryLight: string
  primaryDark: string
  sidebarBg: string
  sidebarFg: string
  sidebarPrimary: string
  borderRadius: number
  animationSpeed: number
  compactMode: boolean
  showAnimations: boolean
  sidebarWidth: number
  headerHeight: number
}

const DEFAULT_CONFIG: AdminThemeConfig = {
  sidebarBg: '#091E24',
  sidebarFg: '#C4F9FF',
  sidebarPrimary: '#0D98BA',
  primaryMain: '#0D98BA',
  primaryLight: '#88F4FF',
  primaryDark: '#097782',
  borderRadius: 12,
  animationSpeed: 1,
  compactMode: false,
  showAnimations: true,
  sidebarWidth: 256,
  headerHeight: 56,
}

const STORAGE_KEY = 'admin-theme-config'

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function hexToHsl(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return '0 0% 0%'
  let r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h *= 60
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export default function AdminControlPanel() {
  const { mode, toggle: toggleTheme } = useThemeMode()
  const dark = mode === 'dark'
  const [config, setConfig] = useState<AdminThemeConfig>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try { return { ...DEFAULT_CONFIG, ...JSON.parse(stored) } } catch { return DEFAULT_CONFIG }
      }
    }
    return DEFAULT_CONFIG
  })
  const [activeTab, setActiveTab] = useState(0)
  const [saved, setSaved] = useState(false)

  const saveConfig = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    applyCssVariables(config)
  }, [config])

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    localStorage.removeItem(STORAGE_KEY)
    applyCssVariables(DEFAULT_CONFIG)
  }, [])

  const applyCssVariables = useCallback((cfg: AdminThemeConfig) => {
    const root = document.documentElement
    root.style.setProperty('--sidebar-background', hexToHsl(cfg.sidebarBg))
    root.style.setProperty('--sidebar-foreground', hexToHsl(cfg.sidebarFg))
    root.style.setProperty('--sidebar-primary', hexToHsl(cfg.sidebarPrimary))
    root.style.setProperty('--primary-main', cfg.primaryMain)
    root.style.setProperty('--primary-light', cfg.primaryLight)
    root.style.setProperty('--primary-dark', cfg.primaryDark)
    root.style.setProperty('--border-radius', `${cfg.borderRadius}px`)
    root.style.setProperty('--animation-speed', `${cfg.animationSpeed}`)
    root.style.setProperty('--sidebar-width', `${cfg.sidebarWidth}px`)
    root.style.setProperty('--header-height', `${cfg.headerHeight}px`)
    document.body.classList.toggle('admin-compact', cfg.compactMode)
    document.body.classList.toggle('admin-no-animations', !cfg.showAnimations)
  }, [])

  useEffect(() => {
    applyCssVariables(config)
  }, [applyCssVariables])

  const handleColorChange = (key: keyof AdminThemeConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleNumberChange = (key: keyof AdminThemeConfig, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleBooleanChange = (key: keyof AdminThemeConfig, value: boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const TABS = [
    { id: 'brand', label: 'Couleurs', icon: Palette },
    { id: 'ui', label: 'Interface', icon: SlidersHorizontal },
    { id: 'layout', label: 'Layout', icon: Layout },
  ]

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Palette style={{ color: '#0D98BA' }} />
            Panneau d'Administration
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
            Personnalisation complète du thème
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RotateCcw />} onClick={resetConfig} sx={{ textTransform: 'none' }}>
            Réinitialiser
          </Button>
          <Button variant="contained" startIcon={saved ? <Eye /> : <Save />} onClick={saveConfig}
            sx={{ textTransform: 'none', bgcolor: '#0D98BA', color: '#fff', '&:hover': { bgcolor: '#097782' } }}>
            {saved ? 'Sauvegardé !' : 'Sauvegarder'}
          </Button>
        </Box>
      </Box>

      <div className="glass-card" style={{ marginBottom: 24, padding: 16 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#0D98BA' }}>
            Aperçu en temps réel
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', flex: 1 }}>
            Les modifications s'appliquent instantanément. Cliquez sur <strong>Sauvegarder</strong>.
          </Typography>
          <Chip
            label={dark ? 'Mode Sombre' : 'Mode Clair'}
            icon={dark ? <EyeOff /> : <Eye />}
            size="small"
            onClick={toggleTheme}
            sx={{ cursor: 'pointer', bgcolor: 'rgba(13,152,186,0.12)', color: '#0D98BA' }}
          />
        </Box>
      </div>

      <div className="glass-card" style={{ marginBottom: 24, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': { height: 3, background: '#0D98BA', borderRadius: '3px 3px 0 0' },
          }}
        >
          {TABS.map((tab) => (
            <Tab key={tab.id} label={tab.label}
              icon={<tab.icon style={{ width: 18, height: 18 }} />}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem',
                '&.Mui-selected': { color: '#0D98BA' } }} />
          ))}
        </Tabs>
      </div>

      {activeTab === 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
          {[
            { key: 'primaryMain' as keyof AdminThemeConfig, label: 'Primaire Principal', desc: 'Couleur principale' },
            { key: 'primaryLight' as keyof AdminThemeConfig, label: 'Primaire Clair', desc: 'Variante claire' },
            { key: 'primaryDark' as keyof AdminThemeConfig, label: 'Primaire Foncé', desc: 'Variante foncée' },
            { key: 'sidebarBg' as keyof AdminThemeConfig, label: 'Fond Sidebar', desc: 'Arrière-plan sidebar' },
            { key: 'sidebarFg' as keyof AdminThemeConfig, label: 'Texte Sidebar', desc: 'Texte sidebar' },
          ].map(({ key, label, desc }) => (
            <div className="glass-card" key={key} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>{label}</Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>{desc}</Typography>
                </Box>
                <ColorPicker color={config[key] as string} onChange={(c) => handleColorChange(key, c)} />
              </Box>
              <TextField value={config[key] as string}
                onChange={(e) => handleColorChange(key, e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <Box sx={{ width: 24, height: 24, borderRadius: 4, mr: 1, background: config[key] as string, border: '1px solid rgba(0,0,0,0.1)' }} />,
                }} />
            </div>
          ))}
        </Box>
      )}

      {activeTab === 1 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
          <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#0D98BA' }}>Réglages</Typography>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>Rayon de bordure</Typography>
                <Typography variant="caption" sx={{ color: '#0D98BA', fontFamily: '"JetBrains Mono", monospace' }}>{config.borderRadius}px</Typography>
              </Box>
              <Slider value={config.borderRadius} min={0} max={24} step={1}
                onChange={(_, v) => handleNumberChange('borderRadius', v as number)}
                sx={{ color: '#0D98BA' }} valueLabelDisplay="auto" />
            </Box>
            <FormControlLabel
              control={<Switch checked={config.compactMode} onChange={(e) => handleBooleanChange('compactMode', e.target.checked)} size="small" />}
              label="Mode compact"
              labelPlacement="end"
            />
          </div>
          <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#0D98BA' }}>Animations</Typography>
            <FormControlLabel
              control={<Switch checked={config.showAnimations} onChange={(e) => handleBooleanChange('showAnimations', e.target.checked)} size="small" />}
              label="Animations activées"
              labelPlacement="end"
            />
          </div>
        </Box>
      )}

      {activeTab === 2 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
          <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#0D98BA' }}>Dimensions</Typography>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>Largeur sidebar</Typography>
                <Typography variant="caption" sx={{ color: '#0D98BA', fontFamily: '"JetBrains Mono", monospace' }}>{config.sidebarWidth}px</Typography>
              </Box>
              <Slider value={config.sidebarWidth} min={200} max={400} step={16}
                onChange={(_, v) => handleNumberChange('sidebarWidth', v as number)}
                sx={{ color: '#0D98BA' }} valueLabelDisplay="auto" />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>Hauteur header</Typography>
                <Typography variant="caption" sx={{ color: '#0D98BA', fontFamily: '"JetBrains Mono", monospace' }}>{config.headerHeight}px</Typography>
              </Box>
              <Slider value={config.headerHeight} min={48} max={80} step={4}
                onChange={(_, v) => handleNumberChange('headerHeight', v as number)}
                sx={{ color: '#0D98BA' }} valueLabelDisplay="auto" />
            </Box>
          </div>
          <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#0D98BA' }}>Aperçu</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
              {[
                { label: 'Largeur', value: `${config.sidebarWidth}px` },
                { label: 'Hauteur Header', value: `${config.headerHeight}px` },
                { label: 'Rayon', value: `${config.borderRadius}px` },
                { label: 'Mode Compact', value: config.compactMode ? 'Oui' : 'Non' },
              ].map((item, i) => (
                <div className="glass-card" key={i} style={{ padding: 12, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.6rem', display: 'block', mb: 0.5 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" fontWeight={700} fontFamily='"JetBrains Mono", monospace' sx={{ color: '#0D98BA' }}>
                    {item.value}
                  </Typography>
                </div>
              ))}
            </Box>
          </div>
        </Box>
      )}
    </Box>
  )
}
