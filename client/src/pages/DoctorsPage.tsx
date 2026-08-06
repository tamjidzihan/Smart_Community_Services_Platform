import { useState } from 'react'
import {
  Container, Typography, Box, Grid, Card, CardContent, TextField, Button, Avatar,
  Chip, Rating, CircularProgress, Alert, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, InputAdornment, Divider
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import { useQuery, useMutation } from '@tanstack/react-query'
import { healthcareApi } from '../api/services'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

import AddIcon from '@mui/icons-material/Add'
import AdminAddEntityModal from '../components/admin/AdminAddEntityModal'

export default function DoctorsPage() {
  const [search, setSearch] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [scheduledAt, setScheduledAt] = useState('')
  const [reason, setReason] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [openAddModal, setOpenAddModal] = useState(false)

  const { isAuthenticated, hasRole } = useAuthStore()
  const canAdd = isAuthenticated && (hasRole('admin') || hasRole('moderator'))
  const navigate = useNavigate()

  const { data: doctorsData, isLoading, error } = useQuery({
    queryKey: ['doctors', search],
    queryFn: async () => {
      const res = await healthcareApi.getDoctors({ search })
      return res.data
    },
  })

  const bookMutation = useMutation({
    mutationFn: (data: { doctor: string; scheduled_at: string; reason: string }) =>
      healthcareApi.bookAppointment(data),
    onSuccess: () => {
      setBookingSuccess(true)
      setSelectedDoctor(null)
      setScheduledAt('')
      setReason('')
    },
  })

  const handleOpenBooking = (doc: any) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setSelectedDoctor(doc)
    setBookingSuccess(false)
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 6, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
              Find Specialist Doctors
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Book online and in-person medical consultations with verified physicians.
            </Typography>
          </Box>

          {canAdd && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddModal(true)}
              sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 700 }}
            >
              Add Doctor
            </Button>
          )}
        </Box>

        {bookingSuccess && (
          <Alert severity="success" sx={{ mb: 4 }} onClose={() => setBookingSuccess(false)}>
            Appointment booked successfully! You can track your booking status in your Appointments dashboard.
          </Alert>
        )}

        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Search doctor by name, specialization (e.g. Cardiology, Pediatrics)..."
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
            Error loading doctors. Please ensure the backend server is operational.
          </Alert>
        )}

        {doctorsData && (
          <Grid container spacing={3}>
            {doctorsData.results.map((doc) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={doc.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4 } }}>
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                    <Avatar
                      src={doc.avatar_url}
                      sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: 32 }}
                    >
                      {doc.full_name?.charAt(0) || 'D'}
                    </Avatar>

                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {doc.full_name}
                    </Typography>

                    <Chip
                      icon={<MedicalServicesIcon />}
                      label={doc.specialization || 'General Practitioner'}
                      color="primary"
                      size="small"
                      sx={{ my: 1 }}
                    />

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                      {doc.hospital_name || 'Associated Medical Center'}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Fee: <strong>${doc.consultation_fee || 50}</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Rating value={doc.average_rating || 4.8} precision={0.5} readOnly size="small" />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {doc.average_rating || 4.8}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>

                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<EventAvailableIcon />}
                      onClick={() => handleOpenBooking(doc)}
                      sx={{ borderRadius: 2 }}
                    >
                      Book Appointment
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Booking Dialog */}
        <Dialog open={!!selectedDoctor} onClose={() => setSelectedDoctor(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Book Appointment with {selectedDoctor?.full_name}
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Specialization: <strong>{selectedDoctor?.specialization}</strong> ({selectedDoctor?.hospital_name})
            </Typography>

            <TextField
              fullWidth
              type="datetime-local"
              label="Schedule Date & Time"
              slotProps={{ inputLabel: { shrink: true } }}
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason for Visit / Symptoms"
              placeholder="Describe your health concern or symptoms..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setSelectedDoctor(null)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={!scheduledAt || !reason || bookMutation.isPending}
              onClick={() =>
                bookMutation.mutate({
                  doctor: selectedDoctor.id,
                  scheduled_at: new Date(scheduledAt).toISOString(),
                  reason,
                })
              }
            >
              {bookMutation.isPending ? 'Booking...' : 'Confirm Appointment'}
            </Button>
          </DialogActions>
        </Dialog>

        <AdminAddEntityModal open={openAddModal} onClose={() => setOpenAddModal(false)} initialTab={2} />
      </Container>
    </Box>
  )
}
