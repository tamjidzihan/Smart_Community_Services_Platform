import { useState } from 'react'
import {
  Container, Typography, Box, Grid, Card, CardContent, TextField, Button, MenuItem,
  Chip, Rating, CircularProgress, Alert, Paper, InputAdornment, Divider
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhoneIcon from '@mui/icons-material/Phone'
import HotelIcon from '@mui/icons-material/Hotel'
import VerifiedIcon from '@mui/icons-material/Verified'
import AddIcon from '@mui/icons-material/Add'
import { useQuery } from '@tanstack/react-query'
import { healthcareApi } from '../api/services'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import AdminAddEntityModal from '../components/admin/AdminAddEntityModal'

export default function HospitalsPage() {
  const [search, setSearch] = useState('')
  const [emergencyOnly, setEmergencyOnly] = useState('')
  const [openAddModal, setOpenAddModal] = useState(false)

  const { isAuthenticated, hasRole } = useAuthStore()
  const canAdd = isAuthenticated && (hasRole('admin') || hasRole('moderator'))

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
                      {hospital.is_verified && <Chip icon={<VerifiedIcon />} label="Verified" color="success" size="small" />}
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
        )}

        <AdminAddEntityModal open={openAddModal} onClose={() => setOpenAddModal(false)} initialTab={1} />
      </Container>
    </Box>
  )
}
