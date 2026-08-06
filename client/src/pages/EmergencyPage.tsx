import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Container, Box, Typography, Button, Grid, Card,
  FormControl, InputLabel, Select, MenuItem, TextField, Alert,
  CircularProgress, Chip,
} from '@mui/material'
import { Emergency } from '@mui/icons-material'
import { useGeolocation } from '../hooks'
import { ambulanceApi, healthcareApi } from '../api/services'
import { useQuery, useMutation } from '@tanstack/react-query'

const CONDITION_OPTIONS = [
  'Cardiac Arrest', 'Accident / Trauma', 'Breathing Difficulty',
  'Stroke', 'Unconscious Patient', 'Severe Bleeding', 'Other Emergency',
]

export default function EmergencyPage() {
  const navigate = useNavigate()
  const { location, loading: locLoading } = useGeolocation()
  const [condition, setCondition] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [step, setStep] = useState<'form' | 'dispatching' | 'dispatched'>('form')

  const { data: nearbyHospitals } = useQuery({
    queryKey: ['nearby-hospitals-emergency', location],
    queryFn: () => healthcareApi.getNearbyHospitals(location?.lat || 23.8103, location?.lng || 90.4125, 15, true),
  })

  const { data: nearbyAmbulances } = useQuery({
    queryKey: ['nearby-ambulances', location],
    queryFn: () => ambulanceApi.getNearbyAmbulances(location?.lat || 23.8103, location?.lng || 90.4125),
  })

  const requestMutation = useMutation({
    mutationFn: () => ambulanceApi.requestEmergency({
      request_type: 'ambulance',
      patient_condition: condition,
      pickup_address: address,
      pickup_latitude: location!.lat,
      pickup_longitude: location!.lng,
    }),
    onSuccess: (res) => {
      setStep('dispatched')
      setTimeout(() => navigate(`/emergency/${res.data.id}/track`), 1500)
    },
  })

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Box sx={{
            width: 80, height: 80, borderRadius: '50%', bgcolor: '#FEE2E2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2, position: 'relative',
          }}>
            <Emergency sx={{ fontSize: 40, color: '#E02424' }} />
            <Box sx={{
              position: 'absolute', inset: -8, borderRadius: '50%',
              border: '2px solid rgba(224,36,36,0.3)',
              animation: 'pulse-ring 1.5s ease-out infinite',
            }} />
          </Box>
        </motion.div>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#E02424' }}>Emergency Help</Typography>
        <Typography color="text.secondary">Request immediate assistance — ambulance will be dispatched automatically</Typography>
      </Box>

      {step === 'dispatched' ? (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
            <Typography variant="h6">🚑 Ambulance Dispatched!</Typography>
            <Typography>Redirecting to live tracking...</Typography>
          </Alert>
        </motion.div>
      ) : (
        <Grid container spacing={3}>
          {/* Request form */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Request Ambulance</Typography>

              {locLoading && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <CircularProgress size={16} sx={{ mr: 1 }} /> Getting your location...
                </Alert>
              )}

              {location && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  📍 Location captured: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </Alert>
              )}

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Patient Condition *</InputLabel>
                <Select value={condition} onChange={(e) => setCondition(e.target.value)} label="Patient Condition *">
                  {CONDITION_OPTIONS.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Pickup Address (optional)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter address if GPS is inaccurate"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Additional Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Floor number, landmarks, special instructions..."
                sx={{ mb: 3 }}
              />

              <Button
                fullWidth
                variant="contained"
                color="error"
                size="large"
                disabled={!location || !condition || requestMutation.isPending}
                onClick={() => {
                  setStep('dispatching')
                  requestMutation.mutate()
                }}
                startIcon={requestMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Emergency />}
                sx={{ py: 1.5, fontSize: 16, fontWeight: 700 }}
              >
                {requestMutation.isPending ? 'Dispatching...' : 'Request Ambulance Now'}
              </Button>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                Nearest available ambulance will be auto-dispatched
              </Typography>
            </Card>
          </Grid>

          {/* Nearby resources */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#1A56DB' }}>
                🏥 Nearby Emergency Hospitals ({nearbyHospitals?.data?.count || 0})
              </Typography>
              {nearbyHospitals?.data?.results?.slice(0, 3).map((h) => (
                <Box key={h.id} sx={{ py: 1, borderBottom: '1px solid #F3F4F6' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{h.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{h.distance_km} km away</Typography>
                </Box>
              ))}
              {!nearbyHospitals?.data?.results?.length && (
                <Typography variant="body2" color="text.secondary">Enable location to see nearby hospitals</Typography>
              )}
            </Card>

            <Card sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#E02424' }}>
                🚑 Available Ambulances ({nearbyAmbulances?.data?.count || 0})
              </Typography>
              {nearbyAmbulances?.data?.results?.slice(0, 3).map((a) => (
                <Box key={a.id} sx={{ py: 1, borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{a.registration_number}</Typography>
                    <Typography variant="caption" color="text.secondary">{a.driver_name}</Typography>
                  </Box>
                  <Chip label={`${a.distance_km} km`} size="small" color="error" variant="outlined" />
                </Box>
              ))}
              {!nearbyAmbulances?.data?.results?.length && (
                <Typography variant="body2" color="text.secondary">No available ambulances in range</Typography>
              )}
            </Card>

            {/* Emergency contacts */}
            <Card sx={{ p: 2, bgcolor: '#FFF7ED', border: '1px solid #FDE68A' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>📞 Emergency Hotlines</Typography>
              {[
                { label: 'National Emergency', number: '999' },
                { label: 'Fire Service', number: '199' },
                { label: 'Police', number: '100' },
                { label: 'Ambulance', number: '199' },
              ].map((c) => (
                <Box key={c.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="caption">{c.label}</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#E02424' }}>{c.number}</Typography>
                </Box>
              ))}
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  )
}
