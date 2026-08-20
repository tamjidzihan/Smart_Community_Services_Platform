/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Container, Box, Typography, TextField, IconButton,
  Paper, Chip, Avatar, CircularProgress, Card, Drawer,
  List, ListItemButton, ListItemText, ListItemIcon, Divider, Button, Skeleton,
} from '@mui/material'
import { Send, SmartToy, Person, MyLocation, History, Add, Chat } from '@mui/icons-material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { aiApi } from '../api/services'
import { useAuthStore } from '../store/authStore'
import { useGeolocation } from '../hooks'
import type { AIMessage } from '../types'

const QUICK_PROMPTS = [
  'Find O+ blood donor near me',
  'Show emergency hospitals nearby',
  'I need an ambulance urgently',
  'Best colleges in my area',
  'How to get a birth certificate?',
  'Find NGOs accepting volunteers',
]

const WELCOME_MSG: AIMessage = {
  id: '0',
  role: 'assistant',
  content: "👋 Hi! I'm your Smart Community Services Assistant. I can help you find hospitals, blood donors, ambulances, schools, NGOs, government services, and more. Just ask me anything!",
  created_at: new Date().toISOString(),
}

export default function AIChatPage() {
  const sessionIdRef = useRef(uuidv4()) // Keep for API calls
  const [currentSessionId, setCurrentSessionId] = useState(uuidv4()) // For rendering
  const endRef = useRef<HTMLDivElement>(null)
  const hasLoadedInitial = useRef(false)
  const { location } = useGeolocation()
  const { isAuthenticated } = useAuthStore()
  const [messages, setMessages] = useState<AIMessage[]>([WELCOME_MSG])
  const [input, setInput] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)

  // ─── Fetch past sessions (only if logged in) ───────────────────────
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['ai-sessions'],
    queryFn: async () => (await aiApi.getSessions()).data,
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  // ─── Load a specific session's messages ─────────────────────────────
  const loadSession = useCallback(async (sid: string) => {
    setLoadingHistory(true)
    try {
      const res = await aiApi.getHistory(sid)
      const history = res.data.results
      if (history.length > 0) {
        const loaded: AIMessage[] = history.map((m, i) => ({
          id: `hist-${i}`,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          intent: m.intent || undefined,
          created_at: m.created_at,
        }))
        setMessages([WELCOME_MSG, ...loaded])
        sessionIdRef.current = sid
        setCurrentSessionId(sid)
        setActiveSessionId(sid)
      }
    } catch {
      // silently fail — keep current messages
    }
    setLoadingHistory(false)
    setHistoryOpen(false)
  }, [])

  // ─── On mount: auto-load the most recent session ────────────────────
  useEffect(() => {
    if (sessionsData?.sessions && sessionsData.sessions.length > 0 && !activeSessionId && !hasLoadedInitial.current) {
      hasLoadedInitial.current = true
      const latest = sessionsData.sessions[0]
      loadSession(latest.session_id)
    }
  }, [sessionsData, activeSessionId, loadSession])

  // ─── Start a new chat ───────────────────────────────────────────────
  const startNewChat = () => {
    const newId = uuidv4()
    sessionIdRef.current = newId
    setCurrentSessionId(newId)
    setActiveSessionId(newId)
    setMessages([WELCOME_MSG])
    setHistoryOpen(false)
  }

  const chatMutation = useMutation({
    mutationFn: (message: string) =>
      aiApi.chat(message, sessionIdRef.current, location?.lat, location?.lng),
    onSuccess: (res) => {
      const aiMsg: AIMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: res.data.human_response,
        intent: res.data.intent,
        data: res.data.data,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, aiMsg])
    },
    onError: () => {
      setMessages((prev) => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString(),
      }])
    },
  })

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    const userMsg: AIMessage = {
      id: uuidv4(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    chatMutation.mutate(text)
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <Container maxWidth="md" sx={{ py: 3, height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: 2,
          background: 'linear-gradient(135deg, #1A56DB, #7C3AED)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <SmartToy sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>AI Community Assistant</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#0E9F6E' }} />
            <Typography variant="caption" color="text.secondary">Online · Powered by GPT-4o</Typography>
          </Box>
        </Box>
        {location && (
          <Chip
            icon={<MyLocation sx={{ fontSize: 14 }} />}
            label="Location active"
            size="small"
            color="success"
            variant="outlined"
          />
        )}
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          {isAuthenticated && (
            <IconButton
              onClick={() => setHistoryOpen(true)}
              size="small"
              sx={{ bgcolor: '#F3F4F6', '&:hover': { bgcolor: '#E5E7EB' } }}
              title="Chat History"
            >
              <History sx={{ fontSize: 20 }} />
            </IconButton>
          )}
          <IconButton
            onClick={startNewChat}
            size="small"
            sx={{ bgcolor: '#F3F4F6', '&:hover': { bgcolor: '#E5E7EB' } }}
            title="New Chat"
          >
            <Add sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Box>

      {/* History Drawer */}
      <Drawer anchor="right" open={historyOpen} onClose={() => setHistoryOpen(false)}>
        <Box sx={{ width: 320, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Chat History</Typography>
            <Button variant="contained" size="small" startIcon={<Add />} onClick={startNewChat}
              sx={{ bgcolor: '#1A56DB', textTransform: 'none' }}>
              New Chat
            </Button>
          </Box>
          <Divider sx={{ mb: 1 }} />
          {sessionsLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!sessionsLoading && (!sessionsData?.sessions || sessionsData.sessions.length === 0) && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No previous conversations found.
            </Typography>
          )}
          <List disablePadding>
            {sessionsData?.sessions?.map((s) => (
              <ListItemButton
                key={s.session_id}
                selected={currentSessionId === s.session_id} // Use state instead of ref
                onClick={() => loadSession(s.session_id)}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Chat sx={{ fontSize: 18, color: currentSessionId === s.session_id ? '#1A56DB' : '#6B7280' }} />
                </ListItemIcon>
                <ListItemText
                  primary={s.preview}
                  secondary={`${s.message_count} messages · ${new Date(s.last_message_at).toLocaleDateString()}`}
                  slotProps={{
                    primary: { variant: 'body2', noWrap: true, sx: { fontWeight: 500 } },
                    secondary: { variant: 'caption' },
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Quick prompts */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {QUICK_PROMPTS.map((p) => (
          <Chip
            key={p}
            label={p}
            size="small"
            clickable
            onClick={() => sendMessage(p)}
            sx={{ fontSize: 11, cursor: 'pointer', '&:hover': { bgcolor: '#EBF5FF', borderColor: '#1A56DB' } }}
            variant="outlined"
          />
        ))}
      </Box>

      {/* Chat messages */}
      <Paper sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#F9FAFB', borderRadius: 2, mb: 2 }}>
        {/* ─── Loading Skeleton ─────────────────────────────────────── */}
        {loadingHistory ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
            {/* Skeleton: assistant bubble */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Skeleton variant="circular" width={32} height={32} animation="pulse" />
              <Box sx={{ flex: 1, maxWidth: '75%' }}>
                <Skeleton variant="rounded" width="90%" height={16} animation="pulse" sx={{ mb: 0.8, borderRadius: 1 }} />
                <Skeleton variant="rounded" width="70%" height={16} animation="pulse" sx={{ mb: 0.8, borderRadius: 1 }} />
                <Skeleton variant="rounded" width="40%" height={16} animation="pulse" sx={{ borderRadius: 1 }} />
              </Box>
            </Box>
            {/* Skeleton: user bubble (right-aligned) */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexDirection: 'row-reverse' }}>
              <Skeleton variant="circular" width={32} height={32} animation="pulse" />
              <Box sx={{ flex: 1, maxWidth: '60%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Skeleton variant="rounded" width="85%" height={16} animation="pulse" sx={{ mb: 0.8, borderRadius: 1 }} />
                <Skeleton variant="rounded" width="55%" height={16} animation="pulse" sx={{ borderRadius: 1 }} />
              </Box>
            </Box>
            {/* Skeleton: assistant bubble */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Skeleton variant="circular" width={32} height={32} animation="pulse" />
              <Box sx={{ flex: 1, maxWidth: '75%' }}>
                <Skeleton variant="rounded" width="80%" height={16} animation="pulse" sx={{ mb: 0.8, borderRadius: 1 }} />
                <Skeleton variant="rounded" width="95%" height={16} animation="pulse" sx={{ mb: 0.8, borderRadius: 1 }} />
                <Skeleton variant="rounded" width="60%" height={16} animation="pulse" sx={{ mb: 0.8, borderRadius: 1 }} />
                <Skeleton variant="rounded" width="35%" height={16} animation="pulse" sx={{ borderRadius: 1 }} />
              </Box>
            </Box>
            {/* Skeleton: user bubble */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexDirection: 'row-reverse' }}>
              <Skeleton variant="circular" width={32} height={32} animation="pulse" />
              <Box sx={{ flex: 1, maxWidth: '60%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Skeleton variant="rounded" width="75%" height={16} animation="pulse" sx={{ mb: 0.8, borderRadius: 1 }} />
                <Skeleton variant="rounded" width="90%" height={16} animation="pulse" sx={{ mb: 0.8, borderRadius: 1 }} />
                <Skeleton variant="rounded" width="45%" height={16} animation="pulse" sx={{ borderRadius: 1 }} />
              </Box>
            </Box>
            {/* Skeleton: assistant bubble with card placeholder */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Skeleton variant="circular" width={32} height={32} animation="pulse" />
              <Box sx={{ flex: 1, maxWidth: '75%' }}>
                <Skeleton variant="rounded" width="65%" height={16} animation="pulse" sx={{ mb: 0.8, borderRadius: 1 }} />
                <Skeleton variant="rounded" width="100%" height={52} animation="pulse" sx={{ mb: 0.8, borderRadius: 1.5 }} />
                <Skeleton variant="rounded" width="100%" height={52} animation="pulse" sx={{ borderRadius: 1.5 }} />
              </Box>
            </Box>
            {/* Loading label */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center', pt: 1 }}>
              <CircularProgress size={14} sx={{ color: '#9CA3AF' }} />
              <Typography variant="caption" color="text.secondary">Loading conversation…</Typography>
            </Box>
          </Box>
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Box sx={{
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  gap: 1.5, mb: 2, alignItems: 'flex-start',
                }}>
                  <Avatar sx={{
                    width: 32, height: 32, flexShrink: 0,
                    bgcolor: msg.role === 'user' ? '#1A56DB' : 'linear-gradient(135deg, #1A56DB, #7C3AED)',
                    background: msg.role === 'assistant' ? 'linear-gradient(135deg, #1A56DB, #7C3AED)' : undefined,
                    fontSize: 14,
                  }}>
                    {msg.role === 'user' ? <Person sx={{ fontSize: 18 }} /> : <SmartToy sx={{ fontSize: 18 }} />}
                  </Avatar>

                  <Box sx={{ maxWidth: '80%' }}>
                    <Paper sx={{
                      px: 2, py: 1.5, borderRadius: 2,
                      bgcolor: msg.role === 'user' ? '#1A56DB' : 'white',
                      color: msg.role === 'user' ? 'white' : '#111928',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {msg.content}
                      </Typography>
                    </Paper>

                    {/* Data results */}
                    {msg.data && Object.keys(msg.data).length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {(msg.data.donors as any[])?.slice(0, 3).map((d: any) => (
                          <Card key={d.id} sx={{ p: 1.5, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.full_name}</Typography>
                              <Typography variant="caption" color="text.secondary">{d.phone} · {d.distance_km} km</Typography>
                            </Box>
                            <Chip label={d.blood_group} size="small" color="error" />
                          </Card>
                        ))}
                        {(msg.data.doctors as any[])?.slice(0, 3).map((doc: any) => (
                          <Card key={doc.id} sx={{ p: 1.5, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Dr. {doc.full_name}</Typography>
                              <Typography variant="caption" color="text.secondary">{doc.specialization} · {doc.hospital_name}</Typography>
                            </Box>
                            <Chip label={doc.distance_km ? `${doc.distance_km} km` : doc.specialization} size="small" color="primary" />
                          </Card>
                        ))}
                        {(msg.data.hospitals as any[])?.slice(0, 3).map((h: any) => (
                          <Card key={h.id} sx={{ p: 1.5, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{h.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{h.address} · {h.distance_km} km</Typography>
                            </Box>
                            <Chip label={`⭐ ${h.average_rating}`} size="small" />
                          </Card>
                        ))}
                        {(msg.data.ambulances as any[])?.slice(0, 3).map((a: any) => (
                          <Card key={a.id} sx={{ p: 1.5, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>🚑 {a.registration_number}</Typography>
                              <Typography variant="caption" color="text.secondary">{a.driver_name} · {a.driver_phone} · {a.distance_km} km</Typography>
                            </Box>
                            <Chip label={a.ambulance_type} size="small" color="warning" />
                          </Card>
                        ))}
                      </Box>
                    )}

                    {msg.intent && msg.intent !== 'general' && (
                      <Chip label={`Intent: ${msg.intent}`} size="small" sx={{ mt: 0.5, fontSize: 10 }} color="primary" variant="outlined" />
                    )}
                  </Box>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {chatMutation.isPending && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pl: 5 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">AI is thinking...</Typography>
          </Box>
        )}
        <div ref={endRef} />
      </Paper>

      {/* Input */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Ask anything about community services..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
          disabled={chatMutation.isPending || loadingHistory}
          sx={{ bgcolor: 'white' }}
        />
        <IconButton
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || chatMutation.isPending || loadingHistory}
          sx={{ bgcolor: '#1A56DB', color: 'white', '&:hover': { bgcolor: '#1E3A8A' }, '&:disabled': { bgcolor: '#E5E7EB' } }}
        >
          <Send />
        </IconButton>
      </Box>
    </Container>
  )
}