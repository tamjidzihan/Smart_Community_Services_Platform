import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, CircularProgress, Alert
} from '@mui/material'
import EventNoteIcon from '@mui/icons-material/EventNote'
import CancelIcon from '@mui/icons-material/Cancel'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { healthcareApi } from '../api/services'

export default function AppointmentsPage() {
  const queryClient = useQueryClient()

  const { data: appointmentsData, isLoading, error } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: async () => {
      const res = await healthcareApi.getAppointments()
      return res.data
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => healthcareApi.cancelAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
    },
  })

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Chip label="Scheduled" color="primary" size="small" />
      case 'confirmed':
        return <Chip label="Confirmed" color="success" size="small" />
      case 'completed':
        return <Chip label="Completed" color="default" size="small" />
      case 'cancelled':
        return <Chip label="Cancelled" color="error" size="small" />
      default:
        return <Chip label={status} size="small" />
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 6, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <EventNoteIcon color="primary" sx={{ fontSize: 36 }} />
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            My Doctor Appointments
          </Typography>
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            Failed to load appointments. Please verify authentication.
          </Alert>
        )}

        {appointmentsData && (
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Doctor</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Hospital / Clinic</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appointmentsData.results.map((appt) => (
                    <TableRow key={appt.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{appt.doctor_name || 'Dr. Specialist'}</TableCell>
                      <TableCell>{appt.hospital_name || 'Medical Center'}</TableCell>
                      <TableCell>{new Date(appt.scheduled_at).toLocaleString()}</TableCell>
                      <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {appt.reason}
                      </TableCell>
                      <TableCell>{getStatusChip(appt.status)}</TableCell>
                      <TableCell align="right">
                        {appt.status === 'scheduled' && (
                          <Button
                            size="small"
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => cancelMutation.mutate(appt.id)}
                            disabled={cancelMutation.isPending}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {appointmentsData.results.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">You have no booked appointments.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Container>
    </Box>
  )
}
