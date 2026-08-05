import { useState } from 'react'
import {
  Container, Typography, Box, Grid, Card, CardContent, TextField, Button, Chip,
  CircularProgress, Alert, Paper, InputAdornment, Divider, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import SearchIcon from '@mui/icons-material/Search'
import VerifiedIcon from '@mui/icons-material/Verified'
import GroupsIcon from '@mui/icons-material/Groups'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ngoApi } from '../api/services'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

import AddIcon from '@mui/icons-material/Add'
import AdminAddEntityModal from '../components/admin/AdminAddEntityModal'

export default function NGOPage() {
  const [search, setSearch] = useState('')
  const [openRegisterModal, setOpenRegisterModal] = useState(false)
  const [openAddModal, setOpenAddModal] = useState(false)
  const [skills, setSkills] = useState('')
  const [regSuccess, setRegSuccess] = useState(false)

  const { isAuthenticated, hasRole } = useAuthStore()
  const canAdd = isAuthenticated && (hasRole('admin') || hasRole('moderator'))
  const navigate = useNavigate()

  const { data: ngoData, isLoading, error } = useQuery({
    queryKey: ['ngos', search],
    queryFn: async () => {
      const res = await ngoApi.getNGOs({ search })
      return res.data
    },
  })

  const volunteerMutation = useMutation({
    mutationFn: (data: any) => ngoApi.registerVolunteer(data),
    onSuccess: () => {
      setRegSuccess(true)
      setOpenRegisterModal(false)
      setSkills('')
    },
  })

  const handleOpenRegister = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setOpenRegisterModal(true)
    setRegSuccess(false)
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 6, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <VolunteerActivismIcon fontSize="large" color="primary" /> NGOs & Community Volunteers
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Connect with non-profit organizations, participate in social initiatives, and sign up as a volunteer.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" size="large" onClick={handleOpenRegister} sx={{ borderRadius: 3, px: 3, fontWeight: 700 }}>
              Register as Volunteer
            </Button>
            {canAdd && (
              <Button variant="outlined" size="large" startIcon={<AddIcon />} onClick={() => setOpenAddModal(true)} sx={{ borderRadius: 3, px: 3, fontWeight: 700 }}>
                Add NGO
              </Button>
            )}
          </Box>
        </Box>

        {regSuccess && (
          <Alert severity="success" sx={{ mb: 4 }} onClose={() => setRegSuccess(false)}>
            You have successfully registered as a community volunteer! Local NGOs will contact you for initiatives.
          </Alert>
        )}

        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Search NGO by name, social cause, or focus area (e.g. Disaster Relief, Health)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Paper>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            Error fetching NGO registry.
          </Alert>
        )}

        {ngoData && (
          <Grid container spacing={3}>
            {ngoData.results.map((ngo) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={ngo.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4 } }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Chip label="Verified NGO" color="primary" size="small" variant="outlined" />
                      {ngo.is_verified && <Chip icon={<VerifiedIcon />} label="Certified" color="success" size="small" />}
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      {ngo.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {ngo.description || 'Non-profit organization dedicated to community development and humanitarian support.'}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {ngo.address}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GroupsIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        Active Volunteers: <strong>{ngo.volunteer_count || 24}</strong>
                      </Typography>
                    </Box>
                  </CardContent>

                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button fullWidth variant="outlined" onClick={handleOpenRegister} sx={{ borderRadius: 2 }}>
                      Join Initiatives
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Volunteer Modal */}
        <Dialog open={openRegisterModal} onClose={() => setOpenRegisterModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Register as a Community Volunteer</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Join our network of community volunteers to help during medical emergencies, blood drives, and social welfare events.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Your Skills & Areas of Interest"
              placeholder="e.g. First Aid certified, Event Management, Driving, Teaching..."
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenRegisterModal(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={!skills || volunteerMutation.isPending}
              onClick={() => volunteerMutation.mutate({ skills })}
            >
              {volunteerMutation.isPending ? 'Registering...' : 'Complete Volunteer Signup'}
            </Button>
          </DialogActions>
        </Dialog>

        <AdminAddEntityModal open={openAddModal} onClose={() => setOpenAddModal(false)} initialTab={4} />
      </Container>
    </Box>
  )
}
