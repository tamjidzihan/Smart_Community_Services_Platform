import { useState, useEffect } from 'react'
import {
  Container, Typography, Box, Paper, Grid, Avatar, TextField, Button, Alert, Divider, Chip
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import HomeIcon from '@mui/icons-material/Home'
import { useAuthStore } from '../store/authStore'
import { useMutation, useQuery } from '@tanstack/react-query'
import { authApi } from '../api/services'
import type { UserProfile } from '../types'

interface ProfilePayload {
  full_name: string
  phone: string
  address: string
  bio: string
}

interface ApiError {
  response?: { data?: { detail?: string } }
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()

  const [fullName, setFullName] = useState(user?.profile?.full_name || '')
  const [phone, setPhone] = useState(user?.profile?.phone || '')
  const [address, setAddress] = useState(user?.profile?.address || '')
  const [bio, setBio] = useState(user?.profile?.bio || '')

  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Fetch fresh user data from the backend on mount
  const { data: freshUser } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
    enabled: !!user,
  })

  // Sync the external Zustand store when fresh backend data arrives
  // (no local React setState in the effect to avoid cascading renders)
  useEffect(() => {
    if (freshUser?.data) {
      setUser(freshUser.data)
    }
  }, [freshUser, setUser])

  // Display name comes from the store (source of truth), falling back to the draft
  const displayName = user?.profile?.full_name || fullName

  const profileMutation = useMutation({
    mutationFn: (data: ProfilePayload) => authApi.updateProfile(data),
    onSuccess: (res) => {
      setUpdateSuccess(true)
      const base = freshUser?.data || user
      if (base) {
        const updatedUser = { ...base, profile: res.data as UserProfile }
        setUser(updatedUser)
        // Sync the local form state with the freshly saved values
        setFullName(res.data?.full_name || '')
        setPhone(res.data?.phone || '')
        setAddress(res.data?.address || '')
        setBio(res.data?.bio || '')
      }
    },
    onError: (err: ApiError) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to update profile.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateSuccess(false)
    setErrorMsg('')
    profileMutation.mutate({
      full_name: fullName,
      phone,
      address,
      bio,
    })
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 6, bgcolor: 'grey.50' }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 32, fontWeight: 700 }}>
              {displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {displayName || 'Citizen Profile'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {user?.email}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                {user?.roles?.map((r) => (
                  <Chip key={r.id} label={r.name.toUpperCase()} color="primary" size="small" />
                ))}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {updateSuccess && <Alert severity="success" sx={{ mb: 3 }}>Profile updated successfully!</Alert>}
          {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />,
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  value={user?.email || ''}
                  disabled
                  slotProps={{
                    input: {
                      startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />,
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: <PhoneIcon color="action" sx={{ mr: 1 }} />,
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Residential Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: <HomeIcon color="action" sx={{ mr: 1 }} />,
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Short Bio / Notes"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={profileMutation.isPending}
                  sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
                >
                  {profileMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
    </Box>
  )
}