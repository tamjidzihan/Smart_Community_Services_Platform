import { useState } from 'react'
import {
  Container, Typography, Box, Paper, TextField, Button, MenuItem, Grid, Alert
} from '@mui/material'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import { useMutation } from '@tanstack/react-query'
import { bloodApi } from '../api/services'
import { useNavigate } from 'react-router-dom'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function BloodRequestPage() {
  const navigate = useNavigate()
  const [bloodGroup, setBloodGroup] = useState('O+')
  const [unitsNeeded, setUnitsNeeded] = useState(1)
  const [hospitalName, setHospitalName] = useState('')
  const [patientName, setPatientName] = useState('')
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'critical'>('high')
  const [notes, setNotes] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const requestMutation = useMutation({
    mutationFn: (data: any) => bloodApi.createRequest(data),
    onSuccess: () => {
      alert('Emergency blood request posted successfully!')
      navigate('/blood-donors')
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to submit blood request.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    requestMutation.mutate({
      blood_group: bloodGroup,
      units_needed: unitsNeeded,
      hospital_name: hospitalName,
      patient_name: patientName,
      urgency,
      notes,
    })
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 6, bgcolor: 'grey.50' }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <WaterDropIcon color="error" sx={{ fontSize: 36 }} />
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Create Emergency Blood Request
            </Typography>
          </Box>

          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Broadcast your blood request to registered voluntary donors in your vicinity.
          </Typography>

          {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Blood Group Required"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  required
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <MenuItem key={bg} value={bg}>{bg}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Units (Bags) Needed"
                  value={unitsNeeded}
                  onChange={(e) => setUnitsNeeded(Number(e.target.value))}
                  slotProps={{ htmlInput: { min: 1, max: 10 } }}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Patient Name"
                  placeholder="Full name of patient"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Urgency Level"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  required
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High (Urgent)</MenuItem>
                  <MenuItem value="critical">Critical (Immediate)</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Hospital / Medical Facility Name & Address"
                  placeholder="e.g. Dhaka Medical College Hospital, Ward 4, Bed 12"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Additional Contact Information or Notes"
                  placeholder="Provide attendant phone number or specific medical instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="error"
                  size="large"
                  fullWidth
                  disabled={requestMutation.isPending}
                  sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                >
                  {requestMutation.isPending ? 'Broadcasting Request...' : 'Broadcast Emergency Blood Request'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
    </Box>
  )
}
