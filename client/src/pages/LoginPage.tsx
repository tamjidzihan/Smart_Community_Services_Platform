import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Container, Box, Card, Typography, TextField, Button, Divider, Alert } from '@mui/material'
import { Google } from '@mui/icons-material'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/services'
import { useAuthStore } from '../store/authStore'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const [error, setError] = useState('')

  const loginMutation = useMutation({
    mutationFn: (data: FormData) => authApi.login(data.email, data.password),
    onSuccess: (res) => {
      setTokens(res.data.access, res.data.refresh)
      setUser(res.data.user)
      navigate('/dashboard')
    },
    onError: (e: any) => setError(e.response?.data?.detail || 'Login failed. Please check your credentials.'),
  })

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Welcome back</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>Sign in to your SCSP account</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit((d) => loginMutation.mutate(d))}>
          <TextField fullWidth label="Email" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} sx={{ mb: 2 }} />
          <TextField fullWidth label="Password" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} sx={{ mb: 1 }} />
          <Box sx={{ textAlign: 'right', mb: 2 }}>
            <Link to="/forgot-password" style={{ color: '#1A56DB', fontSize: 14 }}>Forgot password?</Link>
          </Box>
          <Button fullWidth type="submit" variant="contained" size="large" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </Button>
        </Box>
        <Divider sx={{ my: 2 }}>or</Divider>
        <Button fullWidth variant="outlined" startIcon={<Google />} href="/social-auth/login/google-oauth2/" size="large">
          Continue with Google
        </Button>
        <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
          Don't have an account? <Link to="/register" style={{ color: '#1A56DB' }}>Sign up</Link>
        </Typography>
      </Card>
    </Container>
  )
}
