import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeMode } from '../../context/ThemeContext'

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="#9EAAB5" strokeWidth="1.8"/>
      <path d="M16.5 16.5l4 4" stroke="#9EAAB5" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="11" rx="3" stroke="#9EAAB5" strokeWidth="1.8"/>
      <path d="M5 10a7 7 0 0 0 14 0" stroke="#9EAAB5" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12 17v4M10 21h4" stroke="#9EAAB5" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
function BotIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="8" width="18" height="12" rx="3" stroke="white" strokeWidth="1.8"/>
      <circle cx="9" cy="14" r="1.5" fill="white"/>
      <circle cx="15" cy="14" r="1.5" fill="white"/>
      <path d="M9 4h6M12 4v4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
function LightbulbIcon({ color = '#9EAAB5' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3 5.5V18H9v-3.5C7.5 13.5 6 11.5 6 9a6 6 0 0 1 6-6Z" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
function DownloadIcon({ color = '#9EAAB5' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v12M8 11l4 4 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 18h18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
function BellIcon({ color = '#9EAAB5' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
function MoonIcon({ color = '#9EAAB5' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
function CogIcon({ color = '#9EAAB5' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

// AI Assistant panel
function AIPanel({ onClose }: { onClose: () => void }) {
  const insights = [
    { icon: '🌡️', text: 'Température optimale (22 °C)',      ok: true  },
    { icon: '💧', text: 'Humidité dans la plage (68 %)',      ok: true  },
    { icon: '🌬️', text: 'CO₂ légèrement élevé (900 ppm)',    ok: false },
    { icon: '☀️', text: 'Luminosité adéquate pour la croissance', ok: true },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: 0,
        width: 300,
        background: '#FFFFFF',
        borderRadius: 16,
        boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
        border: '1px solid rgba(114,156,81,0.15)',
        padding: 16,
        zIndex: 9999,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, #729C51, #a8c97a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BotIcon />
        </div>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#0A0909' }}>AI Assistant</span>
        <button
          onClick={onClose}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9EAAB5', fontSize: 18 }}
        >×</button>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, rgba(114,156,81,0.08), rgba(168,201,122,0.05))',
        borderRadius: 10, padding: '10px 12px', marginBottom: 10,
        border: '1px solid rgba(114,156,81,0.12)',
      }}>
        <p style={{ fontSize: 12.5, color: '#4d6b35', fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
          Tous les systèmes fonctionnent. Croissance à 80 % — parfait !
        </p>
      </div>

      <p style={{ fontSize: 11, color: '#9EAAB5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, marginTop: 0 }}>
        Données en direct
      </p>

      {insights.map((ins, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 0',
            borderBottom: i < insights.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
          }}
        >
          <span style={{ fontSize: 15 }}>{ins.icon}</span>
          <span style={{ fontSize: 12.5, color: ins.ok ? '#4d6b35' : '#EB5011', flex: 1 }}>{ins.text}</span>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: ins.ok ? '#729C51' : '#EB5011',
          }} />
        </motion.div>
      ))}
    </motion.div>
  )
}

// ── Action button config ─────────────────────────────────────────────────────
interface ActionBtn {
  key: string
  label: string
  Icon: React.FC<{ color?: string }>
  onClick: () => void
}

export default function GreenTopBar() {
  const navigate = useNavigate()
  const { toggle: toggleTheme } = useThemeMode()
  const [aiOpen, setAiOpen] = useState(false)
  const [search, setSearch] = useState('')

  const ACTION_BUTTONS: ActionBtn[] = [
    {
      key: 'ask',
      label: 'Ask IA',
      Icon: LightbulbIcon,
      onClick: () => navigate('/ask'),
    },
    {
      key: 'history',
      label: 'Historique / Export',
      Icon: DownloadIcon,
      onClick: () => navigate('/history'),
    },
    {
      key: 'alerts',
      label: 'Alertes',
      Icon: BellIcon,
      onClick: () => navigate('/alerts'),
    },
    {
      key: 'theme',
      label: 'Basculer thème',
      Icon: MoonIcon,
      onClick: toggleTheme,
    },
    {
      key: 'admin',
      label: 'Administration',
      Icon: CogIcon,
      onClick: () => navigate('/admin'),
    },
  ]

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      const q = search.trim().toLowerCase()
      if (q.includes('3d') || q.includes('serre'))        navigate('/3d')
      else if (q.includes('hist') || q.includes('graph')) navigate('/history')
      else if (q.includes('alerte') || q.includes('alert')) navigate('/alerts')
      else if (q.includes('météo') || q.includes('meteo')) navigate('/meteo')
      else if (q.includes('device') || q.includes('fenêtre')) navigate('/devices')
      else if (q.includes('admin'))                         navigate('/admin')
      else if (q.includes('ia') || q.includes('ai'))        navigate('/ask')
      setSearch('')
    }
  }

  return (
    <div style={{
      height: 64,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 24,
      paddingRight: 20,
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Brand */}
      <div
        onClick={() => navigate('/dashboard')}
        style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, cursor: 'pointer' }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'linear-gradient(135deg, #729C51, #a8c97a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 10 Q12 2 21 10" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <line x1="4" y1="10" x2="4" y2="21" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            <line x1="20" y1="10" x2="20" y2="21" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            <line x1="3" y1="21" x2="21" y2="21" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            <rect x="9.5" y="14" width="5" height="7" rx="2.5" stroke="white" strokeWidth="1.4" fill="none"/>
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#0A0909', letterSpacing: '-0.01em' }}>
          AI Greenhouse
        </span>
      </div>

      {/* Search */}
      <div style={{
        flex: 1, maxWidth: 360,
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(0,0,0,0.04)',
        borderRadius: 12,
        padding: '8px 12px',
        border: '1px solid rgba(0,0,0,0.07)',
      }}>
        <SearchIcon />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleSearchKey}
          placeholder="Chercher… (3D, alertes, météo…)"
          style={{
            flex: 1, border: 'none', background: 'transparent',
            outline: 'none', fontSize: 13.5, color: '#0A0909',
            fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
          }}
        />
        <MicIcon />
      </div>

      <div style={{ flex: 1 }} />

      {/* AI Assistant button */}
      <div style={{ position: 'relative' }}>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setAiOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 12,
            background: 'linear-gradient(135deg, #729C51 0%, #a8c97a 100%)',
            border: 'none', cursor: 'pointer',
            color: 'white', fontWeight: 600, fontSize: 13.5,
            fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
            boxShadow: '0 4px 14px rgba(114,156,81,0.4)',
          }}
        >
          <BotIcon />
          AI Assistant
        </motion.button>

        <AnimatePresence>
          {aiOpen && <AIPanel onClose={() => setAiOpen(false)} />}
        </AnimatePresence>
      </div>

      {/* Action icon buttons — tous câblés */}
      {ACTION_BUTTONS.map(({ key, label, Icon, onClick }) => (
        <motion.button
          key={key}
          title={label}
          onClick={onClick}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(114,156,81,0.08)' }}
          whileTap={{ scale: 0.9 }}
          style={{
            width: 36, height: 36, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.07)',
            cursor: 'pointer',
          }}
        >
          <Icon />
        </motion.button>
      ))}
    </div>
  )
}
