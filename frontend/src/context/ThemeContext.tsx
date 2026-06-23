import { createContext, useContext, useState, useMemo } from 'react'
import { createTheme, Theme } from '@mui/material/styles'

type ColorMode = 'dark' | 'light'

interface ThemeModeCtx {
  mode: ColorMode
  toggle: () => void
  theme: Theme
}

const Ctx = createContext<ThemeModeCtx>({} as ThemeModeCtx)

function buildTheme(mode: ColorMode): Theme {
  const dark = mode === 'dark'
  return createTheme({
    palette: {
      mode,
      primary:    { main: dark ? '#00aaff' : '#0060c8', light: dark ? '#33bbff' : '#3380e0', dark: dark ? '#0077cc' : '#004aa0' },
      secondary:  { main: dark ? '#00ffcc' : '#00a88a' },
      error:      { main: '#e8334a' },
      warning:    { main: '#f59e0b' },
      success:    { main: dark ? '#00e87a' : '#0ea86a' },
      background: {
        default: dark ? '#060d1e' : '#f0f4f9',
        paper:   dark ? 'rgba(10,22,48,0.92)' : '#ffffff',
      },
      text: {
        primary:   dark ? '#e2ecf8' : '#111827',
        secondary: dark ? '#8aaccc' : '#4b5e7a',
      },
      divider: dark ? 'rgba(0,170,255,0.1)' : 'rgba(0,80,160,0.1)',
    },
    typography: {
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      h5: { fontWeight: 700, letterSpacing: '-0.02em' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em' },
      body1: { fontSize: '0.9rem' },
      body2: { fontSize: '0.8rem' },
      caption: { fontFamily: '"JetBrains Mono", monospace', fontSize: '0.72rem' },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: dark ? '#060d1e' : '#f0f4f9',
            color:           dark ? '#e2ecf8' : '#111827',
            scrollbarColor:  dark
              ? 'rgba(0,170,255,0.22) transparent'
              : 'rgba(0,100,180,0.18) transparent',
            '&::-webkit-scrollbar':       { width: 5 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: 3,
              background: dark ? 'rgba(0,170,255,0.22)' : 'rgba(0,100,180,0.18)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: dark ? 'rgba(10,22,48,0.88)' : '#ffffff',
            backdropFilter:  dark ? 'blur(16px)' : 'none',
            border: `1px solid ${dark ? 'rgba(0,170,255,0.09)' : 'rgba(0,80,160,0.09)'}`,
            boxShadow: dark ? 'none' : '0 1px 6px rgba(0,0,0,0.07)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
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
            borderBottom: `1px solid ${dark ? 'rgba(0,170,255,0.06)' : 'rgba(0,80,160,0.07)'}`,
          },
          head: {
            color:      dark ? '#8aaccc' : '#4b5e7a',
            fontWeight: 600,
            fontSize:   '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: { '&.Mui-checked': { color: dark ? '#00aaff' : '#0060c8' } },
          track:      { '.Mui-checked.Mui-checked + &': { backgroundColor: dark ? '#00aaff' : '#0060c8' } },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            color:       dark ? '#8aaccc' : '#4b5e7a',
            borderColor: dark ? 'rgba(0,170,255,0.18)' : 'rgba(0,80,160,0.15)',
            '&.Mui-selected': {
              backgroundColor: dark ? 'rgba(0,170,255,0.12)' : 'rgba(0,96,200,0.09)',
              color:           dark ? '#00aaff' : '#0060c8',
              '&:hover': {
                backgroundColor: dark ? 'rgba(0,170,255,0.18)' : 'rgba(0,96,200,0.14)',
              },
            },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: dark ? 'rgba(0,170,255,0.05)' : 'rgba(0,0,0,0.06)',
          },
        },
      },
    },
  })
}

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ColorMode>(
    () => (localStorage.getItem('serre-color-mode') as ColorMode) ?? 'dark'
  )

  const toggle = () =>
    setMode((m) => {
      const next = m === 'dark' ? 'light' : 'dark'
      localStorage.setItem('serre-color-mode', next)
      return next
    })

  const theme = useMemo(() => buildTheme(mode), [mode])

  return <Ctx.Provider value={{ mode, toggle, theme }}>{children}</Ctx.Provider>
}

export const useThemeMode = () => useContext(Ctx)
