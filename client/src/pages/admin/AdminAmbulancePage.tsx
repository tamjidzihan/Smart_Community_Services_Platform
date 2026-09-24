import { useState } from 'react'
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Alert, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem,
  FormControl, InputLabel, Stack, IconButton, Card, CardContent, Grid,
} from '@mui/material'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PhoneIcon from '@mui/icons-material/Phone'
import PersonIcon from '@mui/icons-material/Person'
import BadgeIcon from '@mui/icons-material/Badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/services'
import type { Ambulance } from '../../types'


const AMBULANCE_TYPES = [
  { value: 'basic', label: 'Basic Life Support' },
  { value: 'advanced', label: 'Advanced Life Support' },
  { value: 'neonatal', label: 'Neonatal' },
  { value: 'air', label: 'Air Ambulance' },
]

const STATUS_CHOICES = [
  { value: 'available', label: 'Available', color: 'success' },
  { value: 'en_route', label: 'En Route', color: 'info' },
  { value: 'at_scene', label: 'At Scene', color: 'info' },
  { value: 'transporting', label: 'Transporting', color: 'warning' },
  { value: 'unavailable', label: 'Unavailable', color: 'error' },
] as const

export default function AdminAmbulancePage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAmbulance, setEditingAmbulance] = useState<Ambulance | null>(null)

  // Form states
  const [regNum, setRegNum] = useState('')
  const [type, setType] = useState('basic')
  const [driverName, setDriverName] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [status, setStatus] = useState('available')
  const [formError, setFormError] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-ambulances'],
    queryFn: () => adminApi.listAmbulances(),
  })

  const ambulances = data?.data?.results ?? []

  // Mutations
  const createMutation = useMutation({
    mutationFn: adminApi.createAmbulance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ambulances'] })
      handleCloseDialog()
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.registration_number?.[0] || err.message || 'Failed to create ambulance')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateAmbulance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ambulances'] })
      handleCloseDialog()
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update ambulance')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteAmbulance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ambulances'] })
    },
  })

  const handleOpenAdd = () => {
    setEditingAmbulance(null)
    setRegNum('')
    setType('basic')
    setDriverName('')
    setDriverPhone('')
    setStatus('available')
    setFormError('')
    setDialogOpen(true)
  }

  const handleOpenEdit = (amb: Ambulance) => {
    setEditingAmbulance(amb)
    setRegNum(amb.registration_number)
    setType(amb.ambulance_type)
    setDriverName(amb.driver_name || '')
    setDriverPhone(amb.driver_phone || '')
    setStatus(amb.status)
    setFormError('')
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingAmbulance(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!regNum || !driverName || !driverPhone) {
      setFormError('Please fill in all required fields')
      return
    }

    const payload = {
      registration_number: regNum,
      ambulance_type: type,
      driver_name: driverName,
      driver_phone: driverPhone,
      status,
    }

    if (editingAmbulance) {
      updateMutation.mutate({ id: editingAmbulance.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this ambulance?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 5, bgcolor: 'grey.50' }}>
      <Container maxWidth="xl">
        {/* Page Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 52, height: 52, borderRadius: 2.5,
              background: 'linear-gradient(135deg, #0E9F6E 0%, #057A55 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LocalShippingIcon sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                Ambulance Fleet Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add, update, and manage all active ambulances and emergency vehicles
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{ borderRadius: 2.5, px: 3, py: 1.2, fontWeight: 600, textTransform: 'none' }}
          >
            Add Ambulance
          </Button>
        </Box>

        {/* Stats Strip */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ py: 2.5, px: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Fleet Size
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5, color: '#111928' }}>
                  {ambulances.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ py: 2.5, px: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Available Right Now
                </Typography>
                <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 800, color: 'success.main' }}>
                  {ambulances.filter((a: any) => a.status === 'available').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ py: 2.5, px: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Active Dispatches
                </Typography>
                <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 800, color: 'info.main' }}>
                  {ambulances.filter((a: any) => ['en_route', 'at_scene', 'transporting'].includes(a.status)).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Fleet Table */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load ambulance fleet. Please try again.
          </Alert>
        ) : ambulances.length === 0 ? (
          <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <LocalShippingIcon sx={{ fontSize: 72, color: 'text.disabled', opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>No Ambulances Registered</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Get started by adding your first ambulance vehicle to the platform
            </Typography>
            <Button variant="outlined" color="success" onClick={handleOpenAdd}>
              Add Your First Ambulance
            </Button>
          </Paper>
        ) : (
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Registration Number</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Ambulance Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Driver Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Driver Phone</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ambulances.map((amb: any) => {
                    const matchedStatus = STATUS_CHOICES.find(s => s.value === amb.status)
                    const statusLabel = matchedStatus?.label || amb.status
                    const statusColor = matchedStatus?.color || 'default'

                    const matchedType = AMBULANCE_TYPES.find(t => t.value === amb.ambulance_type)
                    const typeLabel = matchedType?.label || amb.ambulance_type

                    return (
                      <TableRow key={amb.id} hover>
                        <TableCell sx={{ fontWeight: 600, color: 'grey.900' }}>
                          {amb.registration_number}
                        </TableCell>
                        <TableCell>
                          <Chip label={typeLabel} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">{amb.driver_name || '—'}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">{amb.driver_phone || '—'}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={statusLabel} color={statusColor} size="small" sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(amb)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDelete(amb.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm" sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
          <form onSubmit={handleSubmit}>
            <DialogTitle sx={{ fontWeight: 700 }}>
              {editingAmbulance ? 'Edit Ambulance Information' : 'Add New Ambulance'}
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3} sx={{ mt: 1 }}>
                {formError && <Alert severity="error">{formError}</Alert>}

                <TextField
                  variant="outlined"
                  label="Registration Number"
                  value={regNum}
                  onChange={(e) => setRegNum(e.target.value)}
                  placeholder="e.g. DHAKA-METRO-HA-1234"
                  fullWidth
                  required
                  slotProps={{ input: { startAdornment: <BadgeIcon sx={{ color: 'text.secondary', mr: 1 }} /> } }}
                />

                <FormControl fullWidth>
                  <InputLabel>Ambulance Type</InputLabel>
                  <Select
                    value={type}
                    label="Ambulance Type"
                    onChange={(e) => setType(e.target.value)}
                  >
                    {AMBULANCE_TYPES.map((t) => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  variant="outlined"
                  label="Driver Name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Driver full name"
                  fullWidth
                  required
                  slotProps={{ input: { startAdornment: <PersonIcon sx={{ color: 'text.secondary', mr: 1 }} /> } }}
                />

                <TextField
                  variant="outlined"
                  label="Driver Phone"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="Driver contact number"
                  fullWidth
                  required
                  slotProps={{ input: { startAdornment: <PhoneIcon sx={{ color: 'text.secondary', mr: 1 }} /> } }}
                />


                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={status}
                    label="Status"
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {STATUS_CHOICES.map((s) => (
                      <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={handleCloseDialog} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                color="success"
                sx={{ px: 3, fontWeight: 600, borderRadius: 2 }}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingAmbulance ? 'Save Changes' : 'Add Vehicle'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </Box>
  )
}
