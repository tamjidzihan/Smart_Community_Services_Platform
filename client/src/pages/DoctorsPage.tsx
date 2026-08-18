/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import {
  Container, Typography, Box, Grid, Card, CardContent, TextField, Button, Avatar,
  Chip, Rating, CircularProgress, Alert, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, InputAdornment, Divider, IconButton, Tooltip, Stack,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import ViewListIcon from '@mui/icons-material/ViewList'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { healthcareApi } from '../api/services'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AdminAddEntityModal from '../components/admin/AdminAddEntityModal'
import type { Doctor } from '../types'

export default function DoctorsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [scheduledAt, setScheduledAt] = useState('')
  const [reason, setReason] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [openAddModal, setOpenAddModal] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null)

  // Form states
  const [fullName, setFullName] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [consultationFee, setConsultationFee] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [formError, setFormError] = useState('')

  const { isAuthenticated, hasRole } = useAuthStore()
  const canAdd = isAuthenticated && (hasRole('admin') || hasRole('moderator'))
  const canEdit = isAuthenticated && (hasRole('admin') || hasRole('moderator'))
  const navigate = useNavigate()

  // View mode state: 'grid' or 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Doctor> }) =>
      healthcareApi.updateDoctor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      handleCloseEditDialog()
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || err.message || 'Failed to update doctor')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: healthcareApi.deleteDoctor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      setDeleteConfirmOpen(false)
      setDoctorToDelete(null)
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

  const handleOpenEditDialog = (doc: Doctor) => {
    setEditingDoctor(doc)
    setFullName(doc.full_name)
    setSpecialization(doc.specialization)
    setPhone(doc.phone || '')
    setEmail(doc.email || '')
    setBio(doc.bio || '')
    setConsultationFee(doc.consultation_fee ? String(doc.consultation_fee) : '')
    setIsAvailable(doc.is_available)
    setFormError('')
    setEditDialogOpen(true)
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setEditingDoctor(null)
    setFormError('')
  }

  const handleSaveEdit = () => {
    if (!editingDoctor) return
    if (!fullName.trim() || !specialization.trim()) {
      setFormError('Full name and specialization are required')
      return
    }
    updateMutation.mutate({
      id: editingDoctor.id,
      data: {
        full_name: fullName,
        specialization,
        phone: phone || undefined,
        email: email || undefined,
        bio: bio || undefined,
        consultation_fee: consultationFee ? Number(consultationFee) : null,
        is_available: isAvailable,
      },
    })
  }

  const handleOpenDeleteConfirm = (doc: Doctor) => {
    setDoctorToDelete(doc)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!doctorToDelete) return
    deleteMutation.mutate(doctorToDelete.id)
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
          <Box sx={{ display: 'flex', gap: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 0.5 }}>
            <Tooltip title="Grid View">
              <IconButton
                size="small"
                color={viewMode === 'grid' ? 'primary' : 'inherit'}
                onClick={() => setViewMode('grid')}
              >
                <ViewModuleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="List View">
              <IconButton
                size="small"
                color={viewMode === 'list' ? 'primary' : 'inherit'}
                onClick={() => setViewMode('list')}
              >
                <ViewListIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
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
          viewMode === 'grid' ? (
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

                    <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1, alignItems: 'center' }}>
                      {canEdit && (
                        <Tooltip title="Edit doctor">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEditDialog(doc)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canEdit && (
                        <Tooltip title="Delete doctor">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDeleteConfirm(doc)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<EventAvailableIcon />}
                        onClick={() => handleOpenBooking(doc)}
                        sx={{ borderRadius: 2, ml: 'auto' }}
                      >
                        Book Appointment
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {doctorsData.results.map((doc) => (
                <Card key={doc.id} sx={{ borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4 } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                      <Avatar
                        src={doc.avatar_url}
                        sx={{ width: 70, height: 70, bgcolor: 'primary.main', fontSize: 28, flexShrink: 0 }}
                      >
                        {doc.full_name?.charAt(0) || 'D'}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {doc.full_name}
                          </Typography>
                          <Chip
                            icon={<MedicalServicesIcon />}
                            label={doc.specialization || 'General Practitioner'}
                            color="primary"
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {doc.hospital_name || 'Associated Medical Center'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Typography variant="body2" color="text.secondary">
                            Fee: <strong>${doc.consultation_fee || 50}</strong>
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Rating value={doc.average_rating || 4.8} precision={0.5} readOnly size="small" />
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {doc.average_rating || 4.8}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        {canEdit && (
                          <Tooltip title="Edit doctor">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenEditDialog(doc)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canEdit && (
                          <Tooltip title="Delete doctor">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDeleteConfirm(doc)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Button
                          variant="contained"
                          startIcon={<EventAvailableIcon />}
                          onClick={() => handleOpenBooking(doc)}
                          sx={{ borderRadius: 2 }}
                        >
                          Book Appointment
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )
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

        {/* Edit Doctor Dialog */}
        <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Edit Doctor</DialogTitle>
          <DialogContent dividers>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <TextField
                fullWidth
                label="Specialization"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                required
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth
                label="Bio"
                multiline
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <TextField
                fullWidth
                label="Consultation Fee ($)"
                type="number"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
              />
              <FormControl fullWidth>
                <InputLabel>Availability</InputLabel>
                <Select
                  value={isAvailable ? 'yes' : 'no'}
                  label="Availability"
                  onChange={(e) => setIsAvailable(e.target.value === 'yes')}
                >
                  <MenuItem value="yes">Available</MenuItem>
                  <MenuItem value="no">Not Available</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseEditDialog} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ px: 3, fontWeight: 600, borderRadius: 2 }}
              disabled={updateMutation.isPending}
              onClick={handleSaveEdit}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete <strong>{doctorToDelete?.full_name}</strong>? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button
              onClick={handleConfirmDelete}
              variant="contained"
              color="error"
              sx={{ px: 3, fontWeight: 600, borderRadius: 2 }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}
