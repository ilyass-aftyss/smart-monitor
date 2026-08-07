// Legacy export — theme is now managed dynamically via ThemeContext
// This file is kept for backward compatibility only.
import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary:    { main: '#0D98BA' },
    secondary:  { main: '#0DAABA' },
    background: { default: '#F0F9FC', paper: '#FFFFFF' },
  },
})
