import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Container,
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Paper,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  LocalHospital,
  Bloodtype,
  VerifiedUser,
  MedicationLiquid,
  AdminPanelSettings,
  Person,
  AutoAwesome,
  Security,
  Speed,
} from '@mui/icons-material'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/services'
import { useAuthStore } from '../store/authStore'

const schema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

type UserRoleTab = 'citizen' | 'doctor' | 'admin'

const ROLE_INFO = {
  citizen: {
    label: 'Patient / Citizen',
    icon: <Person fontSize="small" />,
    badge: 'Standard Access',
    color: '#0D9488',
    title: 'Patient & Citizen Portal',
    desc: 'Book doctor appointments, view lab schedules, track emergency ambulances, and connect with blood donors.',
    demoEmail: 'citizen@smarthealth.local',
    demoPass: 'citizen1234',
  },
  doctor: {
    label: 'Medical Doctor',
    icon: <MedicationLiquid fontSize="small" />,
    badge: 'Clinical Portal',
    color: '#0284C7',
    title: 'Physician & Specialist Portal',
    desc: 'Manage your hospital chamber rosters, patient queues, leave requests, and digital consultations.',
    demoEmail: 'doctor@smarthealth.local',
    demoPass: 'doctor1234',
  },
  admin: {
    label: 'Platform Admin',
    icon: <AdminPanelSettings fontSize="small" />,
    badge: 'System Control',
    color: '#E11D48',
    title: 'Healthcare Admin Console',
    desc: 'Verify doctors, manage hospital branches, oversee ambulance dispatch, and moderate reviews.',
    demoEmail: 'admin@smarthealth.local',
    demoPass: 'admin1234',
  },
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<UserRoleTab>('citizen')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const loginMutation = useMutation({
    mutationFn: (data: FormData) => authApi.login(data.email, data.password),
    onSuccess: (res) => {
      setTokens(res.data.access, res.data.refresh)
      setUser(res.data.user)

      const userRole = (res.data.user as any)?.role || (res.data.user as any)?.roles?.[0] || ''
      if (userRole === 'admin') {
        navigate('/admin/requests')
      } else {
        navigate('/dashboard')
      }
    },
    onError: (e: { response?: { data?: { detail?: string } } }) => {
      setError(e.response?.data?.detail || 'Login failed. Please verify your credentials.')
    },
  })

  const handleQuickFill = (role: UserRoleTab) => {
    const creds = ROLE_INFO[role]
    setValue('email', creds.demoEmail, { shouldValidate: true })
    setValue('password', creds.demoPass, { shouldValidate: true })
    setError('')
  }

  const roleMeta = ROLE_INFO[activeTab]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0F172A', display: 'flex', color: 'white' }}>
      {/* Left Feature Showcase Panel (Desktop) */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flex: 1.1,
          background: 'linear-gradient(145deg, #042F2E 0%, #0F172A 50%, #134E4A 100%)',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 8,
          position: 'relative',
          overflow: 'hidden',
          borderRight: '1px solid rgba(20, 184, 166, 0.2)',
        }}
      >
        {/* Glow Spheres */}
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            left: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            bgcolor: 'rgba(13, 148, 136, 0.15)',
            filter: 'blur(90px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -80,
            right: -80,
            width: 350,
            height: 350,
            borderRadius: '50%',
            bgcolor: 'rgba(16, 185, 129, 0.12)',
            filter: 'blur(80px)',
          }}
        />

        {/* Top Branding */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 6 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                bgcolor: 'rgba(20, 184, 166, 0.2)',
                border: '1px solid rgba(45, 212, 191, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
              }}
            >
              <LocalHospital sx={{ color: '#2DD4BF', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 22, color: 'white', letterSpacing: '-0.02em' }}>
                Smart Health
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#2DD4BF', letterSpacing: '0.08em', fontWeight: 700 }}>
                HEALTHCARE INTELLIGENCE NETWORK
              </Typography>
            </Box>
          </Box>

          <Box sx={{ maxWidth: 520, spaceY: 3 }}>
            <Chip
              icon={<VerifiedUser sx={{ color: '#2DD4BF !important', fontSize: 16 }} />}
              label="Secured Healthcare Gateway"
              sx={{
                bgcolor: 'rgba(20, 184, 166, 0.15)',
                color: '#5EEAD4',
                fontWeight: 700,
                border: '1px solid rgba(45, 212, 191, 0.3)',
                mb: 2.5,
              }}
            />

            <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.15, mb: 2, color: 'white' }}>
              Connected care for every patient, doctor, and clinic.
            </Typography>

            <Typography sx={{ color: '#94A3B8', fontSize: 16, lineHeight: 1.6, mb: 4 }}>
              Sign in to access verified clinical consultations, live doctor chamber schedules, instant emergency ambulance dispatch, and nationwide blood donor matching.
            </Typography>
          </Box>
        </Box>

        {/* Value Highlights */}
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'rgba(13, 148, 136, 0.2)', color: '#2DD4BF' }}>
              <Speed fontSize="small" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: 'white' }}>
                Instant Schedule Availability Engine
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>
                Real-time doctor leaves & overnight clinic roster computation
              </Typography>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'rgba(225, 29, 72, 0.2)', color: '#FB7185' }}>
              <Bloodtype fontSize="small" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: 'white' }}>
                24/7 Voluntary Blood Donors Network
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>
                Radius-based donor search with instant urgency alerts
              </Typography>
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 3, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              HIPAA-Ready & Encrypted Data
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Smart Health Platform © 2026
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Right Login Section */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2.5, sm: 4, md: 6 },
          bgcolor: '#0B1120',
        }}
      >
        <Container maxWidth="sm" sx={{ py: 2 }}>
          {/* Card Form */}
          <Card
            sx={{
              p: { xs: 3, sm: 4.5 },
              borderRadius: 4,
              bgcolor: '#1E293B',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
              color: 'white',
            }}
          >
            {/* Header */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.02em', mb: 0.5 }}>
                Sign In
              </Typography>
              <Typography sx={{ color: '#94A3B8', fontSize: 14 }}>
                Choose your portal below to sign in to your Smart Health account
              </Typography>
            </Box>

            {/* Role Switcher Tabs */}
            <Box sx={{ mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={(_, val) => {
                  setActiveTab(val)
                  setError('')
                }}
                variant="fullWidth"
                sx={{
                  bgcolor: '#0F172A',
                  p: 0.5,
                  borderRadius: 3,
                  minHeight: 44,
                  '& .MuiTabs-indicator': {
                    bgcolor: roleMeta.color,
                    height: '100%',
                    borderRadius: 2.5,
                    zIndex: 0,
                  },
                }}
              >
                {(['citizen', 'doctor', 'admin'] as UserRoleTab[]).map((role) => (
                  <Tab
                    key={role}
                    value={role}
                    label={ROLE_INFO[role].label}
                    icon={ROLE_INFO[role].icon}
                    iconPosition="start"
                    sx={{
                      zIndex: 1,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: 13,
                      minHeight: 40,
                      color: activeTab === role ? '#FFFFFF' : '#94A3B8',
                      transition: '0.2s',
                      '&.Mui-selected': { color: '#FFFFFF' },
                    }}
                  />
                ))}
              </Tabs>
            </Box>

            {/* Active Role Highlight Banner */}
            <Box
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 2.5,
                bgcolor: 'rgba(15, 23, 42, 0.8)',
                border: `1px solid ${roleMeta.color}40`,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: 'white' }}>
                    {roleMeta.title}
                  </Typography>
                  <Chip
                    size="small"
                    label={roleMeta.badge}
                    sx={{
                      height: 20,
                      fontSize: 10,
                      fontWeight: 700,
                      bgcolor: `${roleMeta.color}20`,
                      color: roleMeta.color,
                      border: `1px solid ${roleMeta.color}60`,
                    }}
                  />
                </Box>
                <Typography sx={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.4 }}>
                  {roleMeta.desc}
                </Typography>
              </Box>

              {/* Quick Fill Button */}
              <Button
                size="small"
                variant="outlined"
                startIcon={<AutoAwesome sx={{ fontSize: 14 }} />}
                onClick={() => handleQuickFill(activeTab)}
                sx={{
                  borderColor: `${roleMeta.color}80`,
                  color: roleMeta.color,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.5,
                  '&:hover': {
                    bgcolor: `${roleMeta.color}15`,
                    borderColor: roleMeta.color,
                  },
                }}
              >
                Demo Fill
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5' }}>
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit((d) => loginMutation.mutate(d))}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                placeholder="name@smarthealth.com"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#0F172A',
                    borderRadius: 2.5,
                    color: 'white',
                    '& fieldset': { borderColor: '#334155' },
                    '&:hover fieldset': { borderColor: roleMeta.color },
                    '&.Mui-focused fieldset': { borderColor: roleMeta.color },
                  },
                  '& .MuiInputLabel-root': { color: '#94A3B8' },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                sx={{
                  mb: 1.5,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#0F172A',
                    borderRadius: 2.5,
                    color: 'white',
                    '& fieldset': { borderColor: '#334155' },
                    '&:hover fieldset': { borderColor: roleMeta.color },
                    '&.Mui-focused fieldset': { borderColor: roleMeta.color },
                  },
                  '& .MuiInputLabel-root': { color: '#94A3B8' },
                }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                          sx={{ color: '#94A3B8' }}
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Link to="/forgot-password" style={{ color: roleMeta.color, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </Box>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loginMutation.isPending}
                sx={{
                  py: 1.5,
                  borderRadius: 2.5,
                  fontWeight: 800,
                  fontSize: 15,
                  textTransform: 'none',
                  bgcolor: roleMeta.color,
                  boxShadow: `0 8px 24px ${roleMeta.color}50`,
                  '&:hover': {
                    bgcolor: roleMeta.color,
                    filter: 'brightness(1.1)',
                  },
                  '&:disabled': {
                    bgcolor: '#334155',
                    color: '#64748B',
                  },
                }}
              >
                {loginMutation.isPending ? 'Authenticating...' : `Sign in as ${ROLE_INFO[activeTab].label}`}
              </Button>
            </Box>

            <Divider sx={{ my: 3, borderColor: '#334155' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, px: 1 }}>
                SECURE ACCESS
              </Typography>
            </Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                New to Smart Health Platform?{' '}
                <Link to="/register" style={{ color: '#2DD4BF', fontWeight: 700, textDecoration: 'none' }}>
                  Create an account
                </Link>
              </Typography>
            </Box>
          </Card>

          {/* Bottom Security Footer */}
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', alignItems: 'center', mt: 3, color: '#64748B' }}>
            <Security fontSize="small" />
            <Typography variant="caption">
              End-to-End Encrypted Session • Standard Role-Based Access Control
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}