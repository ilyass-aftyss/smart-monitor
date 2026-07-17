import { Box } from '@mui/material'
import { motion } from 'framer-motion'

export default function BadgePulse({ count }: { count: number }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {count > 0 && (
        <Box sx={{
          position: 'absolute',
          width: 16, height: 16, borderRadius: '50%',
          background: 'rgba(232,51,74,0.5)',
          animation: 'badge-ring 1.4s ease-out infinite',
          '@keyframes badge-ring': {
            '0%':   { transform: 'scale(1)',   opacity: 0.8 },
            '100%': { transform: 'scale(2.4)', opacity: 0 },
          },
        }} />
      )}
      <motion.span
        animate={count > 0 ? {
          scale: [1, 1.22, 1],
          transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' },
        } : { scale: 1 }}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 16, height: 16, borderRadius: '50%',
          background: '#e8334a', color: '#fff', fontSize: '0.55rem', fontWeight: 700,
          lineHeight: 1,
          boxShadow: count > 0 ? '0 0 8px rgba(232,51,74,0.7)' : 'none',
          position: 'relative', zIndex: 1,
        }}
      >
        {count > 9 ? '9+' : count}
      </motion.span>
    </Box>
  )
}
