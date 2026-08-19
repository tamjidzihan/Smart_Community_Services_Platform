import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Box, Typography, Button, Container, Grid, Card,
  TextField, InputAdornment, Chip, Paper,
} from '@mui/material'
import {
  Search, LocalHospital, Bloodtype, DirectionsCar, School,
  People, AccountBalance, SmartToy, Emergency, ArrowForward,
  CheckCircle,
} from '@mui/icons-material'

const CATEGORIES = [
  { icon: <LocalHospital />, label: 'Hospitals', path: '/hospitals', color: '#EBF5FF', iconColor: '#1A56DB' },
  { icon: <Bloodtype />, label: 'Blood Donors', path: '/blood-donors', color: '#FEE2E2', iconColor: '#E02424' },
  { icon: <DirectionsCar />, label: 'Ambulance', path: '/emergency', color: '#FEF9C3', iconColor: '#D97706' },
  { icon: <School />, label: 'Education', path: '/education', color: '#D1FAE5', iconColor: '#059669' },
  { icon: <People />, label: 'NGOs', path: '/ngo', color: '#EDE9FE', iconColor: '#7C3AED' },
  { icon: <AccountBalance />, label: 'Government', path: '/government', color: '#F3F4F6', iconColor: '#374151' },
]

const STATS = [
  { value: '500+', label: 'Service Providers' },
  { value: '10K+', label: 'Citizens Served' },
  { value: '2K+', label: 'Blood Donors' },
  { value: '50+', label: 'Hospitals Listed' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) navigate(`/services?search=${encodeURIComponent(search)}`)
  }

  return (
    <Box>
      {/* Hero */}
      <Box sx={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #1A56DB 100%)',
        color: 'white', py: { xs: 8, md: 12 }, position: 'relative', overflow: 'hidden',
      }}>
        {/* Background circles */}
        {[...Array(3)].map((_, i) => (
          <Box key={i} sx={{
            position: 'absolute',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.05)',
            width: `${300 + i * 200}px`,
            height: `${300 + i * 200}px`,
            top: '50%', left: '60%',
            transform: 'translate(-50%, -50%)',
          }} />
        ))}

        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Grid container spacing={4} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <Chip label="🚀 AI-Powered Community Platform" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', mb: 3 }} />
                <Typography variant="h2" sx={{ fontWeight: 800, lineHeight: 1.2, mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}>
                  Tupas Your City's Services,{' '}
                  <Box component="span" sx={{ color: '#60A5FA' }}>One Platform</Box>
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 18, mb: 4, maxWidth: 520 }}>
                  Connect with hospitals, blood donors, ambulances, schools, NGOs, and government services — all in one intelligent app.
                </Typography>

                {/* Search bar */}
                <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 1, maxWidth: 560 }}>
                  <TextField
                    fullWidth
                    placeholder='Try "Find O+ blood donor near me" or "Emergency hospital"'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{
                      bgcolor: 'white', borderRadius: 2,
                      '& .MuiOutlinedInput-root': { borderRadius: 2 },
                    }}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start"><Search sx={{ color: '#9CA3AF' }} /></InputAdornment>,
                      },
                    }}
                  />
                  <Button type="submit" variant="contained" size="large" sx={{ bgcolor: '#0E9F6E', px: 3, whiteSpace: 'nowrap', '&:hover': { bgcolor: '#057A55' } }}>
                    Search
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', gap: 3, mt: 3, flexWrap: 'wrap' }}>
                  <Button component={Link} to="/ai-assistant" variant="outlined" startIcon={<SmartToy />}
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white' } }}>
                    Ask AI Assistant
                  </Button>
                  <Button component={Link} to="/emergency" variant="contained" color="error" startIcon={<Emergency />}>
                    Emergency Help
                  </Button>
                </Box>
              </motion.div>
            </Grid>

            {/* Stats */}
            <Grid size={{ xs: 12, md: 5 }}>
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                <Grid container spacing={2}>
                  {STATS.map((stat) => (
                    <Grid size={6} key={stat.label}>
                      <Paper sx={{ p: 2.5, bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#60A5FA' }}>{stat.value}</Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>{stat.label}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Categories */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Explore Community Services
          </Typography>
          <Typography color="text.secondary">
            Find what you need across all major service categories
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Grid
            container
            spacing={2}
            sx={{
              maxWidth: '900px', // Adjust this to control the max width of the grid
              justifyContent: 'center',
            }}
          >
            {CATEGORIES.map((cat) => (
              <Grid size={{ xs: 6, sm: 4, md: 2 }} key={cat.label}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  style={{ height: '100%' }}
                >
                  <Card
                    component={Link}
                    to={cat.path}
                    sx={{
                      textDecoration: 'none',
                      textAlign: 'center',
                      cursor: 'pointer',
                      width: '100%',
                      minWidth: 120,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 2,
                      border: '1px solid #E5E7EB',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: '#1A56DB',
                        boxShadow: '0 4px 20px rgba(26,86,219,0.15)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 3,
                        bgcolor: cat.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1.5,
                        color: cat.iconColor,
                        flexShrink: 0,
                      }}
                    >
                      {cat.icon}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {cat.label}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      {/* Features section */}
      <Box sx={{ bgcolor: '#F9FAFB', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 600 }}>Smart Features</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>AI-Powered Community Assistant</Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Our GPT-4 powered assistant understands natural language to help you find services, request help, and navigate community resources instantly.
              </Typography>
              {[
                'Find O+ blood donors within 20km',
                'Dispatch the nearest ambulance automatically',
                'Book hospital appointments with one tap',
                'Get real-time emergency response suggestions',
              ].map((feature) => (
                <Box key={feature} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <CheckCircle sx={{ color: '#0E9F6E', fontSize: 20 }} />
                  <Typography variant="body2">{feature}</Typography>
                </Box>
              ))}
              <Button component={Link} to="/ai-assistant" variant="contained" endIcon={<ArrowForward />} sx={{ mt: 2 }}>
                Try AI Assistant
              </Button>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3, bgcolor: '#111928', borderRadius: 3, color: 'white', fontFamily: 'monospace', fontSize: 13 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
                    <Box key={c} sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: c }} />
                  ))}
                </Box>
                {[
                  { role: 'user', msg: 'I need O+ blood urgently in Dhaka' },
                  { role: 'ai', msg: '🩸 Found 3 O+ donors within 5km! Notifying them now...' },
                  { role: 'user', msg: 'Show hospitals with cardiology near me' },
                  { role: 'ai', msg: '🏥 Found 2 hospitals: City Medical (2.1km) ⭐4.8, Apollo (4.3km) ⭐4.6' },
                ].map((m, i) => (
                  <Box key={i} sx={{ mb: 1.5 }}>
                    <Typography sx={{ color: m.role === 'user' ? '#60A5FA' : '#34D399', fontSize: 11, mb: 0.5 }}>
                      {m.role === 'user' ? '👤 You' : '🤖 AI Assistant'}
                    </Typography>
                    <Typography sx={{ color: '#E5E7EB', fontSize: 13, pl: 1 }}>{m.msg}</Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Box sx={{ background: 'linear-gradient(135deg, #1A56DB, #0E9F6E)', py: 8, textAlign: 'center', color: 'white' }}>
        <Container>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>Ready to Get Started?</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 4 }}>
            Join thousands of citizens already using SCSP to access community services smarter.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button component={Link} to="/register" variant="contained" size="large"
              sx={{ bgcolor: 'white', color: '#1A56DB', '&:hover': { bgcolor: '#F3F4F6' } }}>
              Create Free Account
            </Button>
            <Button component={Link} to="/services" variant="outlined" size="large"
              sx={{ borderColor: 'white', color: 'white' }}>
              Browse Services
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
