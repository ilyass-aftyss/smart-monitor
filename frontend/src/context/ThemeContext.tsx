import { createContext, useContext, useState, useMemo, useEffect } from 'react'
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
      primary:    { main: '#0D98BA', light: '#88F4FF', dark: '#097782' },
      secondary:  { main: '#0DAABA' },
      error:      { main: '#EF4444' },
      warning:    { main: '#F59E0B' },
      success:    { main: '#80EA9E' },
      background: {
        default: dark ? '#091E24' : '#F0F9FC',
        paper:   dark ? '#102A33' : '#FFFFFF',
      },
      text: {
        primary:   dark ? '#C4F9FF' : '#0D3040',
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
            backgroundColor: dark ? '#091E24' : '#F0F9FC',
            color:           dark ? '#C4F9FF' : '#0D3040',
            scrollbarColor:  dark
              ? 'rgba(13,152,186,0.22) transparent'
              : 'rgba(13,152,186,0.18) transparent',
            '&::-webkit-scrollbar':       { width: 5 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: 3,
              background: dark ? 'rgba(13,152,186,0.22)' : 'rgba(13,152,186,0.18)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: dark ? '#102A33' : '#FFFFFF',
            border: `1px solid rgba(13,152,186,0.1)`,
            boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
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
            borderBottom: `1px solid ${dark ? 'rgba(13,152,186,0.06)' : 'rgba(13,152,186,0.07)'}`,
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
            backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: dark ? 'rgba(13,152,186,0.05)' : 'rgba(0,0,0,0.06)',
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

  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [mode])

  return <Ctx.Provider value={{ mode, toggle, theme }}>{children}</Ctx.Provider>
}

export const useThemeMode = () => useContext(Ctx)
