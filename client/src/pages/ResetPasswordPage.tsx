import { useState } from 'react'
import {
  Container, Typography, Box, Paper, TextField, Button, Alert
} from '@mui/material'
import KeyIcon from '@mui/icons-material/Key'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/services'
import { Link } from 'react-router-dom'

export default function ResetPasswordPage() {
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const resetMutation = useMutation({
    mutationFn: () => authApi.resetPassword(token, password, confirmPassword),
    onSuccess: () => {
      setSuccess(true)
      setErrorMsg('')
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Invalid reset token or passwords do not match.')
    },
  })

  return (
    <Box sx={{ minHeight: '100vh', py: 8, bgcolor: 'grey.50' }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
          <KeyIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Reset Account Password
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Enter your reset token and your new account password below.
          </Typography>

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Your password has been successfully reset! You can now log in with your new password.
            </Alert>
          )}

          {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

          {!success && (
            <Box component="form" onSubmit={(e) => { e.preventDefault(); resetMutation.mutate(); }}>
              <TextField
                fullWidth
                label="Reset Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{ mb: 3 }}
                required
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={!token || !password || resetMutation.isPending}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
              </Button>
            </Box>
          )}

          <Button component={Link} to="/login" sx={{ mt: 3 }}>
            Return to Login
          </Button>
        </Paper>
      </Container>
    </Box>
  )
}
