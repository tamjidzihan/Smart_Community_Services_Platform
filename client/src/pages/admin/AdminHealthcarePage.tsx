/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
  Tooltip,
  FormControlLabel,
  Checkbox,
  Grid,
} from '@mui/material'
import {
  MedicalServices,
  LocalHospital,
  Add,
  Search,
  Edit,
  Delete,
  Emergency,
  MyLocation,
  Close,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { doctorApi, hospitalApi, specialistApi } from '../../api/services'

export default function AdminHealthcarePage() {
  const queryClient = useQueryClient()
  const [tabIndex, setTabIndex] = useState(0)

  // ─── Doctor Search & Pagination State ──────────────────────────────
  const [doctorSearch, setDoctorSearch] = useState('')
  const [doctorPage, setDoctorPage] = useState(1)

  // ─── Hospital Search & Pagination State ────────────────────────────
  const [hospitalSearch, setHospitalSearch] = useState('')
  const [hospitalType, setHospitalType] = useState('')
  const [hospitalPage, setHospitalPage] = useState(1)

  // ─── Modals State ──────────────────────────────────────────────────
  const [openDoctorModal, setOpenDoctorModal] = useState(false)
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null)
  const [doctorForm, setDoctorForm] = useState({
    full_name: '',
    gender: 'male',
    mobile: '',
    email: '',
    degree_summary: '',
    current_position: '',
    consultation_fee: '1000',
    appointment_number: '',
    specialist_id: '',
    is_active: true,
    is_verified: true,
  })

  const [openHospitalModal, setOpenHospitalModal] = useState(false)
  const [editingHospitalId, setEditingHospitalId] = useState<string | null>(null)
  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    hospital_type: 'private',
    division: 'Dhaka',
    district: 'Dhaka',
    city: 'Dhaka',
    area: 'Dhanmondi',
    address: '',
    phone: '',
    emergency_phone: '',
    bed_count: 100,
    available_beds: 15,
    emergency_available: true,
    open_24_hours: true,
    ambulance_available: true,
    latitude: 23.8103,
    longitude: 90.4125,
    status: 'active',
  })

  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  // ─── Queries ───────────────────────────────────────────────────────
  const { data: doctorsData, isLoading: loadingDoctors } = useQuery({
    queryKey: ['admin-doctors', doctorSearch, doctorPage],
    queryFn: async () => {
      const res = await doctorApi.getDoctors({
        search: doctorSearch || undefined,
        page: doctorPage,
        page_size: 15,
      })
      return res.data
    },
  })

  const { data: hospitalsData, isLoading: loadingHospitals } = useQuery({
    queryKey: ['admin-hospitals', hospitalSearch, hospitalType, hospitalPage],
    queryFn: async () => {
      const res = await hospitalApi.getHospitals({
        search: hospitalSearch || undefined,
        hospital_type: hospitalType || undefined,
        page: hospitalPage,
        page_size: 15,
      })
      return res.data
    },
  })

  const { data: specialistsList } = useQuery({
    queryKey: ['specialists-all'],
    queryFn: async () => {
      const res = await specialistApi.getSpecialists({ page_size: 100 })
      return res.data?.results || []
    },
  })

  // ─── Doctor Mutations ──────────────────────────────────────────────
  const doctorMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingDoctorId) {
        return doctorApi.updateDoctor(editingDoctorId, data)
      }
      return doctorApi.createDoctor(data)
    },
    onSuccess: () => {
      setFormSuccess(editingDoctorId ? 'Doctor profile updated successfully!' : 'New doctor added successfully!')
      setOpenDoctorModal(false)
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] })
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.detail || 'Failed to save doctor. Please check all fields.')
    },
  })

  const deleteDoctorMutation = useMutation({
    mutationFn: (id: string) => doctorApi.deleteDoctor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] })
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
    },
    onError: () => {
      alert('Failed to delete doctor profile.')
    },
  })

  // ─── Hospital Mutations ────────────────────────────────────────────
  const hospitalMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingHospitalId) {
        return hospitalApi.updateHospital(editingHospitalId, data)
      }
      return hospitalApi.createHospital(data)
    },
    onSuccess: () => {
      setFormSuccess(editingHospitalId ? 'Hospital details updated successfully!' : 'New hospital facility added!')
      setOpenHospitalModal(false)
      queryClient.invalidateQueries({ queryKey: ['admin-hospitals'] })
      queryClient.invalidateQueries({ queryKey: ['hospitals'] })
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.detail || 'Failed to save hospital. Please check all fields.')
    },
  })

  const deleteHospitalMutation = useMutation({
    mutationFn: (id: string) => hospitalApi.deleteHospital(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hospitals'] })
      queryClient.invalidateQueries({ queryKey: ['hospitals'] })
    },
    onError: () => {
      alert('Failed to delete hospital facility.')
    },
  })

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleOpenDoctorModal = (doc?: any) => {
    setFormError('')
    if (doc) {
      setEditingDoctorId(doc.id)
      setDoctorForm({
        full_name: doc.full_name || '',
        gender: doc.gender || 'male',
        mobile: doc.mobile || '',
        email: doc.email || '',
        degree_summary: doc.degree_summary || '',
        current_position: doc.current_position || '',
        consultation_fee: doc.consultation_fee ? String(doc.consultation_fee) : '1000',
        appointment_number: doc.appointment_number || '',
        specialist_id: doc.specialists?.[0]?.id || '',
        is_active: doc.is_active ?? true,
        is_verified: doc.is_verified ?? true,
      })
    } else {
      setEditingDoctorId(null)
      setDoctorForm({
        full_name: '',
        gender: 'male',
        mobile: '',
        email: '',
        degree_summary: '',
        current_position: '',
        consultation_fee: '1000',
        appointment_number: '',
        specialist_id: '',
        is_active: true,
        is_verified: true,
      })
    }
    setOpenDoctorModal(true)
  }

  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctorForm.full_name.trim()) {
      setFormError('Doctor full name is required.')
      return
    }

    const payload: any = {
      full_name: doctorForm.full_name.trim(),
      gender: doctorForm.gender,
      mobile: doctorForm.mobile,
      email: doctorForm.email,
      degree_summary: doctorForm.degree_summary,
      current_position: doctorForm.current_position,
      consultation_fee: parseFloat(doctorForm.consultation_fee) || 0,
      appointment_number: doctorForm.appointment_number,
      is_active: doctorForm.is_active,
      is_verified: doctorForm.is_verified,
    }

    if (doctorForm.specialist_id) {
      payload.specialist_ids = [doctorForm.specialist_id]
    }

    doctorMutation.mutate(payload)
  }

  const handleOpenHospitalModal = (hosp?: any) => {
    setFormError('')
    if (hosp) {
      setEditingHospitalId(hosp.id)
      setHospitalForm({
        name: hosp.name || '',
        hospital_type: hosp.hospital_type || 'private',
        division: hosp.division || 'Dhaka',
        district: hosp.district || 'Dhaka',
        city: hosp.city || 'Dhaka',
        area: hosp.area || 'Dhanmondi',
        address: hosp.address || '',
        phone: hosp.phone || '',
        emergency_phone: hosp.emergency_phone || '',
        bed_count: hosp.bed_count || 100,
        available_beds: hosp.available_beds || 15,
        emergency_available: hosp.emergency_available ?? true,
        open_24_hours: hosp.open_24_hours ?? true,
        ambulance_available: hosp.ambulance_available ?? true,
        latitude: hosp.latitude || 23.8103,
        longitude: hosp.longitude || 90.4125,
        status: hosp.status || 'active',
      })
    } else {
      setEditingHospitalId(null)
      setHospitalForm({
        name: '',
        hospital_type: 'private',
        division: 'Dhaka',
        district: 'Dhaka',
        city: 'Dhaka',
        area: 'Dhanmondi',
        address: '',
        phone: '',
        emergency_phone: '',
        bed_count: 100,
        available_beds: 15,
        emergency_available: true,
        open_24_hours: true,
        ambulance_available: true,
        latitude: 23.8103,
        longitude: 90.4125,
        status: 'active',
      })
    }
    setOpenHospitalModal(true)
  }

  const handleSaveHospital = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalForm.name.trim()) {
      setFormError('Hospital name is required.')
      return
    }

    hospitalMutation.mutate({
      ...hospitalForm,
      name: hospitalForm.name.trim(),
      bed_count: Number(hospitalForm.bed_count),
      available_beds: Number(hospitalForm.available_beds),
    })
  }

  const handleDetectGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setHospitalForm((prev) => ({
            ...prev,
            latitude: Number(pos.coords.latitude.toFixed(4)),
            longitude: Number(pos.coords.longitude.toFixed(4)),
          }))
        },
        () => {
          alert('Could not retrieve current coordinates. Using defaults.')
        }
      )
    }
  }

  const doctorsList = doctorsData?.results || []
  const totalDoctors = doctorsData?.count || 0
  const doctorTotalPages = doctorsData?.total_pages || Math.ceil(totalDoctors / 15) || 1

  const hospitalsList = hospitalsData?.results || []
  const totalHospitals = hospitalsData?.count || 0
  const hospitalTotalPages = hospitalsData?.total_pages || Math.ceil(totalHospitals / 15) || 1

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', py: 4 }}>
      <Container maxWidth="xl">
        {/* Top Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3.5 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Healthcare Facilities & Specialist Directory
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
              Administer certified doctors, accredited hospitals, emergency status, and consultation fees.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {tabIndex === 0 ? (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDoctorModal()}
                sx={{
                  bgcolor: '#0D9488',
                  color: 'white',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: 2.5,
                  px: 2.5,
                  '&:hover': { bgcolor: '#0F766E' },
                }}
              >
                + Add Doctor
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenHospitalModal()}
                sx={{
                  bgcolor: '#2563EB',
                  color: 'white',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: 2.5,
                  px: 2.5,
                  '&:hover': { bgcolor: '#1D4ED8' },
                }}
              >
                + Add Hospital
              </Button>
            )}
          </Box>
        </Box>

        {formSuccess && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setFormSuccess('')}>
            {formSuccess}
          </Alert>
        )}

        {/* Tabs */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: 'white', mb: 3, p: 0.5 }}>
          <Tabs
            value={tabIndex}
            onChange={(_, val) => setTabIndex(val)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.9375rem',
                minHeight: 48,
                borderRadius: 2,
              },
            }}
          >
            <Tab
              icon={<MedicalServices sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label={`Doctors Directory (${totalDoctors})`}
            />
            <Tab
              icon={<LocalHospital sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label={`Hospital Facilities (${totalHospitals})`}
            />
          </Tabs>
        </Paper>

        {/* ─── TAB 1: DOCTORS DIRECTORY ───────────────────────────────── */}
        {tabIndex === 0 && (
          <Box>
            {/* Filter Bar */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: 'white', mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  placeholder="Search doctor by name, degree, department..."
                  value={doctorSearch}
                  onChange={(e) => {
                    setDoctorSearch(e.target.value)
                    setDoctorPage(1)
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ fontSize: 20, color: '#94A3B8' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ width: { xs: '100%', sm: 380 }, bgcolor: '#F8FAFC', borderRadius: 2 }}
                />

                <Typography variant="body2" sx={{ color: '#64748B', ml: 'auto', fontWeight: 600 }}>
                  Showing {doctorsList.length} of {totalDoctors} registered specialists
                </Typography>
              </Box>
            </Paper>

            {/* Doctors Table */}
            {loadingDoctors ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress color="primary" />
              </Box>
            ) : (
              <Paper elevation={0} sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0', overflow: 'hidden', bgcolor: 'white' }}>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Specialist Doctor</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Department / Specialization</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Fee (৳)</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Rating</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569', textAlign: 'right' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {doctorsList.map((doc: any) => (
                        <TableRow key={doc.id} hover sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ bgcolor: '#CCFBF1', color: '#0D9488', fontWeight: 800, width: 38, height: 38 }}>
                                {doc.full_name?.charAt(0) || 'D'}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                  {doc.full_name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                  {doc.degree_summary || doc.current_position || 'Medical Consultant'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={doc.specialists?.[0]?.name || doc.department_name || 'General Medicine'}
                              size="small"
                              sx={{ bgcolor: '#F0FDFA', color: '#0F766E', fontWeight: 700, fontSize: 11 }}
                            />
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#15803D' }}>
                              ৳{doc.consultation_fee || '1,000'}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#D97706' }}>
                              ⭐ {doc.average_rating || '4.8'} ({doc.review_count || 0})
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={doc.is_active ? 'Active' : 'Inactive'}
                              size="small"
                              sx={{
                                bgcolor: doc.is_active ? '#F0FDF4' : '#F1F5F9',
                                color: doc.is_active ? '#166534' : '#64748B',
                                fontWeight: 700,
                                fontSize: 11,
                              }}
                            />
                          </TableCell>

                          <TableCell align="right">
                            <Tooltip title="Edit Profile">
                              <IconButton size="small" onClick={() => handleOpenDoctorModal(doc)} sx={{ color: '#2563EB', mr: 0.5 }}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Doctor">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${doc.full_name}?`)) {
                                    deleteDoctorMutation.mutate(doc.id)
                                  }
                                }}
                                sx={{ color: '#DC2626' }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}

                      {doctorsList.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#64748B' }}>
                            No doctors found matching your query.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {doctorTotalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2.5, borderTop: '1px solid #F1F5F9' }}>
                    <Pagination
                      count={doctorTotalPages}
                      page={doctorPage}
                      onChange={(_, p) => setDoctorPage(p)}
                      color="primary"
                    />
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        )}

        {/* ─── TAB 2: HOSPITALS DIRECTORY ─────────────────────────────── */}
        {tabIndex === 1 && (
          <Box>
            {/* Filter Bar */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: 'white', mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  placeholder="Search hospital by name, area, address..."
                  value={hospitalSearch}
                  onChange={(e) => {
                    setHospitalSearch(e.target.value)
                    setHospitalPage(1)
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ fontSize: 20, color: '#94A3B8' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ width: { xs: '100%', sm: 340 }, bgcolor: '#F8FAFC', borderRadius: 2 }}
                />

                <FormControl size="small" sx={{ minWidth: 160, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                  <InputLabel>Facility Type</InputLabel>
                  <Select
                    value={hospitalType}
                    label="Facility Type"
                    onChange={(e) => {
                      setHospitalType(e.target.value)
                      setHospitalPage(1)
                    }}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="private">Private Hospital</MenuItem>
                    <MenuItem value="government">Government</MenuItem>
                    <MenuItem value="specialized">Specialized Center</MenuItem>
                    <MenuItem value="diagnostic">Diagnostic Clinic</MenuItem>
                  </Select>
                </FormControl>

                <Typography variant="body2" sx={{ color: '#64748B', ml: 'auto', fontWeight: 600 }}>
                  Showing {hospitalsList.length} of {totalHospitals} facilities
                </Typography>
              </Box>
            </Paper>

            {/* Hospitals Table */}
            {loadingHospitals ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress color="primary" />
              </Box>
            ) : (
              <Paper elevation={0} sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0', overflow: 'hidden', bgcolor: 'white' }}>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Hospital Facility</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Type & Area</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Beds (Available / Total)</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Emergency & ICU</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569', textAlign: 'right' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {hospitalsList.map((h: any) => (
                        <TableRow key={h.id} hover sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 800, width: 38, height: 38 }}>
                                <LocalHospital sx={{ fontSize: 20 }} />
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                  {h.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                  📍 {h.address || h.area || 'Dhaka'} {h.phone ? `· 📞 ${h.phone}` : ''}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={h.hospital_type?.toUpperCase() || 'GENERAL'}
                              size="small"
                              sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, fontSize: 10, mr: 1 }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155' }}>
                              {h.area || 'Dhaka'}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#15803D' }}>
                              {h.available_beds || 0} / {h.bed_count || 100} Beds Free
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {h.emergency_available ? (
                              <Chip
                                icon={<Emergency sx={{ fontSize: '13px !important' }} />}
                                label="24/7 ER Active"
                                size="small"
                                color="error"
                                sx={{ fontSize: 11, fontWeight: 700 }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">Standard Hours</Typography>
                            )}
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={h.status === 'active' ? 'Active' : 'Inactive'}
                              size="small"
                              sx={{
                                bgcolor: h.status === 'active' ? '#F0FDF4' : '#F1F5F9',
                                color: h.status === 'active' ? '#166534' : '#64748B',
                                fontWeight: 700,
                                fontSize: 11,
                              }}
                            />
                          </TableCell>

                          <TableCell align="right">
                            <Tooltip title="Edit Facility">
                              <IconButton size="small" onClick={() => handleOpenHospitalModal(h)} sx={{ color: '#2563EB', mr: 0.5 }}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Hospital">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${h.name}?`)) {
                                    deleteHospitalMutation.mutate(h.id)
                                  }
                                }}
                                sx={{ color: '#DC2626' }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}

                      {hospitalsList.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#64748B' }}>
                            No hospitals found matching your query.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {hospitalTotalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2.5, borderTop: '1px solid #F1F5F9' }}>
                    <Pagination
                      count={hospitalTotalPages}
                      page={hospitalPage}
                      onChange={(_, p) => setHospitalPage(p)}
                      color="primary"
                    />
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        )}
      </Container>

      {/* ─── ADD / EDIT DOCTOR DIALOG ──────────────────────────────────── */}
      <Dialog
        open={openDoctorModal}
        onClose={() => setOpenDoctorModal(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3.5, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{editingDoctorId ? 'Edit Doctor Profile' : 'Add New Certified Specialist Doctor'}</span>
          <IconButton size="small" onClick={() => setOpenDoctorModal(false)}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: '#F1F5F9' }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {formError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSaveDoctor} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Doctor Full Name"
                  required
                  fullWidth
                  value={doctorForm.full_name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, full_name: e.target.value })}
                  placeholder="e.g. Prof. Dr. M. A. Rashid"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={doctorForm.gender}
                    label="Gender"
                    onChange={(e) => setDoctorForm({ ...doctorForm, gender: e.target.value })}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Degree Summary"
                  fullWidth
                  value={doctorForm.degree_summary}
                  onChange={(e) => setDoctorForm({ ...doctorForm, degree_summary: e.target.value })}
                  placeholder="e.g. MBBS, FCPS, MD (Cardiology)"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Current Position / Title"
                  fullWidth
                  value={doctorForm.current_position}
                  onChange={(e) => setDoctorForm({ ...doctorForm, current_position: e.target.value })}
                  placeholder="e.g. Senior Consultant & Professor"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Primary Specialization</InputLabel>
                  <Select
                    value={doctorForm.specialist_id}
                    label="Primary Specialization"
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialist_id: e.target.value })}
                  >
                    <MenuItem value="">Select Specialization</MenuItem>
                    {specialistsList?.map((s: any) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Consultation Fee (৳)"
                  type="number"
                  fullWidth
                  value={doctorForm.consultation_fee}
                  onChange={(e) => setDoctorForm({ ...doctorForm, consultation_fee: e.target.value })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Appointment Number / Hotline"
                  fullWidth
                  value={doctorForm.appointment_number}
                  onChange={(e) => setDoctorForm({ ...doctorForm, appointment_number: e.target.value })}
                  placeholder="017XXXXXXXX"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Contact Mobile"
                  fullWidth
                  value={doctorForm.mobile}
                  onChange={(e) => setDoctorForm({ ...doctorForm, mobile: e.target.value })}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel
                control={<Checkbox checked={doctorForm.is_active} onChange={(e) => setDoctorForm({ ...doctorForm, is_active: e.target.checked })} color="primary" />}
                label="Active in Search Directory"
              />
              <FormControlLabel
                control={<Checkbox checked={doctorForm.is_verified} onChange={(e) => setDoctorForm({ ...doctorForm, is_verified: e.target.checked })} color="success" />}
                label="Verified Doctor Profile"
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDoctorModal(false)} sx={{ textTransform: 'none', color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveDoctor}
            disabled={doctorMutation.isPending}
            sx={{
              bgcolor: '#0D9488',
              color: 'white',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              '&:hover': { bgcolor: '#0F766E' },
            }}
          >
            {doctorMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Save Doctor Profile'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── ADD / EDIT HOSPITAL DIALOG ─────────────────────────────────── */}
      <Dialog
        open={openHospitalModal}
        onClose={() => setOpenHospitalModal(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3.5, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{editingHospitalId ? 'Edit Hospital Details' : 'Add New Hospital / Healthcare Facility'}</span>
          <IconButton size="small" onClick={() => setOpenHospitalModal(false)}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: '#F1F5F9' }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {formError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSaveHospital} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Hospital / Clinic Name"
                  required
                  fullWidth
                  value={hospitalForm.name}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                  placeholder="e.g. Apollo / Evercare Hospital"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Facility Type</InputLabel>
                  <Select
                    value={hospitalForm.hospital_type}
                    label="Facility Type"
                    onChange={(e) => setHospitalForm({ ...hospitalForm, hospital_type: e.target.value })}
                  >
                    <MenuItem value="private">Private Hospital</MenuItem>
                    <MenuItem value="government">Government Hospital</MenuItem>
                    <MenuItem value="specialized">Specialized Hospital</MenuItem>
                    <MenuItem value="clinic">Diagnostic Center & Clinic</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="City / Area"
                  fullWidth
                  value={hospitalForm.area}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, area: e.target.value })}
                  placeholder="e.g. Dhanmondi, Dhaka"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Full Street Address"
                  fullWidth
                  value={hospitalForm.address}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                  placeholder="e.g. Plot 81, Block E, Bashundhara R/A"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Contact Phone / Reception"
                  fullWidth
                  value={hospitalForm.phone}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="24/7 Emergency Hotline"
                  fullWidth
                  value={hospitalForm.emergency_phone}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, emergency_phone: e.target.value })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Total Bed Capacity"
                  type="number"
                  fullWidth
                  value={hospitalForm.bed_count}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, bed_count: Number(e.target.value) })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Available Free Beds"
                  type="number"
                  fullWidth
                  value={hospitalForm.available_beds}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, available_beds: Number(e.target.value) })}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block' }}>
                  GPS Coordinates for Maps & Proximity
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  {hospitalForm.latitude}, {hospitalForm.longitude}
                </Typography>
              </Box>
              <Button size="small" variant="outlined" startIcon={<MyLocation />} onClick={handleDetectGPS} sx={{ textTransform: 'none' }}>
                Auto Detect GPS
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={<Checkbox checked={hospitalForm.emergency_available} onChange={(e) => setHospitalForm({ ...hospitalForm, emergency_available: e.target.checked })} color="error" />}
                label="24/7 Emergency Department"
              />
              <FormControlLabel
                control={<Checkbox checked={hospitalForm.ambulance_available} onChange={(e) => setHospitalForm({ ...hospitalForm, ambulance_available: e.target.checked })} color="primary" />}
                label="Ambulance Fleet on Standby"
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenHospitalModal(false)} sx={{ textTransform: 'none', color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveHospital}
            disabled={hospitalMutation.isPending}
            sx={{
              bgcolor: '#2563EB',
              color: 'white',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              '&:hover': { bgcolor: '#1D4ED8' },
            }}
          >
            {hospitalMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Save Hospital Facility'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
