import { motion } from 'framer-motion'

interface AnimatedTitleProps {
  text: string
  /** Optional sx-style inline styles for the outer container */
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'div'
  shimmer?: boolean
}

/**
 * Per-word blur → focus entrance animation.
 * Each word blurs in from below, then resolves sharply.
 * Optional shimmer sweep after all words land.
 */
export default function AnimatedTitle({
  text,
  className = '',
  as: Tag = 'span',
  shimmer = false,
}: AnimatedTitleProps) {
  const words = text.split(' ')

  return (
    <Tag
      className={className}
      style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.3em', alignItems: 'baseline' }}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 18, filter: 'blur(10px)', letterSpacing: '0.15em' }}
          animate={{ opacity: 1, y: 0,  filter: 'blur(0px)',  letterSpacing: '0em' }}
          transition={{
            duration: 0.55,
            delay: i * 0.1,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
        >
          {/* Shimmer span wraps the word after blur resolves */}
          {shimmer ? (
            <motion.span
              initial={{ backgroundPosition: '-200% center' }}
              animate={{ backgroundPosition: '200% center' }}
              transition={{ duration: 1.8, delay: i * 0.1 + 0.8, ease: 'linear' }}
              style={{
                background: 'linear-gradient(90deg, currentColor 0%, #00aaff 45%, currentColor 60%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {word}
            </motion.span>
          ) : word}
        </motion.span>
      ))}
    </Tag>
  )
}
