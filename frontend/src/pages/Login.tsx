import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material'
import { motion } from 'framer-motion'
import { authApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useThemeMode } from '../context/ThemeContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { mode, toggle } = useThemeMode()
  const dark = mode === 'dark'

  const [username,     setUsername]     = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const handleLogin = async () => {
    if (!username || !password) { setError('Veuillez remplir tous les champs'); return }
    setLoading(true); setError('')
    try {
      const { data } = await authApi.login(username, password)
      login(data.access_token, data.role, data.username)
      navigate('/dashboard')
    } catch {
      setError('Identifiants incorrects. Essayez admin / admin')
    } finally {
      setLoading(false)
    }
  }

  const primary     = dark ? '#00aaff' : '#0070d4'
  const textPri     = dark ? '#e2ecf8' : '#1a2540'
  const textSec     = dark ? '#8aaccc' : '#5a7090'
  const border      = dark ? 'rgba(0,170,255,0.2)' : 'rgba(0,112,212,0.15)'
  const fieldBorder = dark ? 'rgba(0,170,255,0.2)' : 'rgba(0,112,212,0.2)'

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      color: textPri,
      '& fieldset': { borderColor: fieldBorder },
      '&:hover fieldset': { borderColor: primary },
      '&.Mui-focused fieldset': { borderColor: primary },
    },
    '& .MuiInputLabel-root': { color: textSec },
    '& .MuiInputLabel-root.Mui-focused': { color: primary },
  }

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: dark
        ? 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,80,180,0.18) 0%, transparent 70%), #060d1e'
        : '#f0f4f8',
      overflow: 'hidden', position: 'relative',
    }}>
      {dark && (
        <Box sx={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(0,170,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,170,255,0.025) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
      )}

      {/* Theme toggle */}
      <Box
        onClick={toggle}
        sx={{
          position: 'fixed', top: 20, right: 20,
          px: 1.4, py: 0.6, borderRadius: '20px', cursor: 'pointer', userSelect: 'none',
          border: `1px solid ${border}`, bgcolor: dark ? 'rgba(0,170,255,0.06)' : '#fff',
          boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
          '&:hover': { borderColor: primary },
          display: 'flex', alignItems: 'center',
        }}
      >
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: primary, fontFamily: '"JetBrains Mono", monospace', whiteSpace: 'nowrap' }}>
          {dark ? '☀ Mode clair' : '◑ Mode sombre'}
        </Typography>
      </Box>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <Box sx={{
          width: 420,
          background: dark ? 'rgba(10,22,48,0.92)' : '#ffffff',
          backdropFilter: dark ? 'blur(24px)' : 'none',
          border: `1px solid ${border}`,
          borderRadius: '20px',
          p: 5,
          boxShadow: dark ? '0 0 60px rgba(0,100,200,0.18)' : '0 8px 40px rgba(0,0,0,0.1)',
          position: 'relative', overflow: 'hidden',
          '&::before': {
            content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: `linear-gradient(90deg, transparent, ${primary}, transparent)`,
          },
        }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              width: 56, height: 56, borderRadius: '14px', mx: 'auto', mb: 2,
              background: dark
                ? 'linear-gradient(135deg, rgba(0,100,200,0.28), rgba(0,255,200,0.18))'
                : 'linear-gradient(135deg, rgba(0,112,212,0.1), rgba(0,185,156,0.08))',
              border: `1px solid ${border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', boxShadow: dark ? `0 0 20px ${primary}44` : 'none',
            }}>
              🌿
            </Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: textPri, mb: 0.5, letterSpacing: '-0.02em' }}>
              Smart Monitor
            </Typography>
            <Typography variant="body2" sx={{ color: textSec }}>
              Plateforme de surveillance environnementale
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, bgcolor: 'rgba(232,51,74,0.08)', border: '1px solid rgba(232,51,74,0.22)', color: '#e8334a', fontSize: '0.82rem' }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth label="Nom d'utilisateur" value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              sx={fieldSx}
            />
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                sx={fieldSx}
              />
              <Box
                onClick={() => setShowPassword((v) => !v)}
                sx={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, color: textSec,
                  fontFamily: '"JetBrains Mono", monospace', userSelect: 'none',
                  '&:hover': { color: primary },
                  transition: 'color 0.15s',
                }}
              >
                {showPassword ? 'Cacher' : 'Voir'}
              </Box>
            </Box>
            <Button
              fullWidth variant="contained" size="large"
              onClick={handleLogin} disabled={loading}
              sx={{
                mt: 0.5, py: 1.5, fontSize: '0.95rem', borderRadius: '10px', fontWeight: 700,
                background: `linear-gradient(135deg, ${dark ? '#0055aa' : '#004da0'}, ${primary})`,
                boxShadow: `0 4px 16px ${primary}44`,
                letterSpacing: '0.02em',
                '&:hover': { boxShadow: `0 6px 24px ${primary}55` },
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Connexion'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, p: 1.8, bgcolor: dark ? 'rgba(0,170,255,0.04)' : 'rgba(0,112,212,0.04)', border: `1px solid ${fieldBorder}`, borderRadius: '10px' }}>
            <Typography sx={{ fontSize: '0.62rem', color: textSec, fontFamily: '"JetBrains Mono", monospace', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Comptes de démonstration
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: primary, fontFamily: '"JetBrains Mono", monospace', display: 'block' }}>
              admin / admin — accès complet
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: dark ? '#00e87a' : '#10b981', fontFamily: '"JetBrains Mono", monospace', display: 'block' }}>
              viewer / admin — consultation
            </Typography>
          </Box>
        </Box>
      </motion.div>
    </Box>
  )
}
