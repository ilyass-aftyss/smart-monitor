// Legacy export — theme is now managed dynamically via ThemeContext
// This file is kept for backward compatibility only.
import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary:    { main: '#00aaff' },
    secondary:  { main: '#00ffcc' },
    background: { default: '#060d1e', paper: 'rgba(10,22,48,0.9)' },
  },
})
