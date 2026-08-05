import { useParams, Link } from 'react-router-dom'
import {
  Container, Typography, Box, Paper, CircularProgress, Alert, Chip, Button, Divider, Grid
} from '@mui/material'
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useQuery } from '@tanstack/react-query'
import { ambulanceApi } from '../api/services'

export default function EmergencyTrackPage() {
  const { id } = useParams<{ id: string }>()

  const { data: emergency, isLoading, error } = useQuery({
    queryKey: ['emergency-track', id],
    queryFn: async () => {
      if (!id) throw new Error('No emergency ID')
      const res = await ambulanceApi.getEmergency(id)
      return res.data
    },
    refetchInterval: 5000, // Live polling every 5s
  })

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress size={48} color="error" />
      </Box>
    )
  }

  if (error || !emergency) {
    return (
      <Container sx={{ py: 6 }}>
        <Alert severity="error">Emergency tracking record not found.</Alert>
        <Button startIcon={<ArrowBackIcon />} component={Link} to="/emergency" sx={{ mt: 2 }}>
          Back to Emergency Dispatch
        </Button>
      </Container>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 6, bgcolor: 'grey.50' }}>
      <Container maxWidth="md">
        <Button startIcon={<ArrowBackIcon />} component={Link} to="/emergency" sx={{ mb: 3 }}>
          Back to Emergency Portal
        </Button>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AirportShuttleIcon color="error" sx={{ fontSize: 36 }} />
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Live Dispatch Tracking
              </Typography>
            </Box>
            <Chip
              label={emergency.status.toUpperCase()}
              color={emergency.status === 'dispatched' || emergency.status === 'en_route' ? 'error' : 'success'}
              sx={{ fontWeight: 800, px: 1 }}
            />
          </Box>

          <Divider sx={{ mb: 4 }} />

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 2.5, bgcolor: 'error.50', borderRadius: 3 }}>
                <Typography variant="caption" color="text.secondary">Estimated Time of Arrival</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: 'error.dark', my: 0.5 }}>
                  {emergency.estimated_arrival_minutes ? `${emergency.estimated_arrival_minutes} Mins` : 'Calculating...'}
                </Typography>
                <Typography variant="caption" color="text.secondary">Live updates refreshed automatically</Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 2.5, bgcolor: 'grey.100', borderRadius: 3 }}>
                <Typography variant="caption" color="text.secondary">Assigned Ambulance Unit</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {emergency.ambulance?.registration_number || 'Unit Dispatched'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Driver: {emergency.ambulance?.driver_name || 'Emergency Responder'}
                </Typography>
                {emergency.ambulance?.driver_phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <PhoneIcon fontSize="small" color="primary" />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {emergency.ambulance.driver_phone}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">Pickup Location</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <LocationOnIcon color="action" />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{emergency.pickup_address}</Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">Patient Condition / Urgency</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{emergency.patient_condition}</Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}
