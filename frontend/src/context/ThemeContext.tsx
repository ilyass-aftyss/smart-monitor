import { createContext, useContext, useMemo } from 'react'
import { createTheme, Theme } from '@mui/material/styles'

type ColorMode = 'light'

interface ThemeModeCtx {
  mode: ColorMode
  toggle: () => void
  theme: Theme
}

const Ctx = createContext<ThemeModeCtx>({} as ThemeModeCtx)

function buildTheme(): Theme {
  return createTheme({
    palette: {
      mode: 'light',
      primary:    { main: '#0D98BA', light: '#88F4FF', dark: '#097782' },
      secondary:  { main: '#0DAABA' },
      error:      { main: '#EF4444' },
      warning:    { main: '#F59E0B' },
      success:    { main: '#80EA9E' },
      background: {
        default: '#F0F9FC',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#0D3040',
        secondary: '#6B7280',
      },
      divider: 'rgba(13, 152, 186, 0.1)',
    },
    typography: {
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      h5: { fontWeight: 600, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em' },
      body1: { fontSize: '0.85rem', lineHeight: 1.5 },
      body2: { fontSize: '0.8rem' },
      caption: { fontFamily: '"JetBrains Mono", monospace', fontSize: '0.72rem' },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: 'linear-gradient(135deg, #E8F4F8 0%, #F0F9FC 100%)',
            color: '#0D3040',
            scrollbarColor: 'rgba(13,152,186,0.18) transparent',
            '&::-webkit-scrollbar':       { width: 5 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: 3,
              background: 'rgba(13,152,186,0.18)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(13,152,186,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: '1px solid rgba(13,152,186,0.07)',
          },
          head: {
            color: '#6B7280',
            fontWeight: 600,
            fontSize: '0.72rem',
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: { '&.Mui-checked': { color: '#0D98BA' } },
          track:      { '.Mui-checked.Mui-checked + &': { backgroundColor: '#0D98BA' } },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            color:       '#6B7280',
            borderColor: 'rgba(13,152,186,0.15)',
            '&.Mui-selected': {
              backgroundColor: 'rgba(13,152,186,0.12)',
              color: '#0D98BA',
              '&:hover': {
                backgroundColor: 'rgba(13,152,186,0.18)',
              },
            },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgba(0,0,0,0.07)',
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgba(0,0,0,0.06)',
          },
        },
      },
    },
  })
}

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const mode: ColorMode = 'light'
  const theme = useMemo(() => buildTheme(), [])

  return <Ctx.Provider value={{ mode, toggle: () => undefined, theme }}>{children}</Ctx.Provider>
}

export const useThemeMode = () => useContext(Ctx)
