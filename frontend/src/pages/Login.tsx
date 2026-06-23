import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, TextField, Button, Typography, Alert, CircularProgress, InputAdornment, IconButton } from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
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

  const bg      = dark ? '#060d1e' : '#f0f4f8'
  const cardBg  = dark ? 'rgba(10,22,48,0.92)' : '#ffffff'
  const border  = dark ? 'rgba(0,170,255,0.2)' : 'rgba(0,112,212,0.15)'
  const primary = dark ? '#00aaff' : '#0070d4'
  const textPri = dark ? '#e2ecf8' : '#1a2540'
  const textSec = dark ? '#8aaccc' : '#5a7090'
  const fieldBorder = dark ? 'rgba(0,170,255,0.2)' : 'rgba(0,112,212,0.2)'
  const fieldFocus  = dark ? '#00aaff' : '#0070d4'

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      color: textPri,
      '& fieldset': { borderColor: fieldBorder },
      '&:hover fieldset': { borderColor: primary },
      '&.Mui-focused fieldset': { borderColor: fieldFocus },
    },
    '& .MuiInputLabel-root': { color: textSec },
    '& .MuiInputLabel-root.Mui-focused': { color: fieldFocus },
  }

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: dark
        ? 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,80,180,0.18) 0%, transparent 70%), #060d1e'
        : '#f0f4f8',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* Grid background (dark only) */}
      {dark && (
        <Box sx={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(0,170,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,170,255,0.03) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
      )}

      {/* Mode toggle button */}
      <Box
        onClick={toggle}
        sx={{
          position: 'fixed', top: 20, right: 20,
          px: 1.5, py: 0.7, borderRadius: '20px', cursor: 'pointer',
          border: `1px solid ${border}`, bgcolor: dark ? 'rgba(0,170,255,0.06)' : '#fff',
          boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
          '&:hover': { borderColor: primary },
        }}
      >
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: primary, fontFamily: '"JetBrains Mono", monospace', whiteSpace: 'nowrap' }}>
          {dark ? 'Mode clair' : 'Mode sombre'}
        </Typography>
      </Box>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Box sx={{
          width: 420,
          background: cardBg,
          backdropFilter: dark ? 'blur(24px)' : 'none',
          border: `1px solid ${border}`,
          borderRadius: '20px',
          p: 5,
          boxShadow: dark ? '0 0 60px rgba(0,100,200,0.2)' : '0 8px 40px rgba(0,0,0,0.1)',
          position: 'relative', overflow: 'hidden',
          '&::before': {
            content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: `linear-gradient(90deg, transparent, ${primary}, transparent)`,
          },
        }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              width: 60, height: 60, borderRadius: '16px', mx: 'auto', mb: 2,
              background: dark ? 'linear-gradient(135deg, rgba(0,100,200,0.3), rgba(0,255,200,0.2))' : 'linear-gradient(135deg, rgba(0,112,212,0.12), rgba(0,185,156,0.1))',
              border: `1px solid ${border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '26px', boxShadow: dark ? `0 0 20px ${primary}44` : 'none',
            }}>
              🌿
            </Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: textPri, mb: 0.5 }}>Smart Monitor</Typography>
            <Typography variant="body2" sx={{ color: textSec }}>Plateforme de surveillance environnementale</Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(232,51,74,0.08)', border: '1px solid rgba(232,51,74,0.25)', color: '#e8334a' }}>
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
            <TextField
              fullWidth label="Mot de passe" type={showPassword ? 'text' : 'password'}
              value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword((v) => !v)} sx={{ color: textSec }}>
                      {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={fieldSx}
            />
            <Button
              fullWidth variant="contained" size="large"
              onClick={handleLogin} disabled={loading}
              sx={{
                mt: 0.5, py: 1.5, fontSize: '0.95rem', borderRadius: '10px', fontWeight: 700,
                background: `linear-gradient(135deg, ${dark ? '#0066bb' : '#0055a0'}, ${primary})`,
                boxShadow: `0 4px 16px ${primary}44`,
                '&:hover': { boxShadow: `0 6px 24px ${primary}66` },
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Connexion'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, p: 1.8, bgcolor: dark ? 'rgba(0,170,255,0.04)' : 'rgba(0,112,212,0.04)', border: `1px solid ${fieldBorder}`, borderRadius: '10px' }}>
            <Typography sx={{ fontSize: '0.65rem', color: textSec, fontFamily: '"JetBrains Mono", monospace', mb: 0.5 }}>
              Comptes de démonstration :
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
