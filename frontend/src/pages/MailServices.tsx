import { useState, useEffect } from 'react'
import {
  Box, Typography, Paper, TextField, IconButton, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Switch, Chip, Divider, Tooltip,
} from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import SendIcon from '@mui/icons-material/Send'
import SettingsIcon from '@mui/icons-material/Settings'
import SaveIcon from '@mui/icons-material/Save'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { useThemeMode } from '../context/ThemeContext'

interface SensorThreshold {
  id: string
  label: string
  unit: string
  min: number
  max: number
  enabled: boolean
  icon: string
}

interface EmailEntry {
  address: string
  validated: boolean
}

const DEFAULT_THRESHOLDS: SensorThreshold[] = [
  { id: 'temperature',   label: 'Température',      unit: '°C',  min: 15, max: 30, enabled: true,  icon: '🌡' },
  { id: 'humidity',      label: 'Humidité',         unit: '%',   min: 40, max: 80, enabled: true,  icon: '💧' },
  { id: 'co2',           label: 'CO₂',              unit: 'ppm', min: 300, max: 1200, enabled: false, icon: '💨' },
  { id: 'light',         label: 'Intensité lumineuse', unit: 'lux', min: 10000, max: 60000, enabled: false, icon: '☀' },
  { id: 'photoperiod',   label: 'Photopériode',     unit: 'h',   min: 12, max: 18, enabled: false, icon: '⏰' },
  { id: 'irrigation',    label: 'Irrigation',        unit: 'L/m²', min: 1, max: 6, enabled: false,  icon: '💦' },
]

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function MailServicesPage() {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'

  const [emails, setEmails] = useState<EmailEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('mail-emails') || '[]') }
    catch { return [] }
  })
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [thresholds, setThresholds] = useState<SensorThreshold[]>(() => {
    try {
      const saved = localStorage.getItem('mail-thresholds')
      if (saved) return JSON.parse(saved)
    } catch {}
    return DEFAULT_THRESHOLDS.map(t => ({ ...t }))
  })
  const [saved, setSaved] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [expanded, setExpanded] = useState(true)

  useEffect(() => { localStorage.setItem('mail-emails', JSON.stringify(emails)) }, [emails])
  useEffect(() => { localStorage.setItem('mail-thresholds', JSON.stringify(thresholds)) }, [thresholds])

  function addEmail() {
    const e = newEmail.trim()
    if (!e) { setEmailError('Veuillez entrer une adresse e-mail'); return }
    if (!validateEmail(e)) { setEmailError('Adresse e-mail invalide'); return }
    if (emails.some(em => em.address === e)) { setEmailError('Cette adresse existe déjà'); return }
    setEmails(prev => [...prev, { address: e, validated: true }])
    setNewEmail('')
    setEmailError('')
  }

  function removeEmail(address: string) {
    setEmails(prev => prev.filter(e => e.address !== address))
  }

  function updateThreshold(id: string, field: 'min' | 'max' | 'enabled', value: number | boolean) {
    setThresholds(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  function saveConfig() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function sendTest() {
    if (emails.length === 0) return
    setTestStatus('sending')
    setTimeout(() => {
      setTestStatus(Math.random() > 0.2 ? 'sent' : 'error')
      setTimeout(() => setTestStatus('idle'), 2500)
    }, 1200)
  }

  const surface = dark ? '#1A2E1F' : '#FFFFFF'
  const border = 'rgba(16,185,129,0.1)'
  const textPrimary = dark ? '#F0FDF4' : '#1A2E1A'
  const textSecondary = '#6B7280'
  const accent = '#10B981'
  const danger = '#EF4444'

  return (
    <Box sx={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: textPrimary, display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon sx={{ color: accent }} />
            Services Mail
          </Typography>
          <Typography variant="body2" sx={{ color: textSecondary, mt: 0.3, fontSize: '0.78rem' }}>
            Configuration des alertes par e-mail pour les mesures de la serre
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={sendTest}
            disabled={emails.length === 0 || testStatus === 'sending'}
            startIcon={<SendIcon fontSize="small" />}
            sx={{
              borderColor: border, color: textSecondary, fontSize: '0.72rem',
              '&:hover': { borderColor: accent, color: accent },
            }}
          >
            {testStatus === 'sending' ? 'Envoi...' : testStatus === 'sent' ? 'Envoyé ✓' : testStatus === 'error' ? 'Échec' : 'Test'}
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={saveConfig}
            startIcon={saved ? <CheckCircleIcon fontSize="small" /> : <SaveIcon fontSize="small" />}
            sx={{
              bgcolor: accent, color: '#fff', fontSize: '0.72rem',
              '&:hover': { bgcolor: '#059669' },
              transition: 'all 0.2s',
            }}
          >
            {saved ? 'Enregistré ✓' : 'Enregistrer'}
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, flex: 1, overflow: 'hidden' }}>
        <Paper sx={{
          p: 2, width: 300, flexShrink: 0, height: '100%', borderRadius: '12px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          bgcolor: surface, border: `1px solid ${border}`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <EmailIcon sx={{ fontSize: '0.9rem', color: accent }} />
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: textPrimary }}>
              Destinataires
            </Typography>
            <Chip label={emails.length} size="small" sx={{
              height: 18, fontSize: '0.6rem', color: '#fff', bgcolor: accent,
              fontWeight: 700, ml: 'auto',
            }} />
          </Box>

          <Box sx={{ display: 'flex', gap: 0.8, mb: 1.5 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="email@exemple.com"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); setEmailError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') addEmail() }}
              error={!!emailError}
              helperText={emailError}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.75rem', borderRadius: '8px',
                  bgcolor: dark ? '#0F1F14' : '#F8FAF9',
                  '& fieldset': { borderColor: border },
                  '&:hover fieldset': { borderColor: accent + '44' },
                  '&.Mui-focused fieldset': { borderColor: accent + '88' },
                },
                '& .MuiFormHelperText-root': { fontSize: '0.6rem', m: '2px 0 0 4px', color: danger },
              }}
            />
            <IconButton onClick={addEmail} sx={{
              bgcolor: accent, color: '#fff', borderRadius: '8px', width: 36, height: 36,
              '&:hover': { bgcolor: '#059669' },
            }}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {emails.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: textSecondary, fontSize: '0.7rem', mt: 4, opacity: 0.4 }}>
                Aucun destinataire
              </Typography>
            ) : emails.map((entry) => (
              <Paper key={entry.address} sx={{
                px: 1.5, py: 1, borderRadius: '8px',
                display: 'flex', alignItems: 'center', gap: 1,
                bgcolor: dark ? '#0F1F14' : '#F8FAF9',
                border: `1px solid ${border}`,
              }}>
                <Box sx={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  bgcolor: entry.validated ? accent : '#F59E0B',
                }} />
                <Typography sx={{ flex: 1, fontSize: '0.75rem', color: textPrimary, fontFamily: '"JetBrains Mono", monospace' }}>
                  {entry.address}
                </Typography>
                <Tooltip title="Supprimer">
                  <IconButton size="small" onClick={() => removeEmail(entry.address)}
                    sx={{ color: textSecondary, opacity: 0.4, '&:hover': { opacity: 1, color: danger }, width: 24, height: 24 }}>
                    <DeleteIcon sx={{ fontSize: '0.8rem' }} />
                  </IconButton>
                </Tooltip>
              </Paper>
            ))}
          </Box>

          <Divider sx={{ my: 1.5, borderColor: border }} />

          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
            color: textSecondary, fontSize: '0.68rem',
          }}>
            <InfoOutlinedIcon sx={{ fontSize: '0.8rem' }} />
            <Typography sx={{ fontSize: '0.68rem', color: 'inherit' }}>
              Les alertes sont envoyées à tous les destinataires lorsque les seuils sont dépassés.
            </Typography>
          </Box>
        </Paper>

        <Paper sx={{
          p: 2, flex: 1, borderRadius: '12px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          bgcolor: surface, border: `1px solid ${border}`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <SettingsIcon sx={{ fontSize: '0.9rem', color: accent }} />
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: textPrimary }}>
              Seuils des capteurs
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: textSecondary, ml: 1, opacity: 0.5 }}>
              Définissez les intervalles pour chaque capteur
            </Typography>
          </Box>

          <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
            <Table size="small" sx={{ minWidth: 500 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 700, color: textSecondary, borderBottom: `1px solid ${border}`, py: 1 }}>Capteur</TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.65rem', fontWeight: 700, color: textSecondary, borderBottom: `1px solid ${border}`, py: 1 }}>Seuil Min</TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.65rem', fontWeight: 700, color: textSecondary, borderBottom: `1px solid ${border}`, py: 1 }}>Seuil Max</TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.65rem', fontWeight: 700, color: textSecondary, borderBottom: `1px solid ${border}`, py: 1 }}>Alerte</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {thresholds.map((sensor) => (
                  <TableRow key={sensor.id} sx={{
                    '&:last-child td': { borderBottom: 'none' },
                    opacity: sensor.enabled ? 1 : 0.5,
                  }}>
                    <TableCell sx={{ borderBottom: `1px solid ${border}`, py: 1.2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Typography sx={{ fontSize: '1rem' }}>{sensor.icon}</Typography>
                        <Box>
                          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: textPrimary }}>{sensor.label}</Typography>
                          <Typography sx={{ fontSize: '0.62rem', color: textSecondary, fontFamily: '"JetBrains Mono", monospace' }}>{sensor.unit}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: `1px solid ${border}`, py: 1.2 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={sensor.min}
                        onChange={(e) => updateThreshold(sensor.id, 'min', parseFloat(e.target.value) || 0)}
                        disabled={!sensor.enabled}
                        sx={{
                          width: 90,
                          '& .MuiOutlinedInput-root': {
                            fontSize: '0.75rem', borderRadius: '8px',
                            fontFamily: '"JetBrains Mono", monospace',
                            bgcolor: dark ? '#0F1F14' : '#F8FAF9',
                            '& fieldset': { borderColor: border },
                            '&:hover fieldset': { borderColor: accent + '44' },
                            '&.Mui-focused fieldset': { borderColor: accent + '88' },
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: `1px solid ${border}`, py: 1.2 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={sensor.max}
                        onChange={(e) => updateThreshold(sensor.id, 'max', parseFloat(e.target.value) || 0)}
                        disabled={!sensor.enabled}
                        sx={{
                          width: 90,
                          '& .MuiOutlinedInput-root': {
                            fontSize: '0.75rem', borderRadius: '8px',
                            fontFamily: '"JetBrains Mono", monospace',
                            bgcolor: dark ? '#0F1F14' : '#F8FAF9',
                            '& fieldset': { borderColor: border },
                            '&:hover fieldset': { borderColor: accent + '44' },
                            '&.Mui-focused fieldset': { borderColor: accent + '88' },
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: `1px solid ${border}`, py: 1.2 }}>
                      <Switch
                        checked={sensor.enabled}
                        onChange={(e) => updateThreshold(sensor.id, 'enabled', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-thumb': { bgcolor: sensor.enabled ? accent : '#6B7280' },
                          '& .MuiSwitch-track': { bgcolor: sensor.enabled ? accent + '44' : '#555' },
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 1.5, borderColor: border }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <WarningAmberIcon sx={{ fontSize: '0.85rem', color: '#F59E0B', opacity: 0.7 }} />
            <Typography sx={{ fontSize: '0.68rem', color: textSecondary, flex: 1 }}>
              Les alertes sont envoyées lorsque les mesures dépassent les seuils définis pendant au moins 2 minutes consécutives.
            </Typography>
            <Button
              variant="contained"
              onClick={saveConfig}
              startIcon={saved ? <CheckCircleIcon /> : <SaveIcon />}
              sx={{
                bgcolor: accent, color: '#fff', fontSize: '0.72rem', px: 2.5,
                '&:hover': { bgcolor: '#059669' },
                whiteSpace: 'nowrap',
              }}
            >
              {saved ? 'Enregistré ✓' : 'Enregistrer la configuration'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
