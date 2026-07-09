import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Container, Box, Typography, TextField, IconButton,
  Paper, Chip, Avatar, CircularProgress, Card,
} from '@mui/material'
import { Send, SmartToy, Person, MyLocation } from '@mui/icons-material'
import { useMutation } from '@tanstack/react-query'
import { aiApi } from '../api/services'
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

export default function AIChatPage() {
  const sessionId = useRef(uuidv4())
  const endRef = useRef<HTMLDivElement>(null)
  const { location } = useGeolocation()
  const [messages, setMessages] = useState<AIMessage[]>([{
    id: '0',
    role: 'assistant',
    content: "👋 Hi! I'm your Smart Community Services Assistant. I can help you find hospitals, blood donors, ambulances, schools, NGOs, government services, and more. Just ask me anything!",
    created_at: new Date().toISOString(),
  }])
  const [input, setInput] = useState('')

  const chatMutation = useMutation({
    mutationFn: (message: string) =>
      aiApi.chat(message, sessionId.current, location?.lat, location?.lng),
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
            sx={{ ml: 'auto' }}
          />
        )}
      </Box>

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
                      {(msg.data.hospitals as any[])?.slice(0, 3).map((h: any) => (
                        <Card key={h.id} sx={{ p: 1.5, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{h.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{h.address} · {h.distance_km} km</Typography>
                          </Box>
                          <Chip label={`⭐ ${h.average_rating}`} size="small" />
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
          disabled={chatMutation.isPending}
          sx={{ bgcolor: 'white' }}
        />
        <IconButton
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || chatMutation.isPending}
          sx={{ bgcolor: '#1A56DB', color: 'white', '&:hover': { bgcolor: '#1E3A8A' }, '&:disabled': { bgcolor: '#E5E7EB' } }}
        >
          <Send />
        </IconButton>
      </Box>
    </Container>
  )
}
