import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Container, Card, Typography, TextField, Button, Alert, Box, InputAdornment, IconButton, Divider } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/services'
import { useState } from 'react'
import { Visibility, VisibilityOff, CheckCircle, LocalHospital, Bloodtype, School, People, AccountBalance } from '@mui/icons-material'

const schema = z.object({
  full_name: z.string().min(2, 'Full name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] })
type FormData = z.infer<typeof schema>

const BENEFITS = [
  { icon: <LocalHospital />, label: 'Emergency services & hospitals' },
  { icon: <Bloodtype />, label: 'Blood donor network' },
  { icon: <School />, label: 'Education resources' },
  { icon: <People />, label: 'NGO & community support' },
  { icon: <AccountBalance />, label: 'Government services' },
]

export default function RegisterPage() {
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (res) => setSuccess(res.data.message),
    onError: (e: { response?: { data?: { detail?: string } } }) => {
      const msg = e.response?.data?.detail
      if (msg) setSuccess('')
    },
  })

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB', display: 'flex' }}>
      {/* Left benefits panel (desktop only) */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flex: 1,
          background: 'linear-gradient(160deg, #0E9F6E 0%, #1A56DB 60%, #1E3A8A 100%)',
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
            Join your community's<br />digital ecosystem.
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 4, fontSize: 17, lineHeight: 1.6 }}>
            Create a free account to access essential services, connect with providers, and get AI-powered assistance.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {BENEFITS.map((b, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {b.icon}
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 15 }}>{b.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right registration form */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 3, md: 6 } }}>
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Card sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: '#111928' }}>
              Create Account
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4, fontSize: 15 }}>
              Join the SCSP community — it's free and takes less than a minute
            </Typography>

            {success && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} icon={<CheckCircle fontSize="inherit" />}>
                {success}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit((d) => mutation.mutate(d))}>
              <TextField
                fullWidth
                label="Full Name"
                placeholder="John Doe"
                {...register('full_name')}
                error={!!errors.full_name}
                helperText={errors.full_name?.message}
                sx={{ mb: 2.5 }}
              />

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
                placeholder="Minimum 8 characters"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                sx={{ mb: 2.5 }}
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

              <TextField
                fullWidth
                label="Confirm Password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter your password"
                {...register('confirm_password')}
                error={!!errors.confirm_password}
                helperText={errors.confirm_password?.message}
                sx={{ mb: 3 }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small">
                          {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={mutation.isPending}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: 15,
                  background: 'linear-gradient(135deg, #0E9F6E, #057A55)',
                  '&:hover': { background: 'linear-gradient(135deg, #057A55, #0E9F6E)' },
                  '&:disabled': { background: 'rgba(14,159,110,0.5)' },
                }}
              >
                {mutation.isPending ? 'Creating account...' : 'Create Account'}
              </Button>
            </Box>

            <Divider sx={{ my: 3, '&::before, &::after': { borderColor: '#E5E7EB' } }}>
              <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600, px: 1 }}>ALREADY REGISTERED?</Typography>
            </Divider>

            <Button
              fullWidth
              component={Link}
              to="/login"
              variant="outlined"
              size="large"
              sx={{ py: 1.4, borderRadius: 2, borderColor: '#D1D5DB', color: '#374151', fontWeight: 600, '&:hover': { bgcolor: '#F9FAFB', borderColor: '#9CA3AF' } }}
            >
              Sign in to your account
            </Button>

            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 3, color: '#9CA3AF' }}>
              By creating an account, you agree to our{' '}
              <Link to="/terms" style={{ color: '#1A56DB', fontWeight: 600 }}>Terms of Service</Link> and{' '}
              <Link to="/privacy" style={{ color: '#1A56DB', fontWeight: 600 }}>Privacy Policy</Link>
            </Typography>
          </Card>
        </Container>
      </Box>
    </Box>
  )
}