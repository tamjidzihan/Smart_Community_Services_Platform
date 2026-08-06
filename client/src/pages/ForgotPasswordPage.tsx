import { useState } from 'react'
import {
  Container, Typography, Box, Paper, TextField, Button, Alert
} from '@mui/material'
import LockResetIcon from '@mui/icons-material/LockReset'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/services'
import { Link } from 'react-router-dom'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const forgotMutation = useMutation({
    mutationFn: (e: string) => authApi.forgotPassword(e),
    onSuccess: () => {
      setSubmitted(true)
    },
  })

  return (
    <Box sx={{ minHeight: '100vh', py: 8, bgcolor: 'grey.50' }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
          <LockResetIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Forgot Password
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Enter your registered email address to receive password reset instructions.
          </Typography>

          {submitted ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              If an account with this email exists, a password reset link has been dispatched.
            </Alert>
          ) : (
            <Box component="form" onSubmit={(e) => { e.preventDefault(); forgotMutation.mutate(email); }}>
              <TextField
                fullWidth
                type="email"
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 3 }}
                required
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={!email || forgotMutation.isPending}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                {forgotMutation.isPending ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </Box>
          )}

          <Button component={Link} to="/login" sx={{ mt: 3 }}>
            Back to Login
          </Button>
        </Paper>
      </Container>
    </Box>
  )
}
