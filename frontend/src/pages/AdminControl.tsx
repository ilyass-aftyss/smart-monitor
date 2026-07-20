import { useState, useEffect, useCallback } from 'react'
import { Box, Typography, Paper, Grid, TextField, Slider, FormControlLabel, Switch, Chip, Button, Tabs, Tab, InputAdornment } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette,
  Save,
  RefreshCw,
  RotateCcw,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Layout,
  Sun as SunIcon,
  CloudSun,
  Thermometer,
  Snowflake,
  Droplet,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useThemeMode } from '../context/ThemeContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'

// Color picker using native input type="color"
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
  sidebarBg: string
  sidebarFg: string
  sidebarPrimary: string
  sidebarPrimaryFg: string
  sidebarAccent: string
  sidebarAccentFg: string
  sidebarBorder: string
  sidebarRing: string
  primaryMain: string
  primaryLight: string
  primaryDark: string
  secondaryMain: string
  accentSud: string
  accentNord: string
  accentInterior: string
  accentExterior: string
  borderRadius: number
  animationSpeed: number
  compactMode: boolean
  showAnimations: boolean
  sidebarWidth: number
  headerHeight: number
}

const DEFAULT_CONFIG: AdminThemeConfig = {
  sidebarBg: '#060d1e',
  sidebarFg: '#e2ecf8',
  sidebarPrimary: '#00aaff',
  sidebarPrimaryFg: '#060d1e',
  sidebarAccent: 'rgba(0,170,255,0.12)',
  sidebarAccentFg: '#00aaff',
  sidebarBorder: 'rgba(0,170,255,0.1)',
  sidebarRing: '#00aaff',
  primaryMain: '#00aaff',
  primaryLight: '#33bbff',
  primaryDark: '#0077cc',
  secondaryMain: '#00ffcc',
  accentSud: '#f97316',
  accentNord: '#06b6d4',
  accentInterior: '#3b82f6',
  accentExterior: '#f97316',
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
  const isMobile = useMediaQuery('(max-width: 768px)')
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
    root.style.setProperty('--sidebar-primary-foreground', hexToHsl(cfg.sidebarPrimaryFg))
    root.style.setProperty('--sidebar-accent', hexToHsl(cfg.sidebarAccent))
    root.style.setProperty('--sidebar-accent-foreground', hexToHsl(cfg.sidebarAccentFg))
    root.style.setProperty('--sidebar-border', hexToHsl(cfg.sidebarBorder))
    root.style.setProperty('--sidebar-ring', hexToHsl(cfg.sidebarRing))
    root.style.setProperty('--primary-main', cfg.primaryMain)
    root.style.setProperty('--primary-light', cfg.primaryLight)
    root.style.setProperty('--primary-dark', cfg.primaryDark)
    root.style.setProperty('--secondary-main', cfg.secondaryMain)
    root.style.setProperty('--accent-sud', cfg.accentSud)
    root.style.setProperty('--accent-nord', cfg.accentNord)
    root.style.setProperty('--accent-interior', cfg.accentInterior)
    root.style.setProperty('--accent-exterior', cfg.accentExterior)
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
    { id: 'sidebar', label: '🎨 Sidebar', icon: Palette },
    { id: 'brand', label: '🏷️ Marque', icon: Palette },
    { id: 'accents', label: '🌈 Accents', icon: Droplet },
    { id: 'ui', label: '⚙️ Interface', icon: SlidersHorizontal },
    { id: 'layout', label: '📐 Layout', icon: Layout },
  ]

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Palette style={{ color: '#00aaff' }} />
            Panneau d'Administration
          </Typography>
          <Typography variant="body2" sx={{ color: dark ? '#8aaccc' : '#5a7090', mt: 0.5 }}>
            Personnalisation complète du thème, couleurs et interface
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RotateCcw />}
            onClick={resetConfig}
            sx={{ textTransform: 'none' }}
          >
            Réinitialiser
          </Button>
          <Button
            variant={saved ? 'contained' : 'contained'}
            startIcon={saved ? <Eye /> : <Save />}
            onClick={saveConfig}
            sx={{ textTransform: 'none', bgcolor: '#00aaff', color: '#fff' }}
          >
            {saved ? 'Sauvegardé !' : 'Sauvegarder'}
          </Button>
        </Box>
      </Box>

      <Paper
        sx={{
          mb: 3, p: 2,
          background: dark ? 'linear-gradient(135deg, rgba(0,170,255,0.08) 0%, rgba(0,220,170,0.05) 100%)' : 'linear-gradient(135deg, rgba(0,112,212,0.06) 0%, rgba(0,180,160,0.04) 100%)',
          border: `1px solid ${dark ? 'rgba(0,170,255,0.15)' : 'rgba(0,112,212,0.12)'}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#00aaff' }}>
            🔴 Aperçu en temps réel
          </Typography>
          <Typography variant="body2" sx={{ color: dark ? '#8aaccc' : '#5a7090', flex: 1 }}>
            Les modifications s'appliquent instantanément. Cliquez sur <strong>Sauvegarder</strong> pour rendre permanents.
          </Typography>
          <Chip
            label={dark ? 'Mode Sombre' : 'Mode Clair'}
            icon={dark ? <EyeOff /> : <Eye />}
            size="small"
            onClick={toggleTheme}
            sx={{ cursor: 'pointer', bgcolor: dark ? 'rgba(0,170,255,0.12)' : 'rgba(0,112,212,0.08)', color: dark ? '#00aaff' : '#0070d4' }}
          />
        </Box>
      </Paper>

      <Paper sx={{ mb: 3, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
              background: 'linear-gradient(90deg, #00aaff, #00ffcc)',
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.id}
              label={tab.label}
              icon={<tab.icon style={{ width: 18, height: 18 }} />}
              sx={{
                minWidth: 140,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                '&.Mui-selected': { color: '#00aaff' },
              }}
            />
          ))}
        </Tabs>
      </Paper>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 0 && <SidebarTab config={config} onColorChange={handleColorChange} onNumberChange={handleNumberChange} dark={dark} />}
          {activeTab === 1 && <BrandTab config={config} onColorChange={handleColorChange} dark={dark} />}
          {activeTab === 2 && <AccentsTab config={config} onColorChange={handleColorChange} dark={dark} />}
          {activeTab === 3 && <UITab config={config} onNumberChange={handleNumberChange} onBooleanChange={handleBooleanChange} dark={dark} />}
          {activeTab === 4 && <LayoutTab config={config} onNumberChange={handleNumberChange} dark={dark} />}
        </motion.div>
      </AnimatePresence>
    </Box>
  )
}

/* ─── Sidebar Tab ────────────────────────────────────────────────────────── */
function SidebarTab({ config, onColorChange, onNumberChange, dark }: { config: AdminThemeConfig; onColorChange: (k: keyof AdminThemeConfig, v: string) => void; onNumberChange: (k: keyof AdminThemeConfig, v: number) => void; dark: boolean }) {
  const sidebarColors: { key: keyof AdminThemeConfig; label: string; desc: string }[] = [
    { key: 'sidebarBg', label: 'Arrière-plan', desc: 'Couleur de fond principale' },
    { key: 'sidebarFg', label: 'Premier plan', desc: 'Texte et icônes principaux' },
    { key: 'sidebarPrimary', label: 'Primaire', desc: 'Boutons actifs, éléments forts' },
    { key: 'sidebarPrimaryFg', label: 'Primaire (texte)', desc: 'Texte sur fond primaire' },
    { key: 'sidebarAccent', label: 'Accent', desc: 'Survol, focus, états intermédiaires' },
    { key: 'sidebarAccentFg', label: 'Accent (texte)', desc: 'Texte sur fond accent' },
    { key: 'sidebarBorder', label: 'Bordure', desc: 'Séparateurs, contours' },
    { key: 'sidebarRing', label: 'Anneau focus', desc: 'Focus visible clavier' },
  ]

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
      {sidebarColors.map(({ key, label, desc }) => (
        <Paper key={key} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, border: `1px solid ${dark ? 'rgba(0,170,255,0.1)' : 'rgba(0,112,212,0.08)'}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>{label}</Typography>
              <Typography variant="caption" sx={{ color: dark ? '#8aaccc' : '#5a7090' }}>{desc}</Typography>
            </Box>
            <ColorPicker color={config[key] as string} onChange={(c) => onColorChange(key, c)} />
           </Box>
           <TextField
             value={config[key] as string}
             onChange={(e) => onColorChange(key, e.target.value)}
             sx={{ '& .MuiOutlinedInput-root': { fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' } }}
             InputProps={{
               startAdornment: <Box sx={{ width: 24, height: 24, borderRadius: 4, mr: 1, background: config[key] as string, border: '1px solid rgba(0,0,0,0.1)' }} />,
             }}
           />
        </Paper>
      ))}
      <Paper sx={{ p: 2, gridColumn: '1 / -1', background: dark ? 'rgba(0,170,255,0.04)' : 'rgba(0,112,212,0.03)', border: `1px solid ${dark ? 'rgba(0,170,255,0.1)' : 'rgba(0,112,212,0.08)'}` }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#00aaff' }}>
          Largeur Sidebar
        </Typography>
        <Slider
          value={config.sidebarWidth}
          min={200}
          max={400}
          step={16}
          onChange={(_, v) => onNumberChange('sidebarWidth', v as number)}
          sx={{ color: '#00aaff' }}
          valueLabelDisplay="auto"
        />
        <Typography variant="caption" sx={{ color: dark ? '#8aaccc' : '#5a7090', mt: 1, fontFamily: '"JetBrains Mono", monospace' }}>
          {config.sidebarWidth}px
        </Typography>
      </Paper>
    </Box>
  )
}

/* ─── Brand Tab ──────────────────────────────────────────────────────────── */
function BrandTab({ config, onColorChange, dark }: { config: AdminThemeConfig; onColorChange: (k: keyof AdminThemeConfig, v: string) => void; dark: boolean }) {
  const brandColors: { key: keyof AdminThemeConfig; label: string; desc: string }[] = [
    { key: 'primaryMain', label: 'Primaire Principal', desc: 'Couleur principale de la marque' },
    { key: 'primaryLight', label: 'Primaire Clair', desc: 'Variante claire pour hover/focus' },
    { key: 'primaryDark', label: 'Primaire Foncé', desc: 'Variante foncée pour active/pressed' },
    { key: 'secondaryMain', label: 'Secondaire', desc: 'Couleur secondaire complémentaire' },
  ]

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
      {brandColors.map(({ key, label, desc }) => (
        <Paper key={key} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, border: `1px solid ${dark ? 'rgba(0,170,255,0.1)' : 'rgba(0,112,212,0.08)'}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>{label}</Typography>
              <Typography variant="caption" sx={{ color: dark ? '#8aaccc' : '#5a7090' }}>{desc}</Typography>
            </Box>
            <ColorPicker color={config[key] as string} onChange={(c) => onColorChange(key, c)} />
           </Box>
           <TextField
             value={config[key] as string}
             onChange={(e) => onColorChange(key, e.target.value)}
             sx={{ '& .MuiOutlinedInput-root': { fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' } }}
             InputProps={{
               startAdornment: <Box sx={{ width: 24, height: 24, borderRadius: 4, mr: 1, background: config[key] as string, border: '1px solid rgba(0,0,0,0.1)' }} />,
             }}
           />
        </Paper>
      ))}
    </Box>
  )
}

/* ─── Accents Tab ────────────────────────────────────────────────────────── */
function AccentsTab({ config, onColorChange, dark }: { config: AdminThemeConfig; onColorChange: (k: keyof AdminThemeConfig, v: string) => void; dark: boolean }) {
  const accentColors: { key: keyof AdminThemeConfig; label: string; desc: string; icon: React.ReactNode }[] = [
    { key: 'accentSud', label: 'Sud / Chaud', desc: 'Côté sud, toiture, soleil', icon: <SunIcon /> },
    { key: 'accentNord', label: 'Nord / Froid', desc: 'Côté nord, plafond, ombre', icon: <Snowflake /> },
    { key: 'accentInterior', label: 'Intérieur', desc: 'Capteurs, KPIs intérieurs', icon: <Thermometer /> },
    { key: 'accentExterior', label: 'Extérieur', desc: 'Station météo, environnement', icon: <CloudSun /> },
  ]

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
      {accentColors.map(({ key, label, desc, icon }) => (
        <Paper key={key} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, border: `1px solid ${dark ? 'rgba(0,170,255,0.1)' : 'rgba(0,112,212,0.08)'}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {icon}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>{label}</Typography>
                <Typography variant="caption" sx={{ color: dark ? '#8aaccc' : '#5a7090' }}>{desc}</Typography>
              </Box>
            </Box>
            <ColorPicker color={config[key] as string} onChange={(c) => onColorChange(key, c)} />
           </Box>
           <TextField
             value={config[key] as string}
             onChange={(e) => onColorChange(key, e.target.value)}
             sx={{ '& .MuiOutlinedInput-root': { fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' } }}
             InputProps={{
               startAdornment: <Box sx={{ width: 24, height: 24, borderRadius: 4, mr: 1, background: config[key] as string, border: '1px solid rgba(0,0,0,0.1)' }} />,
             }}
           />
        </Paper>
      ))}
    </Box>
  )
}

/* ─── UI Tab ─────────────────────────────────────────────────────────────── */
function UITab({ config, onNumberChange, onBooleanChange, dark }: { config: AdminThemeConfig; onNumberChange: (k: keyof AdminThemeConfig, v: number) => void; onBooleanChange: (k: keyof AdminThemeConfig, v: boolean) => void; dark: boolean }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, border: `1px solid ${dark ? 'rgba(0,170,255,0.1)' : 'rgba(0,112,212,0.08)'}` }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: '#00aaff' }}>Réglages Numériques</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>Rayon de bordure</Typography>
                <Typography variant="caption" sx={{ color: dark ? '#8aaccc' : '#5a7090' }}>Arrondi des cartes, boutons, champs</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#00aaff', fontFamily: '"JetBrains Mono", monospace' }}>{config.borderRadius}px</Typography>
            </Box>
            <Slider
              value={config.borderRadius}
              min={0}
              max={24}
              step={1}
              onChange={(_, v) => onNumberChange('borderRadius', v as number)}
              sx={{ color: '#00aaff' }}
              valueLabelDisplay="auto"
            />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>Vitesse d'animation</Typography>
                <Typography variant="caption" sx={{ color: dark ? '#8aaccc' : '#5a7090' }}>Multiplicateur global (0.5 = lent, 2 = rapide)</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#00aaff', fontFamily: '"JetBrains Mono", monospace' }}>{config.animationSpeed}x</Typography>
            </Box>
            <Slider
              value={config.animationSpeed}
              min={0.1}
              max={3}
              step={0.1}
              onChange={(_, v) => onNumberChange('animationSpeed', Math.round((v as number) * 10) / 10)}
              sx={{ color: '#00aaff' }}
              valueLabelDisplay="auto"
            />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>Hauteur header</Typography>
                <Typography variant="caption" sx={{ color: dark ? '#8aaccc' : '#5a7090' }}>Hauteur de la barre de navigation</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#00aaff', fontFamily: '"JetBrains Mono", monospace' }}>{config.headerHeight}px</Typography>
            </Box>
              <Slider
                value={config.headerHeight}
                min={48}
                max={80}
                step={4}
                onChange={(_, v) => onNumberChange('headerHeight', v as number)}
                sx={{ color: '#00aaff' }}
                valueLabelDisplay="auto"
              />
            </Box>
          </Box>
      </Paper>

      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, border: `1px solid ${dark ? 'rgba(0,170,255,0.1)' : 'rgba(0,112,212,0.08)'}` }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: '#00aaff' }}>Options Interface</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={config.compactMode}
              onChange={(e) => onBooleanChange('compactMode', e.target.checked)}
              color="primary"
              size="small"
            />
          }
          label="Mode compact (espacement réduit)"
          labelPlacement="end"
        />
        <FormControlLabel
          control={
            <Switch
              checked={config.showAnimations}
              onChange={(e) => onBooleanChange('showAnimations', e.target.checked)}
              color="primary"
              size="small"
            />
          }
          label="Animations activées"
          labelPlacement="end"
        />
      </Paper>
    </Box>
  )
}

/* ─── Layout Tab ─────────────────────────────────────────────────────────── */
function LayoutTab({ config, onNumberChange, dark }: { config: AdminThemeConfig; onNumberChange: (k: keyof AdminThemeConfig, v: number) => void; dark: boolean }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, border: `1px solid ${dark ? 'rgba(0,170,255,0.1)' : 'rgba(0,112,212,0.08)'}` }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: '#00aaff' }}>Dimensions Sidebar</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>Largeur sidebar</Typography>
                <Typography variant="caption" sx={{ color: dark ? '#8aaccc' : '#5a7090' }}>Largeur du panneau latéral (px)</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#00aaff', fontFamily: '"JetBrains Mono", monospace' }}>{config.sidebarWidth}px</Typography>
            </Box>
            <Slider
              value={config.sidebarWidth}
              min={200}
              max={400}
              step={16}
              onChange={(_, v) => onNumberChange('sidebarWidth', v as number)}
              sx={{ color: '#00aaff' }}
              valueLabelDisplay="auto"
            />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>Hauteur header</Typography>
                <Typography variant="caption" sx={{ color: dark ? '#8aaccc' : '#5a7090' }}>Hauteur barre navigation</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#00aaff', fontFamily: '"JetBrains Mono", monospace' }}>{config.headerHeight}px</Typography>
            </Box>
            <Slider
              value={config.headerHeight}
              min={48}
              max={80}
              step={4}
              onChange={(_, v) => onNumberChange('headerHeight', v as number)}
              sx={{ color: '#00aaff' }}
              valueLabelDisplay="auto"
            />
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, border: `1px solid ${dark ? 'rgba(0,170,255,0.1)' : 'rgba(0,112,212,0.08)'}` }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: '#00aaff' }}>Aperçu Configuration</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
          {[
            { label: 'Largeur Sidebar', value: `${config.sidebarWidth}px` },
            { label: 'Hauteur Header', value: `${config.headerHeight}px` },
            { label: 'Rayon Bordure', value: `${config.borderRadius}px` },
            { label: 'Vitesse Anim.', value: `${config.animationSpeed}x` },
            { label: 'Mode Compact', value: config.compactMode ? 'Oui' : 'Non' },
            { label: 'Animations', value: config.showAnimations ? 'Activées' : 'Désactivées' },
          ].map((item, i) => (
            <Paper key={i} sx={{ p: 1.5, textAlign: 'center', background: dark ? 'rgba(0,170,255,0.04)' : 'rgba(0,112,212,0.03)', border: `1px solid ${dark ? 'rgba(0,170,255,0.08)' : 'rgba(0,112,212,0.06)'}` }}>
              <Typography variant="caption" sx={{ color: dark ? '#8aaccc' : '#5a7090', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.08em', display: 'block', mb: 0.5 }}>
                {item.label}
              </Typography>
              <Typography variant="body2" fontWeight={700} fontFamily='"JetBrains Mono", monospace' sx={{ color: '#00aaff' }}>
                {item.value}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Paper>
    </Box>
  )
}