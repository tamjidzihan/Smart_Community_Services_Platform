/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import {
  Container, Typography, Box, Grid, Card, CardContent, TextField, Button, MenuItem,
  Chip, Rating, CircularProgress, Alert, Paper, InputAdornment, Divider,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Stack,
  FormControl, InputLabel, Select,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import HotelIcon from '@mui/icons-material/Hotel'
import VerifiedIcon from '@mui/icons-material/Verified'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import ViewListIcon from '@mui/icons-material/ViewList'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { healthcareApi, adminApi } from '../api/services'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import AdminAddEntityModal from '../components/admin/AdminAddEntityModal'
import type { Hospital } from '../types'

export default function HospitalsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [emergencyOnly, setEmergencyOnly] = useState('')
  const [openAddModal, setOpenAddModal] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null)
  const [hospitalToDelete, setHospitalToDelete] = useState<Hospital | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [bedCount, setBedCount] = useState('')
  const [availableBeds, setAvailableBeds] = useState('')
  const [emergencyAvailable, setEmergencyAvailable] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [formError, setFormError] = useState('')

  const { isAuthenticated, hasRole } = useAuthStore()
  const canAdd = isAuthenticated && (hasRole('admin') || hasRole('moderator'))
  const isAdmin = hasRole('admin') || hasRole('moderator')

  // View mode state: 'grid' or 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { data: hospitalsData, isLoading, error } = useQuery({
    queryKey: ['hospitals', search, emergencyOnly],
    queryFn: async () => {
      const res = await healthcareApi.getHospitals({
        search,
        emergency_available: emergencyOnly ? emergencyOnly === 'true' : undefined,
      })
      return res.data
    },
  })

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Hospital> }) => adminApi.updateHospital(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] })
      handleCloseEditDialog()
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || err.message || 'Failed to update hospital')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteHospital,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] })
      setDeleteConfirmOpen(false)
      setHospitalToDelete(null)
    },
  })

  const handleOpenEdit = (hospital: any) => {
    setEditingHospital(hospital)
    setName(hospital.name)
    setDescription(hospital.description || '')
    setAddress(hospital.address)
    setPhone(hospital.phone || '')
    setEmail(hospital.email || '')
    setWebsite(hospital.website || '')
    setBedCount(hospital.bed_count?.toString() || '')
    setAvailableBeds(hospital.available_beds?.toString() || '')
    setEmergencyAvailable(hospital.emergency_available || false)
    setIsVerified(hospital.is_verified || false)
    setFormError('')
    setEditDialogOpen(true)
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setEditingHospital(null)
    setFormError('')
  }

  const handleOpenDeleteConfirm = (hospital: any) => {
    setHospitalToDelete(hospital)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (hospitalToDelete) {
      deleteMutation.mutate(hospitalToDelete.id)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!editingHospital) return

    const payload: Partial<Hospital> = {
      name,
      description,
      address,
      phone,
      email,
      website,
      bed_count: bedCount ? parseInt(bedCount) : undefined,
      available_beds: availableBeds ? parseInt(availableBeds) : undefined,
      emergency_available: emergencyAvailable,
      is_verified: isVerified,
    }

    updateMutation.mutate({ id: editingHospital.id, data: payload })
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 6, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
              Hospitals & Healthcare Facilities
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Find nearby hospitals, check bed availability, and book specialist doctor consultations.
            </Typography>
          </Box>

          {canAdd && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddModal(true)}
              sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 700 }}
            >
              Add Hospital
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

        {/* Filters */}
        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <TextField
                fullWidth
                placeholder="Search hospital by name, address, or medical department..."
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
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                select
                label="Emergency Care Status"
                value={emergencyOnly}
                onChange={(e) => setEmergencyOnly(e.target.value)}
              >
                <MenuItem value="">All Facilities</MenuItem>
                <MenuItem value="true">24/7 Emergency Available Only</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            Error loading hospitals. Please check backend connection.
          </Alert>
        )}

        {hospitalsData && (
          viewMode === 'grid' ? (
            <Grid container spacing={3}>
            {hospitalsData.results.map((hospital) => (
              <Grid size={{ xs: 12, md: 6 }} key={hospital.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4 } }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalHospitalIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {hospital.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        {hospital.is_verified && <Chip icon={<VerifiedIcon />} label="Verified" color="success" size="small" />}
                        {isAdmin && (
                          <>
                            <Tooltip title="Edit Hospital">
                              <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenEdit(hospital); }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Hospital">
                              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleOpenDeleteConfirm(hospital); }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {hospital.description || 'Full-service medical center with emergency care and specialist departments.'}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid size={{ xs: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOnIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {hospital.address}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {hospital.phone || '24/7 Helpline'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <HotelIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            Beds: <strong>{hospital.available_beds || 0}</strong> / {hospital.bed_count || 0} available
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        {hospital.emergency_available ? (
                          <Chip label="24/7 Emergency" color="error" size="small" sx={{ fontWeight: 700 }} />
                        ) : (
                          <Chip label="Standard Hours" color="default" size="small" />
                        )}
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Rating value={hospital.average_rating || 4.5} precision={0.5} readOnly size="small" />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {hospital.average_rating || 4.5} ({hospital.doctors_count || 12} Doctors)
                      </Typography>
                    </Box>
                  </CardContent>

                  <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 2 }}>
                    <Button fullWidth variant="contained" component={Link} to={`/hospitals/${hospital.id}`} sx={{ borderRadius: 2 }}>
                      Hospital Details
                    </Button>
                    <Button fullWidth variant="outlined" component={Link} to={`/doctors?hospital=${hospital.id}`} sx={{ borderRadius: 2 }}>
                      Find Doctors
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
            </Grid>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {hospitalsData.results.map((hospital) => (
                <Card key={hospital.id} sx={{ borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4 } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocalHospitalIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {hospital.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        {hospital.is_verified && <Chip icon={<VerifiedIcon />} label="Verified" color="success" size="small" />}
                        {isAdmin && (
                          <>
                            <Tooltip title="Edit Hospital">
                              <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenEdit(hospital); }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Hospital">
                              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleOpenDeleteConfirm(hospital); }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {hospital.description || 'Full-service medical center with emergency care and specialist departments.'}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid size={{ xs: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOnIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {hospital.address}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {hospital.phone || '24/7 Helpline'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <HotelIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            Beds: <strong>{hospital.available_beds || 0}</strong> / {hospital.bed_count || 0} available
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        {hospital.emergency_available ? (
                          <Chip label="24/7 Emergency" color="error" size="small" sx={{ fontWeight: 700 }} />
                        ) : (
                          <Chip label="Standard Hours" color="default" size="small" />
                        )}
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Rating value={hospital.average_rating || 4.5} precision={0.5} readOnly size="small" />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {hospital.average_rating || 4.5} ({hospital.doctors_count || 12} Doctors)
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 2, mt: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Button variant="contained" component={Link} to={`/hospitals/${hospital.id}`} sx={{ borderRadius: 2 }}>
                        Hospital Details
                      </Button>
                      <Button variant="outlined" component={Link} to={`/doctors?hospital=${hospital.id}`} sx={{ borderRadius: 2 }}>
                        Find Doctors
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )
        )}

        <AdminAddEntityModal open={openAddModal} onClose={() => setOpenAddModal(false)} initialTab={1} />

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} fullWidth maxWidth="md" sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
          <form onSubmit={handleSubmit}>
            <DialogTitle sx={{ fontWeight: 700 }}>Edit Hospital Information</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3} sx={{ mt: 1 }}>
                {formError && <Alert severity="error">{formError}</Alert>}
                <TextField variant="outlined" label="Hospital Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
                <TextField variant="outlined" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={3} fullWidth />
                <TextField variant="outlined" label="Address" value={address} onChange={(e) => setAddress(e.target.value)} multiline rows={2} fullWidth required slotProps={{ input: { startAdornment: <LocationOnIcon sx={{ color: 'text.secondary', mr: 1, mt: 1, alignSelf: 'flex-start' }} /> } }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField variant="outlined" label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth slotProps={{ input: { startAdornment: <PhoneIcon sx={{ color: 'text.secondary', mr: 1 }} /> } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField variant="outlined" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth slotProps={{ input: { startAdornment: <EmailIcon sx={{ color: 'text.secondary', mr: 1 }} /> } }} />
                  </Grid>
                </Grid>
                <TextField variant="outlined" label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} fullWidth placeholder="https://example.com" />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField variant="outlined" label="Total Bed Count" type="number" value={bedCount} onChange={(e) => setBedCount(e.target.value)} fullWidth />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField variant="outlined" label="Available Beds" type="number" value={availableBeds} onChange={(e) => setAvailableBeds(e.target.value)} fullWidth />
                  </Grid>
                </Grid>
                {isAdmin && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>24/7 Emergency</InputLabel>
                        <Select value={emergencyAvailable ? 'yes' : 'no'} label="24/7 Emergency" onChange={(e) => setEmergencyAvailable(e.target.value === 'yes')}>
                          <MenuItem value="yes">Yes - Available</MenuItem>
                          <MenuItem value="no">No - Standard Hours</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Verified</InputLabel>
                        <Select value={isVerified ? 'yes' : 'no'} label="Verified" onChange={(e) => setIsVerified(e.target.value === 'yes')}>
                          <MenuItem value="yes">Yes - Verified</MenuItem>
                          <MenuItem value="no">No - Not Verified</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                )}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={handleCloseEditDialog} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary" sx={{ px: 3, fontWeight: 600, borderRadius: 2 }} disabled={updateMutation.isPending}>Save Changes</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete <strong>{hospitalToDelete?.name}</strong>? This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button onClick={handleConfirmDelete} variant="contained" color="error" sx={{ px: 3, fontWeight: 600, borderRadius: 2 }} disabled={deleteMutation.isPending}>Delete</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}
