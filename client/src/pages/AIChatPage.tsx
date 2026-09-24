/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Box, Typography, IconButton, Paper, Chip, Avatar,
  CircularProgress, Card, Drawer, Tooltip,
  Button, Skeleton, InputBase,
} from '@mui/material'
import {
  Person, MyLocation, History, Add, Chat,
  LocalHospital, MedicalServices, WaterDrop, Phone, ArrowForward,
  WarningAmber, ContentCopy, Check, VolumeUp, VolumeOff,
  Mic, MicOff, DeleteOutlined, AutoAwesome,
  MenuOpen, Menu as MenuIcon, ArrowUpward,
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { aiApi } from '../api/services'
import { useAuthStore } from '../store/authStore'
import { useGeolocation } from '../hooks'
import type { AIMessage } from '../types'

interface PromptCategory {
  title: string
  icon: React.ReactNode
  color: string
  bg: string
  prompts: { label: string; query: string }[]
}

const CATEGORY_PROMPTS: PromptCategory[] = [
  {
    title: 'Symptom Triage',
    icon: <MedicalServices sx={{ fontSize: 18 }} />,
    color: '#0D9488',
    bg: '#F0FDFA',
    prompts: [
      { label: 'Chest Tightness', query: 'I have acute chest tightness, sweating and dizziness' },
      { label: 'Child High Fever', query: 'My 5-year-old child has high fever, dry cough for 3 days' },
    ],
  },
  {
    title: 'Find Doctors',
    icon: <AutoAwesome sx={{ fontSize: 18 }} />,
    color: '#2563EB',
    bg: '#EFF6FF',
    prompts: [
      { label: 'Top Cardiologist', query: 'Find the best Cardiologist in Dhanmondi with afternoon chamber' },
      { label: 'Dermatologist', query: 'Need a Dermatologist for severe skin rash and allergy' },
    ],
  },
  {
    title: 'Hospitals & Emergency',
    icon: <LocalHospital sx={{ fontSize: 18 }} />,
    color: '#7C3AED',
    bg: '#F5F3FF',
    prompts: [
      { label: '24/7 Emergency', query: 'Hospitals with 24/7 emergency and ICU availability in Mirpur' },
      { label: 'Diagnostic Facilities', query: 'Show best accredited diagnostic hospitals near Uttara' },
    ],
  },
  {
    title: 'Blood Donor Network',
    icon: <WaterDrop sx={{ fontSize: 18 }} />,
    color: '#E11D48',
    bg: '#FFF1F2',
    prompts: [
      { label: 'Urgent A+ Blood', query: 'Emergency: Need A+ blood donor immediately in Dhanmondi' },
      { label: 'Rare Blood Match', query: 'Looking for O-negative blood donor in Dhaka' },
    ],
  },
]

const WELCOME_MSG: AIMessage = {
  id: '0',
  role: 'assistant',
  content: "👋 Hello! I am your **Smart Health AI Clinical Assistant**.\n\nI have real-time access to our platform's **225+ hospitals**, **1,000+ certified doctors**, **departments**, and **1,000+ voluntary blood donors**.\n\nTell me what you're experiencing or what healthcare service you need, and I'll provide immediate medical guidance and direct matching records.",
  created_at: new Date().toISOString(),
}

// ─── Formatted Markdown / Readable Text Component ───────────────────
function FormattedMessage({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) {
    return (
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.9375rem', color: 'white' }}>
        {content}
      </Typography>
    )
  }

  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let currentList: React.ReactNode[] = []
  let listKey = 0

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <Box component="ul" key={`list-${listKey++}`} sx={{ m: 0, pl: 2.5, mb: 1.5, display: 'flex', flexDirection: 'column', gap: 0.6 }}>
          {currentList}
        </Box>
      )
      currentList = []
    }
  }

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Box component="span" key={index} sx={{ fontWeight: 750, color: '#0F172A' }}>
            {part.slice(2, -2)}
          </Box>
        )
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <Box
            component="span"
            key={index}
            sx={{
              bgcolor: '#F0FDFA',
              color: '#0F766E',
              border: '1px solid #CCFBF1',
              px: 0.8,
              py: 0.15,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.85em',
              fontWeight: 700,
            }}
          >
            {part.slice(1, -1)}
          </Box>
        )
      }
      return part
    })
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      return
    }

    if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      flushList()
      const title = trimmed.replace(/^#+\s*/, '')
      elements.push(
        <Typography
          key={`h-${i}`}
          variant="subtitle2"
          sx={{
            fontWeight: 800,
            color: '#0F172A',
            fontSize: '1rem',
            mt: elements.length > 0 ? 2 : 0,
            mb: 1,
            lineHeight: 1.4,
          }}
        >
          {renderInline(title)}
        </Typography>
      )
      return
    }

    if (trimmed.startsWith('#### ')) {
      flushList()
      const title = trimmed.replace(/^####\s*/, '')
      elements.push(
        <Typography
          key={`h4-${i}`}
          variant="caption"
          sx={{
            fontWeight: 800,
            color: '#0D9488',
            fontSize: '0.8125rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            mt: elements.length > 0 ? 1.8 : 0,
            mb: 0.8,
            display: 'block',
          }}
        >
          {renderInline(title)}
        </Typography>
      )
      return
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^[-*•]\s+/, '')
      currentList.push(
        <Box component="li" key={`li-${i}`} sx={{ color: '#334155', lineHeight: 1.65, fontSize: '0.9375rem' }}>
          {renderInline(itemText)}
        </Box>
      )
      return
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^\d+\.\s+/, '')
      currentList.push(
        <Box component="li" key={`li-${i}`} sx={{ color: '#334155', lineHeight: 1.65, fontSize: '0.9375rem' }}>
          {renderInline(itemText)}
        </Box>
      )
      return
    }

    flushList()
    elements.push(
      <Typography
        key={`p-${i}`}
        variant="body2"
        sx={{
          color: '#334155',
          lineHeight: 1.7,
          fontSize: '0.9375rem',
          mb: 1,
        }}
      >
        {renderInline(trimmed)}
      </Typography>
    )
  })

  flushList()

  return <Box sx={{ display: 'flex', flexDirection: 'column' }}>{elements}</Box>
}

export default function AIChatPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const sessionIdRef = useRef(uuidv4())
  const [currentSessionId, setCurrentSessionId] = useState(uuidv4())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasLoadedInitial = useRef(false)

  const { location } = useGeolocation()
  const { isAuthenticated } = useAuthStore()

  const [messages, setMessages] = useState<AIMessage[]>([WELCOME_MSG])
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [, setActiveSessionId] = useState<string | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)

  // ─── Fetch past sessions (only if logged in) ───────────────────────
  const { data: sessionsData, isLoading: sessionsLoading, refetch: refetchSessions } = useQuery({
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
        const loaded: AIMessage[] = history.map((m: any, i: number) => ({
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
      // Keep current messages on fail
    }
    setLoadingHistory(false)
    setMobileDrawerOpen(false)
  }, [])

  // ─── On mount: auto-load the most recent session ────────────────────
  useEffect(() => {
    if (sessionsData?.sessions && sessionsData.sessions.length > 0 && !hasLoadedInitial.current) {
      hasLoadedInitial.current = true
      const latest = sessionsData.sessions[0]
      loadSession(latest.session_id)
    }
  }, [sessionsData, loadSession])

  // ─── Start a new chat ───────────────────────────────────────────────
  const startNewChat = () => {
    const newId = uuidv4()
    sessionIdRef.current = newId
    setCurrentSessionId(newId)
    setActiveSessionId(newId)
    setMessages([WELCOME_MSG])
    setMobileDrawerOpen(false)
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setSpeakingId(null)
    }
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // ─── Speech Synthesis (Text to Speech) ──────────────────────────────
  const toggleSpeech = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) return
    if (speakingId === msgId) {
      window.speechSynthesis.cancel()
      setSpeakingId(null)
      return
    }
    window.speechSynthesis.cancel()
    const cleanText = text.replace(/[*#_`]/g, '')
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 1.0
    utterance.onend = () => setSpeakingId(null)
    utterance.onerror = () => setSpeakingId(null)
    setSpeakingId(msgId)
    window.speechSynthesis.speak(utterance)
  }

  // ─── Voice Dictation (Speech Recognition) ───────────────────────────
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }
    if (isListening) {
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-US'
      recognition.interimResults = false
      recognition.onstart = () => setIsListening(true)
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
        setIsListening(false)
      }
      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)
      recognition.start()
    } catch {
      setIsListening(false)
    }
  }

  // ─── Copy to Clipboard ─────────────────────────────────────────────
  const copyMessageText = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ─── Send Mutation ──────────────────────────────────────────────────
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
      queryClient.invalidateQueries({ queryKey: ['ai-sessions'] })
      refetchSessions()
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: 'assistant',
          content: 'Sorry, I encountered an issue connecting to the clinical engine. Please try again.',
          created_at: new Date().toISOString(),
        },
      ])
    },
  })

  const sendMessage = (text: string) => {
    if (!text.trim() || chatMutation.isPending) return
    const userMsg: AIMessage = {
      id: uuidv4(),
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    chatMutation.mutate(text.trim())
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatMutation.isPending])

  const isOnlyWelcome = messages.length === 1 && messages[0].id === '0'

  // ─── Sidebar Content Component ──────────────────────────────────────
  const renderSidebarContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#FFFFFF', color: '#1E293B', borderRight: '1px solid #E2E8F0' }}>
      {/* Top Brand & New Chat */}
      <Box sx={{ p: 2, borderBottom: '1px solid #F1F5F9' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #0D9488, #2563EB)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(13,148,136,0.2)',
            }}
          >
            <AutoAwesome sx={{ color: 'white', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
              Smart Health AI
            </Typography>
            <Typography variant="caption" sx={{ color: '#0D9488', fontWeight: 700, fontSize: 11 }}>
              Clinical Assistant
            </Typography>
          </Box>
        </Box>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<Add />}
          onClick={startNewChat}
          sx={{
            py: 0.9,
            borderRadius: 2,
            bgcolor: '#F8FAFC',
            borderColor: '#E2E8F0',
            color: '#0F172A',
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.8125rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            '&:hover': {
              bgcolor: '#F1F5F9',
              borderColor: '#CBD5E1',
            },
          }}
        >
          New Consultation
        </Button>
      </Box>

      {/* Conversation List */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
        <Typography
          variant="caption"
          sx={{
            px: 1,
            py: 0.8,
            display: 'block',
            fontWeight: 700,
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: 10,
          }}
        >
          Past Consultations
        </Typography>

        {sessionsLoading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 0.5 }}>
            <Skeleton variant="rounded" height={40} sx={{ bgcolor: '#F1F5F9', borderRadius: 2 }} />
            <Skeleton variant="rounded" height={40} sx={{ bgcolor: '#F1F5F9', borderRadius: 2 }} />
            <Skeleton variant="rounded" height={40} sx={{ bgcolor: '#F1F5F9', borderRadius: 2 }} />
          </Box>
        )}

        {!sessionsLoading && (!sessionsData?.sessions || sessionsData.sessions.length === 0) && (
          <Box sx={{ p: 2.5, textAlign: 'center' }}>
            <Chat sx={{ color: '#CBD5E1', fontSize: 28, mb: 0.8 }} />
            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: 11 }}>
              No previous chats found.
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {sessionsData?.sessions?.map((s: any) => {
            const isSelected = currentSessionId === s.session_id
            return (
              <Box
                key={s.session_id}
                onClick={() => loadSession(s.session_id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2,
                  p: 1.2,
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: isSelected ? '#F0FDFA' : 'transparent',
                  border: isSelected ? '1px solid #CCFBF1' : '1px solid transparent',
                  color: isSelected ? '#0F766E' : '#475569',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: isSelected ? '#E6FFFA' : '#F8FAFC',
                    color: '#0F172A',
                  },
                }}
              >
                <Chat sx={{ fontSize: 16, color: isSelected ? '#0D9488' : '#94A3B8', flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.8125rem',
                      lineHeight: 1.3,
                    }}
                  >
                    {s.preview || 'Consultation Session'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: 10 }}>
                    {s.message_count} msgs · {new Date(s.last_message_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            )
          })}
        </Box>
      </Box>

      {/* Bottom Engine Status */}
      <Box sx={{ p: 1.8, borderTop: '1px solid #F1F5F9', bgcolor: '#F8FAFC' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981', boxShadow: '0 0 6px #10B981' }} />
          <Box>
            <Typography variant="caption" sx={{ color: '#334155', fontWeight: 700, display: 'block', fontSize: 11 }}>
              Clinical Engine Active
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: 10 }}>
              225 Hospitals · 1000 Doctors
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ height: 'calc(100vh - 65px)', display: 'flex', bgcolor: '#F8FAFC', overflow: 'hidden' }}>
      {/* ─── Desktop Sidebar ────────────────────────────────────────────── */}
      <Box
        sx={{
          width: sidebarOpen ? 280 : 0,
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          display: { xs: 'none', md: 'block' },
          flexShrink: 0,
          overflow: 'hidden',
          borderRight: '1px solid #E2E8F0',
        }}
      >
        <Box sx={{ width: 280, height: '100%' }}>
          {renderSidebarContent()}
        </Box>
      </Box>

      {/* ─── Mobile Sidebar Drawer ──────────────────────────────────────── */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <Box sx={{ width: 290, height: '100%' }}>
          {renderSidebarContent()}
        </Box>
      </Drawer>

      {/* ─── Main Chat Area ─────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, position: 'relative' }}>
        {/* Top Header Bar */}
        <Box
          sx={{
            py: 1.5,
            px: { xs: 2, sm: 3 },
            bgcolor: 'white',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            zIndex: 10,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Sidebar toggle buttons */}
            <IconButton
              size="small"
              onClick={() => setSidebarOpen((prev) => !prev)}
              sx={{ display: { xs: 'none', md: 'inline-flex' }, color: '#475569' }}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? <MenuOpen /> : <MenuIcon />}
            </IconButton>

            <IconButton
              size="small"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' }, color: '#475569' }}
            >
              <History />
            </IconButton>

            {/* Model Badge */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={<AutoAwesome sx={{ fontSize: '14px !important', color: '#0D9488' }} />}
                label="Gemini 2.5 Clinical Engine"
                size="small"
                sx={{
                  bgcolor: '#F0FDFA',
                  color: '#0F766E',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  border: '1px solid #CCFBF1',
                  borderRadius: 2,
                }}
              />
              {location && (
                <Chip
                  icon={<MyLocation sx={{ fontSize: '13px !important', color: '#16A34A' }} />}
                  label="GPS Connected"
                  size="small"
                  sx={{
                    bgcolor: '#F0FDF4',
                    color: '#15803D',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    border: '1px solid #DCFCE7',
                    display: { xs: 'none', sm: 'inline-flex' },
                  }}
                />
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Start fresh conversation">
              <IconButton
                size="small"
                onClick={startNewChat}
                sx={{
                  color: '#64748B',
                  bgcolor: '#F1F5F9',
                  '&:hover': { bgcolor: '#E2E8F0', color: '#0F172A' },
                  borderRadius: 2,
                }}
              >
                <Add sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            {messages.length > 1 && (
              <Tooltip title="Clear chat stream">
                <IconButton
                  size="small"
                  onClick={() => setMessages([WELCOME_MSG])}
                  sx={{
                    color: '#94A3B8',
                    bgcolor: '#F8FAFC',
                    '&:hover': { bgcolor: '#FEE2E2', color: '#DC2626' },
                    borderRadius: 2,
                  }}
                >
                  <DeleteOutlined sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* ─── Scrollable Message Viewport ──────────────────────────────── */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: { xs: 2, sm: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            maxWidth: 960,
            width: '100%',
            mx: 'auto',
          }}
        >
          {/* Skeleton loading state */}
          {loadingHistory && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Skeleton variant="circular" width={36} height={36} />
                <Box sx={{ flex: 1, maxWidth: '70%' }}>
                  <Skeleton variant="rounded" height={20} sx={{ mb: 1, borderRadius: 1 }} />
                  <Skeleton variant="rounded" height={20} width="80%" sx={{ mb: 1, borderRadius: 1 }} />
                  <Skeleton variant="rounded" height={20} width="40%" sx={{ borderRadius: 1 }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
                <CircularProgress size={20} sx={{ color: '#0D9488' }} />
              </Box>
            </Box>
          )}

          {/* If Fresh State: Show Modern Hero Greeting & Categorized Quick Prompts */}
          {!loadingHistory && isOnlyWelcome && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ textAlign: 'center', my: { xs: 2, sm: 4 }, px: 2 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 2.5,
                    borderRadius: 3.5,
                    background: 'linear-gradient(135deg, #0D9488, #2563EB)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 30px rgba(13,148,136,0.3)',
                  }}
                >
                  <AutoAwesome sx={{ color: 'white', fontSize: 32 }} />
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    color: '#0F172A',
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                    mb: 1,
                  }}
                >
                  How can I help with your health today?
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#64748B',
                    maxWidth: 580,
                    mx: 'auto',
                    lineHeight: 1.6,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    mb: 4,
                  }}
                >
                  Ask about health concerns, clinical symptoms, or discover verified specialist doctors, hospital emergency beds, and blood donors in real-time.
                </Typography>

                {/* 4 Category Prompt Cards */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    gap: 2,
                    textAlign: 'left',
                  }}
                >
                  {CATEGORY_PROMPTS.map((cat) => (
                    <Card
                      key={cat.title}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        bgcolor: 'white',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 2,
                            bgcolor: cat.bg,
                            color: cat.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {cat.icon}
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                          {cat.title}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {cat.prompts.map((p) => (
                          <Box
                            key={p.label}
                            onClick={() => sendMessage(p.query)}
                            sx={{
                              p: 1.2,
                              borderRadius: 2,
                              bgcolor: '#F8FAFC',
                              border: '1px solid #F1F5F9',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.15s ease',
                              '&:hover': {
                                bgcolor: cat.bg,
                                borderColor: cat.color,
                                transform: 'translateX(3px)',
                              },
                            }}
                          >
                            <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                              {p.label}
                            </Typography>
                            <ArrowForward sx={{ fontSize: 14, color: cat.color }} />
                          </Box>
                        ))}
                      </Box>
                    </Card>
                  ))}
                </Box>
              </Box>
            </motion.div>
          )}

          {/* Render Active Conversation Stream */}
          {!loadingHistory && (!isOnlyWelcome ? (
            <AnimatePresence>
              {messages.map((msg) => {
                const isUser = msg.role === 'user'
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: isUser ? 'row-reverse' : 'row',
                        alignItems: 'flex-start',
                        gap: 1.5,
                        mb: 3,
                      }}
                    >
                      {/* Avatar */}
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: isUser ? '50%' : 2.5,
                          background: isUser
                            ? 'linear-gradient(135deg, #334155, #0F172A)'
                            : 'linear-gradient(135deg, #0D9488, #2563EB)',
                          color: 'white',
                          fontSize: 16,
                          flexShrink: 0,
                          boxShadow: isUser ? 'none' : '0 2px 8px rgba(13,148,136,0.25)',
                        }}
                      >
                        {isUser ? <Person sx={{ fontSize: 18 }} /> : <AutoAwesome sx={{ fontSize: 18 }} />}
                      </Avatar>

                      {/* Message Content Container */}
                      <Box sx={{ maxWidth: { xs: '88%', sm: '82%' } }}>
                        <Paper
                          elevation={0}
                          sx={{
                            px: 2.5,
                            py: 2,
                            borderRadius: isUser ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                            bgcolor: isUser ? '#0F172A' : 'white',
                            color: isUser ? 'white' : '#1E293B',
                            border: isUser ? 'none' : '1px solid #E2E8F0',
                            boxShadow: isUser
                              ? '0 4px 14px rgba(15,23,42,0.15)'
                              : '0 2px 10px rgba(0,0,0,0.03)',
                          }}
                        >
                          <FormattedMessage content={msg.content} isUser={isUser} />
                        </Paper>

                        {/* Action buttons under AI response */}
                        {!isUser && msg.id !== '0' && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.8, ml: 0.5 }}>
                            <Tooltip title={copiedId === msg.id ? 'Copied to clipboard!' : 'Copy response'}>
                              <IconButton
                                size="small"
                                onClick={() => copyMessageText(msg.id, msg.content)}
                                sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A', bgcolor: '#F1F5F9' } }}
                              >
                                {copiedId === msg.id ? (
                                  <Check sx={{ fontSize: 15, color: '#10B981' }} />
                                ) : (
                                  <ContentCopy sx={{ fontSize: 15 }} />
                                )}
                              </IconButton>
                            </Tooltip>

                            <Tooltip title={speakingId === msg.id ? 'Stop reading' : 'Read guidance aloud'}>
                              <IconButton
                                size="small"
                                onClick={() => toggleSpeech(msg.id, msg.content)}
                                sx={{ color: speakingId === msg.id ? '#0D9488' : '#94A3B8', '&:hover': { color: '#0F172A', bgcolor: '#F1F5F9' } }}
                              >
                                {speakingId === msg.id ? <VolumeOff sx={{ fontSize: 16 }} /> : <VolumeUp sx={{ fontSize: 16 }} />}
                              </IconButton>
                            </Tooltip>

                            {msg.intent && msg.intent !== 'general' && (
                              <Chip
                                label={`Triage: ${msg.intent.replace('_', ' ').toUpperCase()}`}
                                size="small"
                                sx={{
                                  ml: 1,
                                  height: 20,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  bgcolor: '#F0FDFA',
                                  color: '#0F766E',
                                  border: '1px solid #CCFBF1',
                                }}
                              />
                            )}
                          </Box>
                        )}

                        {/* ─── Rich Live Database Result Widgets ────────────────── */}
                        {msg.data && Object.keys(msg.data).length > 0 && (
                          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {/* Doctor Matches */}
                            {((msg.data as any)?.doctors as any[])?.length > 0 && (
                              <Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 800,
                                    color: '#0D9488',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.8,
                                    mb: 1,
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                    fontSize: 11,
                                  }}
                                >
                                  <MedicalServices sx={{ fontSize: 15 }} />
                                  Available Specialists ({((msg.data as any)?.doctors as any[]).length})
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr' }, gap: 1.2 }}>
                                  {((msg.data as any)?.doctors as any[]).map((doc: any) => (
                                    <Card
                                      key={doc.id}
                                      sx={{
                                        p: 2,
                                        borderRadius: 2.5,
                                        border: '1px solid #E2E8F0',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                                        bgcolor: 'white',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                          borderColor: '#0D9488',
                                          boxShadow: '0 6px 18px rgba(13,148,136,0.12)',
                                          transform: 'translateY(-1px)',
                                        },
                                      }}
                                    >
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Box>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9375rem' }}>
                                            {doc.full_name}
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: '#0D9488', fontWeight: 700, display: 'block' }}>
                                            {doc.specialization} · {doc.department_name}
                                          </Typography>
                                        </Box>
                                        <Chip
                                          label={`৳${doc.consultation_fee}`}
                                          size="small"
                                          sx={{
                                            bgcolor: '#F0FDF4',
                                            color: '#15803D',
                                            fontWeight: 800,
                                            fontSize: '0.75rem',
                                            border: '1px solid #BBF7D0',
                                          }}
                                        />
                                      </Box>

                                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5, fontSize: 12 }}>
                                        🏥 {doc.hospital_name} ({doc.hospital_area}) · ⭐ {doc.average_rating || '4.8'} ({doc.review_count || 12} reviews)
                                      </Typography>

                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                        <Button
                                          size="small"
                                          variant="contained"
                                          onClick={() => navigate(`/doctors/${doc.id}`)}
                                          endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                                          sx={{
                                            bgcolor: '#0D9488',
                                            '&:hover': { bgcolor: '#0F766E' },
                                            textTransform: 'none',
                                            fontSize: '0.8125rem',
                                            fontWeight: 700,
                                            py: 0.6,
                                            px: 1.8,
                                            borderRadius: 2,
                                          }}
                                        >
                                          Book Appointment
                                        </Button>
                                        {doc.appointment_number && (
                                          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, fontSize: 11 }}>
                                            📞 {doc.appointment_number.split(',')[0]}
                                          </Typography>
                                        )}
                                      </Box>
                                    </Card>
                                  ))}
                                </Box>
                              </Box>
                            )}

                            {/* Hospital Matches */}
                            {((msg.data as any)?.hospitals as any[])?.length > 0 && (
                              <Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 800,
                                    color: '#2563EB',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.8,
                                    mb: 1,
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                    fontSize: 11,
                                  }}
                                >
                                  <LocalHospital sx={{ fontSize: 15 }} />
                                  Accredited Hospitals ({((msg.data as any)?.hospitals as any[]).length})
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr' }, gap: 1.2 }}>
                                  {((msg.data as any)?.hospitals as any[]).map((h: any) => (
                                    <Card
                                      key={h.id}
                                      sx={{
                                        p: 2,
                                        borderRadius: 2.5,
                                        border: '1px solid #E2E8F0',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                                        bgcolor: 'white',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                          borderColor: '#2563EB',
                                          boxShadow: '0 6px 18px rgba(37,99,235,0.12)',
                                        },
                                      }}
                                    >
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                        <Box>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9375rem' }}>
                                            {h.name}
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                            📍 {h.address || h.area} {h.distance_km ? `· ${h.distance_km} km away` : ''}
                                          </Typography>
                                        </Box>
                                        <Chip
                                          label={`⭐ ${h.average_rating || '4.7'}`}
                                          size="small"
                                          sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: '0.75rem' }}
                                        />
                                      </Box>

                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                                        <Typography variant="caption" sx={{ color: '#15803D', fontWeight: 700, fontSize: 12 }}>
                                          🛏️ {h.available_beds || 12} Free Beds {h.emergency_available ? '· 🚨 24/7 ER' : ''}
                                        </Typography>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          onClick={() => navigate(`/hospitals/${h.id}`)}
                                          sx={{
                                            borderColor: '#CBD5E1',
                                            color: '#1E293B',
                                            textTransform: 'none',
                                            fontSize: '0.8125rem',
                                            fontWeight: 600,
                                            py: 0.4,
                                            px: 1.4,
                                            borderRadius: 2,
                                          }}
                                        >
                                          View Hospital
                                        </Button>
                                      </Box>
                                    </Card>
                                  ))}
                                </Box>
                              </Box>
                            )}

                            {/* Blood Donors Matches */}
                            {((msg.data as any)?.donors as any[])?.length > 0 && (
                              <Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 800,
                                    color: '#E11D48',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.8,
                                    mb: 1,
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                    fontSize: 11,
                                  }}
                                >
                                  <WaterDrop sx={{ fontSize: 15 }} />
                                  Compatible Blood Donors ({((msg.data as any)?.donors as any[]).length})
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr' }, gap: 1 }}>
                                  {((msg.data as any)?.donors as any[]).map((d: any) => (
                                    <Card
                                      key={d.id}
                                      sx={{
                                        p: 1.5,
                                        borderRadius: 2.5,
                                        border: '1px solid #FFE4E6',
                                        bgcolor: '#FFF1F2',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                      }}
                                    >
                                      <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#881337' }}>
                                          {d.full_name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#9F1239' }}>
                                          📍 {d.address || 'Dhaka'} {d.distance_km ? `· ${d.distance_km} km` : ''}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip label={d.blood_group} size="small" color="error" sx={{ fontWeight: 900 }} />
                                        <Button
                                          size="small"
                                          variant="contained"
                                          color="error"
                                          href={`tel:${d.phone}`}
                                          startIcon={<Phone sx={{ fontSize: 13 }} />}
                                          sx={{ textTransform: 'none', fontSize: 12, py: 0.4, px: 1.4, borderRadius: 2, fontWeight: 700 }}
                                        >
                                          Call
                                        </Button>
                                      </Box>
                                    </Card>
                                  ))}
                                </Box>
                              </Box>
                            )}

                            {/* Urgent Blood Requests */}
                            {((msg.data as any)?.blood_requests as any[])?.length > 0 && (
                              <Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 800,
                                    color: '#DC2626',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.8,
                                    mb: 1,
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                    fontSize: 11,
                                  }}
                                >
                                  <WarningAmber sx={{ fontSize: 15 }} />
                                  Active Emergency Blood Requests
                                </Typography>
                                {((msg.data as any)?.blood_requests as any[]).map((r: any) => (
                                  <Card key={r.id} sx={{ p: 1.5, mb: 1, bgcolor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#991B1B' }}>
                                        {r.blood_group} required for {r.patient_name}
                                      </Typography>
                                      <Chip label={r.urgency?.toUpperCase()} size="small" color="error" sx={{ fontSize: 10, height: 20, fontWeight: 800 }} />
                                    </Box>
                                    <Typography variant="caption" sx={{ color: '#7F1D1D', display: 'block', mt: 0.5 }}>
                                      🏥 {r.hospital_name} · {r.units_needed} units required
                                    </Typography>
                                  </Card>
                                ))}
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          ) : null)}

          {/* Thinking Indicator */}
          {chatMutation.isPending && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2.5,
                    background: 'linear-gradient(135deg, #0D9488, #2563EB)',
                    boxShadow: '0 2px 8px rgba(13,148,136,0.25)',
                  }}
                >
                  <AutoAwesome sx={{ fontSize: 18, color: 'white' }} />
                </Avatar>
                <Paper
                  elevation={0}
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    borderRadius: '4px 20px 20px 20px',
                    bgcolor: 'white',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <CircularProgress size={16} sx={{ color: '#0D9488' }} />
                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.875rem' }}>
                    Analyzing symptoms & querying live database...
                  </Typography>
                </Paper>
              </Box>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* ─── Modern Docked Input Area ─────────────────────────────────── */}
        <Box
          sx={{
            p: { xs: 1.5, sm: 2.5 },
            bgcolor: 'white',
            borderTop: '1px solid #E2E8F0',
            maxWidth: 960,
            width: '100%',
            mx: 'auto',
          }}
        >
          {/* Input Box Card */}
          <Paper
            elevation={0}
            sx={{
              p: 1,
              borderRadius: 3.5,
              border: '1.5px solid #E2E8F0',
              bgcolor: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              transition: 'all 0.2s ease',
              '&:focus-within': {
                borderColor: '#0D9488',
                boxShadow: '0 0 0 3px rgba(13,148,136,0.12)',
                bgcolor: 'white',
              },
            }}
          >
            {/* Voice Input Button */}
            <Tooltip title={isListening ? 'Listening... click to stop' : 'Dictate with voice'}>
              <IconButton
                size="small"
                onClick={toggleVoiceInput}
                sx={{
                  color: isListening ? '#DC2626' : '#64748B',
                  bgcolor: isListening ? '#FEE2E2' : 'transparent',
                  '&:hover': { bgcolor: isListening ? '#FECACA' : '#E2E8F0' },
                  transition: 'all 0.2s',
                }}
              >
                {isListening ? <Mic sx={{ fontSize: 20 }} /> : <MicOff sx={{ fontSize: 20 }} />}
              </IconButton>
            </Tooltip>

            {/* Main Text Input */}
            <InputBase
              inputRef={inputRef}
              fullWidth
              multiline
              maxRows={4}
              placeholder="Ask anything about health concerns, specialist doctors, hospital beds, or blood donors..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(input)
                }
              }}
              disabled={chatMutation.isPending || loadingHistory}
              sx={{
                fontSize: '0.9375rem',
                color: '#0F172A',
                px: 1,
                '& textarea::placeholder': { color: '#94A3B8', opacity: 1 },
              }}
            />

            {/* Send Button */}
            <IconButton
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || chatMutation.isPending || loadingHistory}
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                background: input.trim()
                  ? 'linear-gradient(135deg, #0D9488, #2563EB)'
                  : '#E2E8F0',
                color: input.trim() ? 'white' : '#94A3B8',
                boxShadow: input.trim() ? '0 4px 12px rgba(13,148,136,0.25)' : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: input.trim()
                    ? 'linear-gradient(135deg, #0F766E, #1D4ED8)'
                    : '#CBD5E1',
                  transform: input.trim() ? 'scale(1.05)' : 'none',
                },
                '&:disabled': {
                  background: '#E2E8F0',
                  color: '#94A3B8',
                },
              }}
            >
              {chatMutation.isPending ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <ArrowUpward sx={{ fontSize: 20 }} />}
            </IconButton>
          </Paper>

          {/* Footnote disclaimer */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 1,
              color: '#94A3B8',
              fontSize: '0.6875rem',
            }}
          >
            Smart Health AI provides clinical insights & live database triage. Always call 999 or visit an emergency room in acute life-threatening situations.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}