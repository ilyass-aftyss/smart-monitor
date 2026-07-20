import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/**
 * Premium blob cursor that follows the mouse with spring lag.
 * The outer ring scales up on hover over interactive elements.
 * Hidden on touch devices via CSS (@media pointer: coarse).
 */
export default function CustomCursor() {
  const outerRef = useRef<HTMLDivElement>(null)
  const dotRef   = useRef<HTMLDivElement>(null)

  // Raw mouse position (dot — immediate)
  const dotX = useMotionValue(-100)
  const dotY = useMotionValue(-100)

  // Spring-lagged for the outer ring
  const rawX = useMotionValue(-100)
  const rawY = useMotionValue(-100)
  const springX = useSpring(rawX, { stiffness: 120, damping: 22, mass: 0.6 })
  const springY = useSpring(rawY, { stiffness: 120, damping: 22, mass: 0.6 })

  const [hovered, setHovered] = useState(false)
  const [clicking, setClicking] = useState(false)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      dotX.set(e.clientX)
      dotY.set(e.clientY)
      rawX.set(e.clientX)
      rawY.set(e.clientY)
    }

    const INTERACTIVE = 'button, a, [role="button"], input, select, textarea, label, [tabindex], .MuiButtonBase-root, .MuiIconButton-root, nav div[onClick], nav div[style*="cursor: pointer"]'

    const onEnter = (e: MouseEvent) => {
      if ((e.target as Element)?.closest?.(INTERACTIVE)) setHovered(true)
    }
    const onLeave = (e: MouseEvent) => {
      if ((e.target as Element)?.closest?.(INTERACTIVE)) setHovered(false)
    }

    const onDown = () => setClicking(true)
    const onUp   = () => setClicking(false)

    window.addEventListener('mousemove',  onMove)
    window.addEventListener('mouseover',  onEnter)
    window.addEventListener('mouseout',   onLeave)
    window.addEventListener('mousedown',  onDown)
    window.addEventListener('mouseup',    onUp)

    return () => {
      window.removeEventListener('mousemove',  onMove)
      window.removeEventListener('mouseover',  onEnter)
      window.removeEventListener('mouseout',   onLeave)
      window.removeEventListener('mousedown',  onDown)
      window.removeEventListener('mouseup',    onUp)
    }
  }, [dotX, dotY, rawX, rawY])

  return (
    <>
      {/* Outer spring-lagged ring */}
      <motion.div
        ref={outerRef}
        className={`custom-cursor-outer${hovered ? ' hover' : ''}`}
        style={{
          x: springX,
          y: springY,
          scale: clicking ? 0.75 : hovered ? 1.4 : 1,
        }}
        transition={{ scale: { type: 'spring', stiffness: 300, damping: 20 } }}
      />
      {/* Inner dot — immediate */}
      <motion.div
        ref={dotRef}
        className="custom-cursor-dot"
        style={{ x: dotX, y: dotY }}
      />
    </>
  )
}
