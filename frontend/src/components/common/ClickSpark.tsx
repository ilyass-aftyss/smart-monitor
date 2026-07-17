import { useState, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SparkParticle {
  id: number
  angle: number
  originX: number
  originY: number
}

let _id = 0

interface ClickSparkWrapperProps {
  children: ReactNode
  color?: string
  count?: number
  style?: React.CSSProperties
  className?: string
}

/**
 * Wraps any element. On click, emits radial spark particles from the click point.
 * Usage: <ClickSparkWrapper color="#00aaff"><button>...</button></ClickSparkWrapper>
 */
export default function ClickSparkWrapper({
  children,
  color = '#00aaff',
  count = 8,
  style,
  className,
}: ClickSparkWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [particles, setParticles] = useState<SparkParticle[]>([])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const newParticles: SparkParticle[] = Array.from({ length: count }, (_, i) => ({
      id: _id++,
      angle: (360 / count) * i,
      originX: x,
      originY: y,
    }))
    setParticles(prev => [...prev, ...newParticles])
    const ids = new Set(newParticles.map(p => p.id))
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !ids.has(p.id)))
    }, 750)
  }

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'relative', display: 'inline-flex', ...style }}
      className={className}
      onClick={handleClick}
    >
      {children}
      <AnimatePresence>
        {particles.map(p => {
          const rad = (p.angle * Math.PI) / 180
          const dist = 30 + Math.random() * 16
          const tx = Math.cos(rad) * dist
          const ty = Math.sin(rad) * dist
          return (
            <motion.span
              key={p.id}
              initial={{ opacity: 1, x: p.originX - 3, y: p.originY - 3, scale: 1 }}
              animate={{ opacity: 0, x: p.originX - 3 + tx, y: p.originY - 3 + ty, scale: 0 }}
              transition={{ duration: 0.65, ease: [0.2, 0.8, 0.4, 1] }}
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: 6, height: 6,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 8px 2px ${color}`,
                pointerEvents: 'none',
                zIndex: 9999,
              }}
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}
