import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Container, Box, Card, Typography, TextField, Button, Divider, Alert, InputAdornment, IconButton } from '@mui/material'
import { Google, Visibility, VisibilityOff, LocalHospital, Bloodtype, School, People, AccountBalance } from '@mui/icons-material'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/services'
import { useAuthStore } from '../store/authStore'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})
type FormData = z.infer<typeof schema>

const FEATURES = [
  { icon: <LocalHospital />, label: 'Find nearby hospitals & clinics' },
  { icon: <Bloodtype />, label: 'Connect with blood donors' },
  { icon: <School />, label: 'Educational resources' },
  { icon: <People />, label: 'NGO support network' },
  { icon: <AccountBalance />, label: 'Government services' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const loginMutation = useMutation({
    mutationFn: (data: FormData) => authApi.login(data.email, data.password),
    onSuccess: (res) => {
      setTokens(res.data.access, res.data.refresh)
      setUser(res.data.user)
      navigate('/dashboard')
    },
    onError: (e: { response?: { data?: { detail?: string } } }) => setError(e.response?.data?.detail || 'Login failed. Please check your credentials.'),
  })

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB', display: 'flex' }}>
      {/* Left feature panel (desktop only) */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flex: 1,
          background: 'linear-gradient(160deg, #1E3A8A 0%, #1A56DB 45%, #0E9F6E 100%)',
          color: 'white',
          flexDirection: 'column',
          justifyContent: 'center',
          p: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <Box sx={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position: 'absolute', bottom: -120, left: -60, width: 350, height: 350, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />

        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <Typography sx={{ fontWeight: 900, fontSize: 22 }}>S</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 20, lineHeight: 1.2 }}>SCSP</Typography>
              <Typography sx={{ fontSize: 11, opacity: 0.7, letterSpacing: '0.06em' }}>SMART COMMUNITY SERVICES</Typography>
            </Box>
          </Box>

          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.2 }}>
            Welcome back to your<br />community hub.
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 4, fontSize: 17, lineHeight: 1.6 }}>
            Sign in to access AI-powered assistance, emergency services, medical resources, and more — all in one place.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {FEATURES.map((f, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {f.icon}
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 15 }}>{f.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right login form */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 3, md: 6 } }}>
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Card sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: '#111928' }}>
              Welcome back
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4, fontSize: 15 }}>
              Sign in to your SCSP account to continue
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit((d) => loginMutation.mutate(d))}>
              <TextField
                fullWidth
                label="Email address"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ mb: 2.5 }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                sx={{ mb: 1 }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Box sx={{ textAlign: 'right', mb: 3 }}>
                <Link to="/forgot-password" style={{ color: '#1A56DB', fontSize: 14, fontWeight: 600 }}>
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
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: 15,
                  background: 'linear-gradient(135deg, #1A56DB, #1E3A8A)',
                  '&:hover': { background: 'linear-gradient(135deg, #1E3A8A, #1A56DB)' },
                  '&:disabled': { background: 'rgba(26,86,219,0.5)' },
                }}
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>

            <Divider sx={{ my: 3, '&::before, &::after': { borderColor: '#E5E7EB' } }}>
              <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600, px: 1 }}>OR CONTINUE WITH</Typography>
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<Google />}
              href="/social-auth/login/google-oauth2/"
              size="large"
              sx={{ py: 1.4, borderRadius: 2, borderColor: '#D1D5DB', color: '#374151', fontWeight: 600, '&:hover': { bgcolor: '#F9FAFB', borderColor: '#9CA3AF' } }}
            >
              Continue with Google
            </Button>

            <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, color: '#6B7280' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#1A56DB', fontWeight: 700 }}>
                Sign up free
              </Link>
            </Typography>
          </Card>

          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 3, color: '#9CA3AF' }}>
            Secured by SCSP • Need help?{' '}
            <Link to="/contact" style={{ color: '#1A56DB', fontWeight: 600 }}>Contact support</Link>
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}