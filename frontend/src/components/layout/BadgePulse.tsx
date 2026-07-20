import { Box } from '@mui/material'

export default function BadgePulse({ count }: { count: number }) {
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 16, height: 16, borderRadius: '50%',
      background: '#EF4444', color: '#fff', fontSize: '0.55rem', fontWeight: 700,
      lineHeight: 1,
    }}>
      {count > 9 ? '9+' : count}
    </Box>
  )
}
