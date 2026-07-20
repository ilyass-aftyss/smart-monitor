import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Animated circular progress
function HarvestRing({ progress = 80 }: { progress?: number }) {
  const radius = 44
  const stroke = 7
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress / 100)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <svg width={120} height={120} viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} />
      <circle
        cx="60" cy="60" r={radius} fill="none"
        stroke="url(#harvest-gradient)"
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={animated ? offset : circumference}
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }}
      />
      <defs>
        <linearGradient id="harvest-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#729C51" />
          <stop offset="100%" stopColor="#a8c97a" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// The floating Harvest AI card
function HarvestCard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5, type: 'spring', stiffness: 200, damping: 22 }}
      className="float-card"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 20,
        padding: '18px 22px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.6)',
        width: 180,
        textAlign: 'center',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 14 }}>🌱</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0A0909' }}>Harvest AI</span>
        </div>
        <div style={{
          width: 20, height: 20, borderRadius: 6,
          background: 'rgba(114,156,81,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M3 3h10M8 3v10M3 13h10" stroke="#729C51" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Progress ring + strawberry icon */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <HarvestRing progress={80} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 22, lineHeight: 1,
        }}>
          🍓
        </div>
      </div>

      {/* Text */}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#0A0909', lineHeight: 1 }}>80%</div>
        <div style={{ fontSize: 12, color: '#729C51', fontWeight: 600, marginTop: 2 }}>Bonne Croissance</div>
      </div>
    </motion.div>
  )
}

// ── 3D Vision CTA button ─────────────────────────────────────────────────────
function Vision3DButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.4 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 20px',
        borderRadius: 14,
        background: hovered
          ? 'rgba(255,255,255,0.98)'
          : 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(114,156,81,0.45)',
        cursor: 'pointer',
        boxShadow: hovered
          ? '0 8px 30px rgba(114,156,81,0.35)'
          : '0 4px 16px rgba(0,0,0,0.12)',
        transition: 'background 0.2s, box-shadow 0.2s',
        fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
      }}
    >
      {/* Cube icon */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7v10l10 5 10-5V7L12 2Z"
          stroke="#729C51" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M2 7l10 5 10-5" stroke="#729C51" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M12 12v10" stroke="#729C51" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
      <span style={{
        fontSize: 13,
        fontWeight: 700,
        color: '#4d6b35',
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
      }}>
        Vision 3D
      </span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M5 12h14M13 6l6 6-6 6" stroke="#729C51" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </motion.button>
  )
}

interface HeroPanelProps {
  imageUrl?: string
}

export default function HeroPanel({ imageUrl }: HeroPanelProps) {
  const navigate = useNavigate()

  const bgStyle = imageUrl
    ? {
        backgroundImage: `
          linear-gradient(135deg, rgba(199,224,237,0.55) 0%, rgba(114,156,81,0.25) 60%, rgba(10,9,9,0.15) 100%),
          url(${imageUrl})
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: 'linear-gradient(135deg, #c8dfc0 0%, #8ab86a 40%, #5a7c3c 100%)',
      }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        height: '100%',
        minHeight: 320,
        ...bgStyle,
      }}
    >
      {/* Light glass overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 40%, rgba(0,0,0,0.12) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Title badge — top left */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        style={{
          position: 'absolute',
          top: 18,
          left: 18,
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 12,
          padding: '6px 14px',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: '#4d6b35', letterSpacing: '-0.01em' }}>
          🍓 Serre Fraisier
        </span>
      </motion.div>

      {/* Centered Harvest AI card */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
      }}>
        <HarvestCard />
      </div>

      {/* Vision 3D button — bottom right */}
      <div style={{
        position: 'absolute',
        bottom: 18,
        right: 18,
      }}>
        <Vision3DButton onClick={() => navigate('/3d')} />
      </div>
    </motion.div>
  )
}
