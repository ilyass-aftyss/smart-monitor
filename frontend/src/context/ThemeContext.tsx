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
      primary:    { main: dark ? '#00aaff' : '#0070d4', light: dark ? '#33bbff' : '#3394e8', dark: dark ? '#0077cc' : '#0050a0' },
      secondary:  { main: dark ? '#00ffcc' : '#00b89c' },
      error:      { main: '#e8334a' },
      warning:    { main: '#f59e0b' },
      success:    { main: dark ? '#00e87a' : '#10b981' },
      background: {
        default: dark ? '#060d1e' : '#f0f4f8',
        paper:   dark ? 'rgba(10,22,48,0.92)' : '#ffffff',
      },
      text: {
        primary:   dark ? '#e2ecf8' : '#1a2540',
        secondary: dark ? '#8aaccc' : '#5a7090',
      },
      divider: dark ? 'rgba(0,170,255,0.1)' : 'rgba(0,100,180,0.12)',
    },
    typography: {
      fontFamily: '"Inter", system-ui, sans-serif',
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
      body1: { fontSize: '0.9rem' },
      body2: { fontSize: '0.8rem' },
      caption: { fontFamily: '"JetBrains Mono", monospace', fontSize: '0.72rem' },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: dark ? '#060d1e' : '#f0f4f8',
            scrollbarColor: dark ? 'rgba(0,170,255,0.3) rgba(10,20,40,0.5)' : 'rgba(0,100,180,0.2) rgba(240,244,248,0.8)',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { borderRadius: 3, background: dark ? 'rgba(0,170,255,0.25)' : 'rgba(0,100,180,0.2)' },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: dark ? 'rgba(10,22,48,0.88)' : '#ffffff',
            backdropFilter: dark ? 'blur(16px)' : 'none',
            border: `1px solid ${dark ? 'rgba(0,170,255,0.1)' : 'rgba(0,80,160,0.1)'}`,
            boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
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
