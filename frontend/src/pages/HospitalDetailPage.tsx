import { useParams, Link } from 'react-router-dom'
import {
  Container, Typography, Box, Paper, Grid, Chip, Button, Rating, Divider, CircularProgress, Alert
} from '@mui/material'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhoneIcon from '@mui/icons-material/Phone'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useQuery } from '@tanstack/react-query'
import { healthcareApi } from '../api/services'

export default function HospitalDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: hospital, isLoading, error } = useQuery({
    queryKey: ['hospital', id],
    queryFn: async () => {
      if (!id) throw new Error('No hospital ID')
      const res = await healthcareApi.getHospital(id)
      return res.data
    },
  })

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress size={48} />
      </Box>
    )
  }

  if (error || !hospital) {
    return (
      <Container sx={{ py: 6 }}>
        <Alert severity="error">Hospital not found or error loading details.</Alert>
        <Button startIcon={<ArrowBackIcon />} component={Link} to="/hospitals" sx={{ mt: 2 }}>
          Back to Hospitals
        </Button>
      </Container>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 6, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Button startIcon={<ArrowBackIcon />} component={Link} to="/hospitals" sx={{ mb: 3 }}>
          Back to All Hospitals
        </Button>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 4 }}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <LocalHospitalIcon color="primary" sx={{ fontSize: 36 }} />
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  {hospital.name}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Chip label={hospital.category || 'General Hospital'} color="primary" variant="outlined" />
                {hospital.emergency_available && (
                  <Chip label="24/7 Emergency Care" color="error" sx={{ fontWeight: 700 }} />
                )}
              </Box>

              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 2 }}>
                {hospital.description || 'Full medical center providing multi-specialty care, inpatient treatment, and emergency services.'}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Total Capacity</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{hospital.bed_count || 100} Beds</Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Available ICU/Beds</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>{hospital.available_beds || 15} Available</Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Hospital Rating</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Rating value={hospital.average_rating || 4.5} precision={0.5} readOnly size="small" />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{hospital.average_rating || 4.5}</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Button
                variant="contained"
                size="large"
                component={Link}
                to={`/doctors?hospital=${hospital.id}`}
                sx={{ borderRadius: 2, px: 4 }}
              >
                View Doctors & Book Appointment
              </Button>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'primary.dark' }}>
                  Location & Contact
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                  <LocationOnIcon color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Address</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{hospital.address}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                  <PhoneIcon color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Helpline Phone</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{hospital.phone || '24/7 Hotline'}</Typography>
                  </Box>
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  component={Link}
                  to="/emergency"
                  sx={{ mt: 2, borderRadius: 2, fontWeight: 700 }}
                >
                  Dispatch Emergency Ambulance
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  )
}
