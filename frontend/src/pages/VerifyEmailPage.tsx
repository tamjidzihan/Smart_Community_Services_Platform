import { useState } from 'react'
import {
  Container, Typography, Box, Paper, TextField, Button, Alert
} from '@mui/material'
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/services'
import { Link } from 'react-router-dom'

export default function VerifyEmailPage() {
  const [token, setToken] = useState('')
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const verifyMutation = useMutation({
    mutationFn: (tok: string) => authApi.verifyEmail(tok),
    onSuccess: () => {
      setSuccess(true)
      setErrorMsg('')
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Invalid or expired verification token.')
    },
  })

  return (
    <Box sx={{ minHeight: '100vh', py: 8, bgcolor: 'grey.50' }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
          <MarkEmailReadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Email Verification
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Enter your verification token sent to your email to activate your SCSP account.
          </Typography>

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Your email has been successfully verified! You can now log in.
            </Alert>
          )}

          {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

          {!success && (
            <Box component="form" onSubmit={(e) => { e.preventDefault(); verifyMutation.mutate(token); }}>
              <TextField
                fullWidth
                label="Verification Token"
                placeholder="Paste token here..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                sx={{ mb: 3 }}
                required
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={!token || verifyMutation.isPending}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                {verifyMutation.isPending ? 'Verifying...' : 'Verify Email Address'}
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
