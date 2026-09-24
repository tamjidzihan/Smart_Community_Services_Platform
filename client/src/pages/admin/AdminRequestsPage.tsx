import { useState } from 'react'
import {
  Box, Container, Typography, Tabs, Tab, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Alert, Pagination, TextField, Select,
  MenuItem, FormControl, InputLabel, Stack, Tooltip,
  InputAdornment, Badge, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton,
} from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import EmergencyShareIcon from '@mui/icons-material/EmergencyShare'
import BloodtypeIcon from '@mui/icons-material/Bloodtype'
import SearchIcon from '@mui/icons-material/Search'
import PersonIcon from '@mui/icons-material/Person'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import EditIcon from '@mui/icons-material/Edit'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { adminApi } from '../../api/services'
import type { Appointment, EmergencyRequest, BloodRequest } from '../../types'




// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function fmtDateShort(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Status config maps ───────────────────────────────────────────────────────
const APPT_STATUS: Record<string, { color: 'default' | 'info' | 'success' | 'error' | 'warning'; label: string }> = {
  scheduled: { color: 'info', label: 'Scheduled' },
  confirmed: { color: 'success', label: 'Confirmed' },
  completed: { color: 'success', label: 'Completed' },
  cancelled: { color: 'error', label: 'Cancelled' },
  no_show: { color: 'warning', label: 'No Show' },
}

const EMERGENCY_STATUS: Record<string, { color: 'default' | 'info' | 'success' | 'error' | 'warning'; dot: string }> = {
  pending:      { color: 'warning', dot: '#F59E0B' },
  dispatched:   { color: 'info',    dot: '#3B82F6' },
  en_route:     { color: 'info',    dot: '#6366F1' },
  arrived:      { color: 'success', dot: '#10B981' },
  resolved:     { color: 'success', dot: '#059669' },
  cancelled:    { color: 'error',   dot: '#EF4444' },
  no_resource:  { color: 'error',   dot: '#DC2626' },
}

const BLOOD_STATUS: Record<string, { color: 'default' | 'info' | 'success' | 'error' | 'warning' }> = {
  open:                { color: 'warning' },
  partially_fulfilled: { color: 'info' },
  fulfilled:           { color: 'success' },
  cancelled:           { color: 'error' },
}

const URGENCY: Record<string, { color: 'default' | 'info' | 'success' | 'error' | 'warning' }> = {
  low:      { color: 'default' },
  medium:   { color: 'info' },
  high:     { color: 'warning' },
  critical: { color: 'error' },
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
        <Box sx={{ color: 'text.disabled', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Box sx={{ fontSize: 56, opacity: 0.25 }}>{icon}</Box>
          <Typography variant="body2" color="text.secondary">{message}</Typography>
        </Box>
      </TableCell>
    </TableRow>
  )
}

// ─── Loading Row ─────────────────────────────────────────────────────────────
function LoadingRow() {
  return (
    <TableRow>
      <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
        <CircularProgress size={36} />
      </TableCell>
    </TableRow>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// APPOINTMENTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function AppointmentsTab() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Edit dialog state
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-appointments', status, page],
    queryFn: () => adminApi.listAppointments({ status: status || undefined, page }),
    placeholderData: keepPreviousData,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status?: string; notes?: string } }) =>
      adminApi.updateAppointmentStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-appointments-count'] })
      setSelectedAppt(null)
    },
  })

  const appts = data?.data?.results ?? []
  const totalPages = data?.data?.total_pages ?? 1
  const totalCount = data?.data?.count ?? 0

  // Client-side search on name/doctor/hospital
  const filtered = search
    ? appts.filter((a: any) =>
        [a.citizen_name, a.doctor_name, a.hospital_name, a.reason]
          .some((f) => f?.toLowerCase().includes(search.toLowerCase()))
      )
    : appts

  const handleOpenEdit = (appt: Appointment) => {
    setSelectedAppt(appt)
    setEditStatus(appt.status)
    setEditNotes(appt.notes || '')
  }

  const handleSave = () => {
    if (selectedAppt) {
      updateMutation.mutate({
        id: selectedAppt.id,
        payload: { status: editStatus, notes: editNotes },
      })
    }
  }

  return (
    <Box>
      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          variant="outlined"
          placeholder="Search citizen, doctor, hospital…"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, maxWidth: 380, bgcolor: 'white', borderRadius: 2 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment> } }}
        />
        <FormControl size="small" sx={{ minWidth: 180, bgcolor: 'white' }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <MenuItem value="">All Statuses</MenuItem>
            {Object.entries(APPT_STATUS).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load appointments.</Alert>}

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            {totalCount} total appointments
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Citizen</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Doctor</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Hospital</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Scheduled At</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Booked On</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? <LoadingRow /> : filtered.length === 0
                ? <EmptyState icon={<LocalHospitalIcon sx={{ fontSize: 'inherit' }} />} message="No appointments found" />
                : filtered.map((a: any) => {
                  const s = APPT_STATUS[a.status] ?? { color: 'default', label: a.status }
                  return (
                    <TableRow key={a.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: 13, bgcolor: '#1A56DB22', color: '#1A56DB' }}>
                            {(a.citizen_name || '?').charAt(0)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.citizen_name || '—'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">Dr. {a.doctor_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{a.doctor_specialization}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{a.hospital_name || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption">{fmtDate(a.scheduled_at)}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 160 }}>
                        <Tooltip title={a.reason || ''} placement="top">
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 150 }}>
                            {a.reason || '—'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip label={s.label} color={s.color} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{fmtDateShort(a.created_at)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(a)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </TableContainer>
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" />
          </Box>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={selectedAppt !== null} onClose={() => setSelectedAppt(null)} fullWidth maxWidth="sm" sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Process Appointment</DialogTitle>
        <DialogContent dividers>
          {selectedAppt && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">CITIZEN</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedAppt.citizen_name || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">DOCTOR & HOSPITAL</Typography>
                <Typography variant="body2">Dr. {selectedAppt.doctor_name} ({selectedAppt.doctor_specialization})</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{selectedAppt.hospital_name}</Typography>
              </Box>

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={editStatus} label="Status" onChange={(e) => setEditStatus(e.target.value)}>
                  {Object.entries(APPT_STATUS).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Admin/Doctor Notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                multiline
                rows={3}
                fullWidth
                placeholder="Enter notes about consultation fee, scheduling changes, etc."
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setSelectedAppt(null)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary" sx={{ px: 3, borderRadius: 2, fontWeight: 600 }} disabled={updateMutation.isPending}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMERGENCY REQUESTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function EmergencyRequestsTab() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Edit dialog state
  const [selectedEmerg, setSelectedEmerg] = useState<EmergencyRequest | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editAmb, setEditAmb] = useState('')
  const [editEta, setEditEta] = useState<number | ''>('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-emergency', status, page],
    queryFn: () => adminApi.listEmergencyRequests({ status: status || undefined, page }),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000, // live updates every 30s
  })

  // Fetch ambulances for assignment
  const { data: ambData } = useQuery({
    queryKey: ['admin-ambulances-list'],
    queryFn: () => adminApi.listAmbulances(),
  })
  const ambulances = ambData?.data?.results ?? []

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status?: string; assigned_ambulance?: string; estimated_arrival_minutes?: number } }) =>
      adminApi.updateEmergencyStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-emergency'] })
      queryClient.invalidateQueries({ queryKey: ['admin-emergency-count'] })
      setSelectedEmerg(null)
    },
  })

  const emergencies = data?.data?.results ?? []
  const totalPages = data?.data?.total_pages ?? 1
  const totalCount = data?.data?.count ?? 0

  const filtered = search
    ? emergencies.filter((e: any) =>
        [e.citizen_name, e.citizen_phone, e.pickup_address, e.request_type]
          .some((f) => f?.toLowerCase().includes(search.toLowerCase()))
      )
    : emergencies

  const handleOpenEdit = (emerg: EmergencyRequest) => {
    setSelectedEmerg(emerg)
    setEditStatus(emerg.status)
    setEditAmb((emerg.ambulance as any)?.id || '')
    setEditEta(emerg.estimated_arrival_minutes ?? '')
  }

  const handleSave = () => {
    if (selectedEmerg) {
      updateMutation.mutate({
        id: selectedEmerg.id,
        payload: {
          status: editStatus,
          assigned_ambulance: editAmb || undefined,
          estimated_arrival_minutes: editEta !== '' ? Number(editEta) : undefined,
        },
      })
    }
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          variant="outlined"
          placeholder="Search citizen, address, type…"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, maxWidth: 380, bgcolor: 'white', borderRadius: 2 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment> } }}
        />
        <FormControl size="small" sx={{ minWidth: 180, bgcolor: 'white' }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <MenuItem value="">All Statuses</MenuItem>
            {Object.keys(EMERGENCY_STATUS).map((k) => (
              <MenuItem key={k} value={k}>{k.replace('_', ' ').toUpperCase()}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load emergency requests.</Alert>}

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">{totalCount} total emergency requests</Typography>
          <Typography variant="caption" color="text.secondary">Auto-refreshes every 30s</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Citizen</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Condition</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Pickup Address</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ambulance</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ETA</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Requested</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? <LoadingRow /> : filtered.length === 0
                ? <EmptyState icon={<EmergencyShareIcon sx={{ fontSize: 'inherit' }} />} message="No emergency requests found" />
                : filtered.map((e: any) => {
                  const s = EMERGENCY_STATUS[e.status] ?? { color: 'default', dot: '#9CA3AF' }
                  return (
                    <TableRow key={e.id} hover sx={{ bgcolor: e.status === 'pending' ? '#FEF3C720' : undefined }}>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          #{String(e.id).slice(0, 8)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#E0242420', color: '#E02424' }}>
                            {(e.citizen_name || '?').charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.citizen_name || '—'}</Typography>
                            <Typography variant="caption" color="text.secondary">{e.citizen_phone || ''}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={e.request_type?.toUpperCase()} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 140 }}>
                        <Tooltip title={e.patient_condition || ''}>
                          <Typography variant="caption" noWrap sx={{ display: 'block', maxWidth: 130 }} color="text.secondary">
                            {e.patient_condition || '—'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 160 }}>
                        <Tooltip title={e.pickup_address || ''}>
                          <Typography variant="caption" noWrap sx={{ display: 'block', maxWidth: 150 }} color="text.secondary">
                            {e.pickup_address || '—'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {e.ambulance ? (
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {(e.ambulance as any).registration_number}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {(e.ambulance as any).ambulance_type}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.disabled">Unassigned</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {e.estimated_arrival_minutes != null
                          ? <Chip label={`~${e.estimated_arrival_minutes} min`} size="small" color="info" variant="outlined" />
                          : <Typography variant="caption" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FiberManualRecordIcon sx={{ fontSize: 10, color: s.dot }} />
                          <Chip label={e.status.replace('_', ' ').toUpperCase()} color={s.color} size="small" />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{fmtDate(e.created_at)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(e)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </TableContainer>
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" />
          </Box>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={selectedEmerg !== null} onClose={() => setSelectedEmerg(null)} fullWidth maxWidth="sm" sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Process Emergency Dispatch</DialogTitle>
        <DialogContent dividers>
          {selectedEmerg && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">CITIZEN & PHONE</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedEmerg.citizen_name || '—'}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedEmerg.citizen_phone || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">PICKUP ADDRESS & CONDITION</Typography>
                <Typography variant="body2">{selectedEmerg.pickup_address || '—'}</Typography>
                <Typography variant="caption" color="error" sx={{ display: 'block' }}>{selectedEmerg.patient_condition}</Typography>
              </Box>


              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={editStatus} label="Status" onChange={(e) => setEditStatus(e.target.value)}>
                  {Object.keys(EMERGENCY_STATUS).map((k) => (
                    <MenuItem key={k} value={k}>{k.replace('_', ' ').toUpperCase()}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Assign Ambulance</InputLabel>
                <Select value={editAmb} label="Assign Ambulance" onChange={(e) => setEditAmb(e.target.value)}>
                  <MenuItem value="">Unassigned</MenuItem>
                  {ambulances.map((amb: any) => (
                    <MenuItem key={amb.id} value={amb.id}>
                      {amb.registration_number} ({amb.ambulance_type} - {amb.status})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Estimated Arrival Minutes (ETA)"
                type="number"
                value={editEta}
                onChange={(e) => setEditEta(e.target.value === '' ? '' : Number(e.target.value))}
                fullWidth
                placeholder="e.g. 15"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setSelectedEmerg(null)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="error" sx={{ px: 3, borderRadius: 2, fontWeight: 600 }} disabled={updateMutation.isPending}>
            Update Dispatch
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOOD REQUESTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function BloodRequestsTab() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [urgency, setUrgency] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [page, setPage] = useState(1)

  // Edit dialog state
  const [selectedBlood, setSelectedBlood] = useState<BloodRequest | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editUnits, setEditUnits] = useState<number>(0)
  const [editNotes, setEditNotes] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-blood-requests', status, urgency, bloodGroup, page],
    queryFn: () => adminApi.listBloodRequests({
      status: status || undefined,
      urgency: urgency || undefined,
      blood_group: bloodGroup || undefined,
      page,
    }),
    placeholderData: keepPreviousData,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status?: string; units_fulfilled?: number; notes?: string } }) =>
      adminApi.updateBloodRequestStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blood-requests'] })
      queryClient.invalidateQueries({ queryKey: ['admin-blood-count'] })
      setSelectedBlood(null)
    },
  })

  const requests = data?.data?.results ?? []
  const totalPages = data?.data?.total_pages ?? 1
  const totalCount = data?.data?.count ?? 0

  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

  const handleOpenEdit = (blood: BloodRequest) => {
    setSelectedBlood(blood)
    setEditStatus(blood.status)
    setEditUnits(blood.units_fulfilled)
    setEditNotes(blood.notes || '')
  }

  const handleSave = () => {
    if (selectedBlood) {
      updateMutation.mutate({
        id: selectedBlood.id,
        payload: {
          status: editStatus,
          units_fulfilled: editUnits,
          notes: editNotes,
        },
      })
    }
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 160, bgcolor: 'white' }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <MenuItem value="">All Statuses</MenuItem>
            {Object.keys(BLOOD_STATUS).map((k) => (
              <MenuItem key={k} value={k}>{k.replace('_', ' ')}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160, bgcolor: 'white' }}>
          <InputLabel>Urgency</InputLabel>
          <Select value={urgency} label="Urgency" onChange={(e) => { setUrgency(e.target.value); setPage(1) }}>
            <MenuItem value="">All Urgencies</MenuItem>
            {Object.keys(URGENCY).map((k) => (
              <MenuItem key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140, bgcolor: 'white' }}>
          <InputLabel>Blood Group</InputLabel>
          <Select value={bloodGroup} label="Blood Group" onChange={(e) => { setBloodGroup(e.target.value); setPage(1) }}>
            <MenuItem value="">All Groups</MenuItem>
            {BLOOD_GROUPS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load blood requests.</Alert>}

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">{totalCount} total blood requests</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Requester</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Blood Group</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Units</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Hospital</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Urgency</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Requested</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Resolved</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? <LoadingRow /> : requests.length === 0
                ? <EmptyState icon={<BloodtypeIcon sx={{ fontSize: 'inherit' }} />} message="No blood requests found" />
                : requests.map((r: any) => {
                  const bs = BLOOD_STATUS[r.status] ?? { color: 'default' }
                  const urg = URGENCY[r.urgency] ?? { color: 'default' }
                  const filled = r.units_fulfilled >= r.units_needed
                  return (
                    <TableRow key={r.id} hover sx={{ bgcolor: r.urgency === 'critical' ? '#FEF2F220' : undefined }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#7C3AED20', color: '#7C3AED' }}>
                            <PersonIcon sx={{ fontSize: 16 }} />
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.requester_name || '—'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{r.patient_name || '—'}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={r.blood_group}
                          size="small"
                          sx={{
                            fontWeight: 800, fontSize: 13,
                            bgcolor: '#E0242420', color: '#E02424',
                            border: '1px solid #E0242440',
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: filled ? 'success.main' : 'text.primary' }}>
                            {r.units_fulfilled} / {r.units_needed}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">units</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{r.hospital_name || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={r.urgency.toUpperCase()} color={urg.color} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={r.status.replace('_', ' ')} color={bs.color} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{fmtDateShort(r.created_at)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{fmtDateShort(r.resolved_at)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(r)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </TableContainer>
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" />
          </Box>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={selectedBlood !== null} onClose={() => setSelectedBlood(null)} fullWidth maxWidth="sm" sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Process Blood Request</DialogTitle>
        <DialogContent dividers>
          {selectedBlood && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">PATIENT & BLOOD GROUP</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedBlood.patient_name || '—'}</Typography>
                <Typography variant="body2" color="error" sx={{ fontWeight: 700 }}>Group: {selectedBlood.blood_group}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">HOSPITAL & URGENCY</Typography>
                <Typography variant="body2">{selectedBlood.hospital_name || '—'}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Urgency: {selectedBlood.urgency.toUpperCase()}</Typography>
              </Box>

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={editStatus} label="Status" onChange={(e) => setEditStatus(e.target.value)}>
                  {Object.keys(BLOOD_STATUS).map((k) => (
                    <MenuItem key={k} value={k}>{k.replace('_', ' ')}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                variant="outlined"
                label="Units Fulfilled"
                type="number"
                value={editUnits}
                onChange={(e) => setEditUnits(Number(e.target.value))}
                fullWidth
                slotProps={{ htmlInput: { min: 0, max: selectedBlood.units_needed } }}
                helperText={`Needed: ${selectedBlood.units_needed} units`}
              />


              <TextField
                label="Notes / Comments"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                multiline
                rows={3}
                fullWidth
                placeholder="Enter donation dates, details about donor dispatch, etc."
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setSelectedBlood(null)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="secondary" sx={{ px: 3, borderRadius: 2, fontWeight: 600 }} disabled={updateMutation.isPending}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

// Summary badges (fetched once for tab header counts)
function useTabCounts() {
  const { data: appts } = useQuery({
    queryKey: ['admin-appointments-count'],
    queryFn: () => adminApi.listAppointments({ page: 1 }),
    staleTime: 60_000,
  })
  const { data: emergency } = useQuery({
    queryKey: ['admin-emergency-count'],
    queryFn: () => adminApi.listEmergencyRequests({ page: 1 }),
    staleTime: 30_000,
  })
  const { data: blood } = useQuery({
    queryKey: ['admin-blood-count'],
    queryFn: () => adminApi.listBloodRequests({ page: 1 }),
    staleTime: 60_000,
  })
  return {
    appts: (appts?.data as any)?.count ?? 0,
    emergency: (emergency?.data as any)?.count ?? 0,
    blood: (blood?.data as any)?.count ?? 0,
  }
}

export default function AdminRequestsPage() {
  const [tab, setTab] = useState(0)
  const counts = useTabCounts()

  return (
    <Box sx={{ minHeight: '100vh', py: 5, bgcolor: 'grey.50' }}>
      <Container maxWidth="xl">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 4 }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: 2.5, flexShrink: 0,
            background: 'linear-gradient(135deg, #1A56DB 0%, #7C3AED 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AssignmentIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Appointments & Requests
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage all medical appointments, emergency dispatches, and blood requests across the platform
            </Typography>
          </Box>
        </Box>

        {/* ── Summary Strip ────────────────────────────────────────────── */}
        <Stack direction="row" spacing={2} sx={{ mb: 4, flexWrap: 'wrap', gap: 2 }}>
          {[
            { icon: <LocalHospitalIcon />, label: 'Appointments', value: counts.appts, color: '#1A56DB', bg: '#EEF2FF' },
            { icon: <EmergencyShareIcon />, label: 'Emergencies', value: counts.emergency, color: '#E02424', bg: '#FEF2F2' },
            { icon: <BloodtypeIcon />, label: 'Blood Requests', value: counts.blood, color: '#7C3AED', bg: '#F5F3FF' },
          ].map((item) => (
            <Paper key={item.label} elevation={0} sx={{
              flex: 1, minWidth: 160, borderRadius: 3, px: 3, py: 2,
              border: '1px solid', borderColor: 'divider',
              display: 'flex', alignItems: 'center', gap: 2,
              background: `linear-gradient(135deg, white 60%, ${item.bg})`,
            }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: 2, bgcolor: item.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color,
              }}>
                {item.icon}
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: item.color }}>{item.value}</Typography>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
              </Box>
            </Paper>
          ))}
        </Stack>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white', px: 2 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: 14, minHeight: 56 },
                '& .Mui-selected': { color: 'primary.main' },
              }}
            >
              <Tab
                icon={<Badge badgeContent={counts.appts} color="primary" max={999} sx={{ '& .MuiBadge-badge': { fontSize: 10 } }}><LocalHospitalIcon sx={{ fontSize: 18 }} /></Badge>}
                iconPosition="start"
                label="Appointments"
              />
              <Tab
                icon={<Badge badgeContent={counts.emergency} color="error" max={999} sx={{ '& .MuiBadge-badge': { fontSize: 10 } }}><EmergencyShareIcon sx={{ fontSize: 18 }} /></Badge>}
                iconPosition="start"
                label="Emergency Requests"
              />
              <Tab
                icon={<Badge badgeContent={counts.blood} color="secondary" max={999} sx={{ '& .MuiBadge-badge': { fontSize: 10 } }}><BloodtypeIcon sx={{ fontSize: 18 }} /></Badge>}
                iconPosition="start"
                label="Blood Requests"
              />
            </Tabs>
          </Box>

          <Box sx={{ p: 3, bgcolor: 'grey.50' }}>
            {tab === 0 && <AppointmentsTab />}
            {tab === 1 && <EmergencyRequestsTab />}
            {tab === 2 && <BloodRequestsTab />}
          </Box>
        </Paper>

      </Container>
    </Box>
  )
}
