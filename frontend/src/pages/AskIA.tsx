import { useState, useEffect, useRef } from 'react'
import { Box, Typography, TextField, IconButton, Avatar, Paper, Divider } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import PersonIcon from '@mui/icons-material/Person'
import HistoryIcon from '@mui/icons-material/History'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import { useThemeMode } from '../context/ThemeContext'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  timestamp: Date
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export default function AskIAPage() {
  const { mode } = useThemeMode()
  const dark = mode === 'dark'
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('askia-sessions')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeSession = sessions.find(s => s.id === activeSessionId) || null
  const messages = activeSession?.messages || []

  useEffect(() => {
    localStorage.setItem('askia-sessions', JSON.stringify(sessions))
  }, [sessions])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function newSession() {
    const id = generateId()
    setSessions(prev => [{
      id,
      title: 'Nouvelle conversation',
      messages: [],
      timestamp: new Date(),
    }, ...prev])
    setActiveSessionId(id)
  }

  function deleteSession(id: string) {
    setSessions(prev => prev.filter(s => s.id !== id))
    if (activeSessionId === id) {
      setActiveSessionId(sessions.find(s => s.id !== id)?.id || null)
    }
  }

  function deleteAllSessions() {
    setSessions([])
    setActiveSessionId(null)
  }

  function sendMessage() {
    if (!input.trim()) return

    let sessionId = activeSessionId
    if (!sessionId) {
      sessionId = generateId()
      setSessions(prev => [{
        id: sessionId!,
        title: input.slice(0, 40) + (input.length > 40 ? '...' : ''),
        messages: [],
        timestamp: new Date(),
      }, ...prev])
      setActiveSessionId(sessionId)
    }

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }
    setInput('')

    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s
      const msgs = [...s.messages, userMsg]
      const title = s.messages.length === 0
        ? userMsg.content.slice(0, 40) + (userMsg.content.length > 40 ? '...' : '')
        : s.title
      return { ...s, messages: msgs, title }
    }))

    setTimeout(() => {
      const assistantMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: 'Fonctionnalité IA en cours d\'intégration. Le backend répondra bientôt avec des analyses intelligentes de vos données de serre.',
        timestamp: new Date(),
      }
      setSessions(prev => prev.map(s => {
        if (s.id !== sessionId) return s
        return { ...s, messages: [...s.messages, assistantMsg] }
      }))
    }, 600)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const bg = dark ? '#0a0e1a' : '#f0f2f5'
  const surface = dark ? '#12182b' : '#ffffff'
  const border = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const chatBg = dark ? '#0a0e1a' : '#f7f8fa'
  const userBubble = dark ? '#1a2a4a' : '#e8f0fe'
  const assistantBubble = dark ? '#12182b' : '#ffffff'
  const textPrimary = dark ? '#e2ecf8' : '#1a1a2e'
  const textSecondary = dark ? '#6b7e9e' : '#6b7280'
  const accent = '#10a37f'

  return (
    <Box sx={{ height: 'calc(100vh - 110px)', display: 'flex', gap: 1.5 }}>
      {/* ─── Sidebar historique ─── */}
      <Paper sx={{
        width: 260, flexShrink: 0, borderRadius: '12px',
        bgcolor: surface, border: `1px solid ${border}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Historique
          </Typography>
          <IconButton size="small" onClick={deleteAllSessions} sx={{ color: textSecondary, opacity: 0.5, '&:hover': { opacity: 1, color: '#e8334a' } }}>
            <DeleteSweepIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ borderColor: border }} />

        <Box
          onClick={newSession}
          sx={{
            mx: 1, my: 1, py: 1, px: 1.5, borderRadius: '8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 1,
            color: accent, fontWeight: 600, fontSize: '0.82rem',
            transition: 'all 0.15s',
            '&:hover': { bgcolor: dark ? 'rgba(16,163,127,0.08)' : 'rgba(16,163,127,0.06)' },
          }}
        >
          <Box component="span" sx={{ fontSize: '1.1rem' }}>+</Box>
          Nouvelle conversation
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', px: 1, pb: 1 }}>
          {sessions.length === 0 && (
            <Typography sx={{ textAlign: 'center', color: textSecondary, fontSize: '0.72rem', mt: 4, opacity: 0.5 }}>
              Aucun historique
            </Typography>
          )}
          {sessions.map(session => (
            <Box
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              sx={{
                py: 1, px: 1.2, mb: 0.3, borderRadius: '8px', cursor: 'pointer',
                bgcolor: activeSessionId === session.id ? (dark ? 'rgba(16,163,127,0.1)' : 'rgba(16,163,127,0.06)') : 'transparent',
                display: 'flex', alignItems: 'center', gap: 1,
                transition: 'all 0.15s',
                '&:hover': { bgcolor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
                group: true,
              }}
            >
              <HistoryIcon sx={{ fontSize: '0.85rem', color: textSecondary, flexShrink: 0, opacity: 0.5 }} />
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <Typography sx={{
                  fontSize: '0.75rem', color: textPrimary, fontWeight: activeSessionId === session.id ? 600 : 400,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {session.title}
                </Typography>
                <Typography sx={{ fontSize: '0.62rem', color: textSecondary, opacity: 0.5 }}>
                  {new Date(session.timestamp).toLocaleDateString('fr-FR')}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); deleteSession(session.id) }}
                sx={{ opacity: 0, color: textSecondary, '&:hover': { color: '#e8334a' } }}
                className="delete-btn"
              />
            </Box>
          ))}
        </Box>
      </Paper>

      {/* ─── Zone de chat principale ─── */}
      <Paper sx={{
        flex: 1, borderRadius: '12px',
        bgcolor: surface, border: `1px solid ${border}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <Box sx={{
          px: 2.5, py: 1.5,
          borderBottom: `1px solid ${border}`,
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <Avatar sx={{ width: 28, height: 28, bgcolor: accent }}>
            <SmartToyIcon sx={{ fontSize: '0.9rem' }} />
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: textPrimary, lineHeight: 1.2 }}>
              Assistant IA Serre
            </Typography>
            <Typography sx={{ fontSize: '0.62rem', color: accent, fontFamily: '"JetBrains Mono", monospace' }}>
              {activeSession ? 'En ligne' : 'Nouvelle conversation'}
            </Typography>
          </Box>
        </Box>

        {/* Messages */}
        <Box sx={{
          flex: 1, overflowY: 'auto', px: 2, py: 2,
          bgcolor: chatBg,
          display: 'flex', flexDirection: 'column', gap: 1.5,
        }}>
          {messages.length === 0 && (
            <Box sx={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 2,
              color: textSecondary, opacity: 0.6,
            }}>
              <SmartToyIcon sx={{ fontSize: '2.5rem' }} />
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                Posez une question sur votre serre
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', textAlign: 'center', maxWidth: 360 }}>
                Analyse des données, recommandations climatiques, diagnostic des capteurs, et optimisation de la ventilation.
              </Typography>
            </Box>
          )}

          {messages.map(msg => (
            <Box key={msg.id} sx={{
              display: 'flex', gap: 1.5,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
            }}>
              <Avatar sx={{
                width: 30, height: 30,
                bgcolor: msg.role === 'user' ? '#555' : accent,
                flexShrink: 0,
              }}>
                {msg.role === 'user' ? <PersonIcon sx={{ fontSize: '0.75rem', color: '#fff' }} /> : <SmartToyIcon sx={{ fontSize: '0.75rem', color: '#fff' }} />}
              </Avatar>
              <Box sx={{
                maxWidth: '75%',
                px: 1.8, py: 1.2,
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                bgcolor: msg.role === 'user' ? userBubble : assistantBubble,
                border: msg.role === 'assistant' ? `1px solid ${border}` : 'none',
                boxShadow: msg.role === 'assistant' ? (dark ? '0 1px 4px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.04)') : 'none',
              }}>
                <Typography sx={{
                  fontSize: '0.82rem', color: textPrimary, lineHeight: 1.55,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {msg.content}
                </Typography>
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box sx={{
          p: 2, borderTop: `1px solid ${border}`,
          bgcolor: surface,
        }}>
          <Box sx={{
            display: 'flex', gap: 1, alignItems: 'flex-end',
            bgcolor: dark ? '#1a2040' : '#f7f8fa',
            borderRadius: '12px', px: 1.5, py: 0.5,
            border: `1px solid ${border}`,
            transition: 'border-color 0.15s',
            '&:focus-within': { borderColor: accent + '66' },
          }}>
            <TextField
              fullWidth
              multiline
              maxRows={6}
              placeholder="Posez une question à l'assistant IA..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: '0.82rem', color: textPrimary,
                  py: 0.8,
                  '&::placeholder': { color: textSecondary, opacity: 0.5 },
                },
              }}
            />
            <IconButton
              onClick={sendMessage}
              disabled={!input.trim()}
              sx={{
                bgcolor: input.trim() ? accent : 'transparent',
                color: input.trim() ? '#fff' : textSecondary,
                width: 34, height: 34, borderRadius: '8px',
                transition: 'all 0.15s',
                '&:hover': { bgcolor: input.trim() ? '#0d8c6f' : 'rgba(255,255,255,0.05)' },
                '&.Mui-disabled': { bgcolor: 'transparent', color: textSecondary, opacity: 0.3 },
              }}
            >
              <SendIcon sx={{ fontSize: '0.95rem' }} />
            </IconButton>
          </Box>
          <Typography sx={{
            textAlign: 'center', mt: 0.8,
            fontSize: '0.6rem', color: textSecondary, opacity: 0.4,
            fontFamily: '"JetBrains Mono", monospace',
          }}>
            L'assistant IA peut faire des erreurs. Vérifiez les informations importantes.
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
