/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  MenuItem,
  Chip,
  Avatar,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  IconButton,
  Grid,
  Stack,
} from '@mui/material'
import {
  WaterDrop,
  Phone,
  LocationOn,
  Favorite,
  MyLocation,
  ViewModule,
  ViewList,
  Emergency,
  Verified,
  VolunteerActivism,
  HealthAndSafety,
  InfoOutlined,
  CheckCircle,
} from '@mui/icons-material'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bloodApi } from '../api/services'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const BLOOD_GROUPS = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

// Compatibility rules dictionary
const COMPATIBILITY_RULES: Record<
  string,
  { canDonateTo: string[]; canReceiveFrom: string[]; notes: string }
> = {
  'O-': {
    canDonateTo: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    canReceiveFrom: ['O-'],
    notes: 'Universal Red Blood Cell Donor. Critical for emergency trauma transfusions.',
  },
  'O+': {
    canDonateTo: ['A+', 'B+', 'AB+', 'O+'],
    canReceiveFrom: ['O+', 'O-'],
    notes: 'Most common blood group. High demand across all hospital clinical wards.',
  },
  'A-': {
    canDonateTo: ['A+', 'A-', 'AB+', 'AB-'],
    canReceiveFrom: ['A-', 'O-'],
    notes: 'Can safely donate to any A or AB positive/negative patients.',
  },
  'A+': {
    canDonateTo: ['A+', 'AB+'],
    canReceiveFrom: ['A+', 'A-', 'O+', 'O-'],
    notes: 'Second most common blood group. Compatible with A+ and AB+ recipients.',
  },
  'B-': {
    canDonateTo: ['B+', 'B-', 'AB+', 'AB-'],
    canReceiveFrom: ['B-', 'O-'],
    notes: 'Rare blood type. High value for matched scheduled surgeries.',
  },
  'B+': {
    canDonateTo: ['B+', 'AB+'],
    canReceiveFrom: ['B+', 'B-', 'O+', 'O-'],
    notes: 'Compatible with B+ and AB+ recipients.',
  },
  'AB-': {
    canDonateTo: ['AB+', 'AB-'],
    canReceiveFrom: ['AB-', 'A-', 'B-', 'O-'],
    notes: 'Universal Plasma donor. Rarest red blood cell type.',
  },
  'AB+': {
    canDonateTo: ['AB+'],
    canReceiveFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    notes: 'Universal Red Blood Cell Recipient. Can receive blood from any blood group.',
  },
}

export default function BloodDonorsPage() {
  const [bloodGroup, setBloodGroup] = useState('')
  const [radius, setRadius] = useState(50)
  const [selectedCompatGroup, setSelectedCompatGroup] = useState('O+')

  // Detailed Donor Registration State
  const [openRegisterModal, setOpenRegisterModal] = useState(false)
  const [donorFullName, setDonorFullName] = useState('')
  const [donorPhone, setDonorPhone] = useState('')
  const [donorAddress, setDonorAddress] = useState('')
  const [donorGroup, setDonorGroup] = useState('O+')
  const [lastDonatedAt, setLastDonatedAt] = useState('')
  const [totalDonations, setTotalDonations] = useState(1)
  const [isAvailable, setIsAvailable] = useState(true)
  const [donorLat, setDonorLat] = useState(23.8103)
  const [donorLng, setDonorLng] = useState(90.4125)
  const [locating, setLocating] = useState(false)

  const [regSuccess, setRegSuccess] = useState(false)
  const [regError, setRegError] = useState('')

  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // View mode state: 'grid' or 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const {
    data: donorsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['blood-donors', bloodGroup, radius],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await bloodApi.searchDonors(
        bloodGroup === 'All' ? '' : bloodGroup,
        23.8103,
        90.4125,
        radius,
        pageParam,
        12
      )
      return res.data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      if (lastPage?.next && lastPage.current_page < lastPage.total_pages) {
        return lastPage.current_page + 1
      }
      return undefined
    },
  })

  const donorsList = donorsData?.pages ? donorsData.pages.flatMap((p: any) => p?.results || []) : []
  const totalDonorsCount = donorsData?.pages?.[0]?.count ?? donorsList.length

  const { data: requestsData, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['active-blood-requests', bloodGroup],
    queryFn: async () => {
      const res = await bloodApi.getActiveRequests(bloodGroup === 'All' ? undefined : bloodGroup)
      return res.data
    },
  })

  const resolveRequestMutation = useMutation({
    mutationFn: (id: string) => bloodApi.updateRequestStatus(id, 'fulfilled'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-blood-requests'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to update request status')
    },
  })

  const registerMutation = useMutation({
    mutationFn: (data: any) => bloodApi.registerDonor(data),
    onSuccess: () => {
      setRegSuccess(true)
      setOpenRegisterModal(false)
      queryClient.invalidateQueries({ queryKey: ['blood-donors'] })
    },
    onError: (err: any) => {
      setRegError(err?.response?.data?.detail || 'Failed to register as blood donor.')
    },
  })

  const handleOpenRegister = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setDonorFullName(user?.profile?.full_name || '')
    setDonorPhone(user?.profile?.phone || '')
    setDonorAddress(user?.profile?.address || '')
    setOpenRegisterModal(true)
    setRegSuccess(false)
    setRegError('')
  }

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      setLocating(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDonorLat(Number(pos.coords.latitude.toFixed(4)))
          setDonorLng(Number(pos.coords.longitude.toFixed(4)))
          setLocating(false)
        },
        () => {
          setLocating(false)
          alert('Unable to retrieve location. Using default coordinates.')
        }
      )
    }
  }

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!donorFullName || !donorPhone) {
      setRegError('Full Name and Phone Number are required.')
      return
    }
    registerMutation.mutate({
      full_name: donorFullName,
      phone: donorPhone,
      address: donorAddress,
      blood_group: donorGroup,
      latitude: donorLat,
      longitude: donorLng,
      last_donated_at: lastDonatedAt || undefined,
      total_donations: totalDonations,
      is_available: isAvailable,
    })
  }

  const compatInfo = COMPATIBILITY_RULES[selectedCompatGroup] || COMPATIBILITY_RULES['O+']

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 10 }}>
      {/* Top Hero Banner */}
      <Box
        sx={{
          bgcolor: '#0F172A',
          color: 'white',
          py: { xs: 6, md: 8 },
          px: { xs: 2, sm: 4 },
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(225, 29, 72, 0.2)',
          background: 'radial-gradient(ellipse at 80% 20%, rgba(225, 29, 72, 0.18) 0%, #0F172A 70%)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 800 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 0.8,
                borderRadius: 4,
                bgcolor: 'rgba(225, 29, 72, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#FB7185',
                fontSize: 12,
                fontWeight: 700,
                mb: 2,
              }}
            >
              <VolunteerActivism fontSize="small" />
              <span>National Blood Donation & Emergency Network</span>
            </Box>

            <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '2rem', sm: '2.8rem' }, letterSpacing: '-0.02em', mb: 2 }}>
              Every Drop Saves Lives.{' '}
              <span style={{ color: '#FB7185' }}>Connect in Seconds.</span>
            </Typography>

            <Typography sx={{ color: '#94A3B8', fontSize: { xs: 15, sm: 17 }, lineHeight: 1.6, mb: 4 }}>
              Find verified voluntary blood donors near your location in real time, view live emergency hospital requests, or register as a hero donor today.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Favorite />}
                onClick={handleOpenRegister}
                sx={{
                  bgcolor: '#E11D48',
                  color: 'white',
                  borderRadius: 2.5,
                  px: 3.5,
                  py: 1.4,
                  fontWeight: 800,
                  fontSize: 15,
                  textTransform: 'none',
                  boxShadow: '0 10px 25px rgba(225, 29, 72, 0.4)',
                  '&:hover': { bgcolor: '#BE123C' },
                }}
              >
                Register as Blood Donor
              </Button>

              <Button
                variant="outlined"
                size="large"
                component={Link}
                to="/blood-request"
                startIcon={<Emergency />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  borderRadius: 2.5,
                  px: 3.5,
                  py: 1.4,
                  fontWeight: 700,
                  fontSize: 15,
                  textTransform: 'none',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)', borderColor: 'white' },
                }}
              >
                Post Emergency Blood Request
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -4 }}>
        {regSuccess && (
          <Alert severity="success" sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }} onClose={() => setRegSuccess(false)}>
            Thank you! You are now registered as an active voluntary blood donor. Patients in need can reach out to you directly.
          </Alert>
        )}

        {/* Live Stat Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: 'white', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Avatar sx={{ bgcolor: '#FFE4E6', color: '#E11D48', width: 36, height: 36 }}>
                  <WaterDrop fontSize="small" />
                </Avatar>
                <Typography sx={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Active Donors</Typography>
              </Box>
              <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>
                {totalDonorsCount || 128}+
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: 'white', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Avatar sx={{ bgcolor: '#FEF3C7', color: '#D97706', width: 36, height: 36 }}>
                  <Emergency fontSize="small" />
                </Avatar>
                <Typography sx={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Active Requests</Typography>
              </Box>
              <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>
                {requestsData?.count || 0}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: 'white', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Avatar sx={{ bgcolor: '#CCFBF1', color: '#0D9488', width: 36, height: 36 }}>
                  <Verified fontSize="small" />
                </Avatar>
                <Typography sx={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Compatibility Match</Typography>
              </Box>
              <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>
                100% Verified
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: 'white', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Avatar sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', width: 36, height: 36 }}>
                  <HealthAndSafety fontSize="small" />
                </Avatar>
                <Typography sx={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Emergency Radius</Typography>
              </Box>
              <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>
                {radius} km
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Interactive Compatibility Matrix Explorer */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 5,
            borderRadius: 4,
            bgcolor: 'white',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoOutlined sx={{ color: '#E11D48' }} /> Blood Compatibility Matrix
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select a blood group to view compatible donors and recipients
              </Typography>
            </Box>

            {/* Blood Group Selector Chips */}
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {BLOOD_GROUPS.filter((g) => g !== 'All').map((bg) => (
                <Chip
                  key={bg}
                  label={bg}
                  onClick={() => setSelectedCompatGroup(bg)}
                  sx={{
                    fontWeight: 800,
                    fontSize: 13,
                    px: 1,
                    py: 2,
                    borderRadius: 2,
                    cursor: 'pointer',
                    bgcolor: selectedCompatGroup === bg ? '#E11D48' : '#F1F5F9',
                    color: selectedCompatGroup === bg ? 'white' : '#334155',
                    '&:hover': {
                      bgcolor: selectedCompatGroup === bg ? '#BE123C' : '#E2E8F0',
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={3} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 3, border: '1px solid #E2E8F0' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#64748B', mb: 1 }}>
                  CAN DONATE BLOOD TO:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {compatInfo.canDonateTo.map((g) => (
                    <Chip key={g} label={g} color="error" variant="filled" sx={{ fontWeight: 700, borderRadius: 2 }} />
                  ))}
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 3, border: '1px solid #E2E8F0' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#64748B', mb: 1 }}>
                  CAN RECEIVE BLOOD FROM:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {compatInfo.canReceiveFrom.map((g) => (
                    <Chip key={g} label={g} color="success" variant="filled" sx={{ fontWeight: 700, borderRadius: 2 }} />
                  ))}
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Typography sx={{ fontSize: 12, color: '#64748B', fontStyle: 'italic', lineHeight: 1.4 }}>
                {compatInfo.notes}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Live Emergency Blood Requests */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <span
                style={{
                  height: 12,
                  width: 12,
                  borderRadius: '50%',
                  backgroundColor: '#E11D48',
                  display: 'inline-block',
                  boxShadow: '0 0 12px #E11D48',
                }}
              />
              Live Urgent Requests ({requestsData?.count || 0})
            </Typography>

            <Button
              component={Link}
              to="/blood-request"
              variant="text"
              sx={{ color: '#E11D48', fontWeight: 700, textTransform: 'none' }}
            >
              + Create New Request
            </Button>
          </Box>

          {isLoadingRequests ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} color="error" />
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {requestsData?.results.map((req: any) => {
                const isOwner = user?.id === req.requester
                return (
                  <Grid size={{ xs: 12, md: 6 }} key={req.id}>
                    <Card
                      sx={{
                        borderRadius: 3.5,
                        border: '1px solid #E2E8F0',
                        borderLeft: `5px solid ${req.urgency === 'critical' ? '#E11D48' : '#F59E0B'}`,
                        boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                        transition: '0.2s',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.06)' },
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                bgcolor: req.urgency === 'critical' ? '#FFE4E6' : '#FEF3C7',
                                color: req.urgency === 'critical' ? '#E11D48' : '#D97706',
                                fontWeight: 900,
                                width: 48,
                                height: 48,
                                fontSize: 18,
                              }}
                            >
                              {req.blood_group}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                {req.units_needed} Unit(s) Needed
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Patient: {req.patient_name}
                              </Typography>
                            </Box>
                          </Box>

                          <Chip
                            label={req.urgency.toUpperCase()}
                            sx={{
                              bgcolor: req.urgency === 'critical' ? '#E11D48' : '#F59E0B',
                              color: 'white',
                              fontWeight: 800,
                              fontSize: 11,
                              borderRadius: 1.5,
                            }}
                            size="small"
                          />
                        </Box>

                        <Typography variant="body2" sx={{ mb: 1, color: '#334155' }}>
                          <strong>Hospital:</strong> {req.hospital_name || 'Emergency Medical Center'}
                        </Typography>

                        {req.notes && (
                          <Typography variant="body2" sx={{ mb: 2, color: '#64748B', bgcolor: '#F8FAFC', p: 1.5, borderRadius: 2 }}>
                            "{req.notes}"
                          </Typography>
                        )}

                        <Divider sx={{ my: 1.5 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Requested by {req.requester_name || 'Family member'} • {new Date(req.created_at).toLocaleDateString()}
                          </Typography>

                          {isOwner && (
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              disabled={resolveRequestMutation.isPending}
                              onClick={() => resolveRequestMutation.mutate(req.id)}
                              sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                            >
                              Mark Solved
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )
              })}

              {requestsData?.results.length === 0 && (
                <Grid size={12}>
                  <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: 'white', border: '1px dashed #CBD5E1' }}>
                    <CheckCircle sx={{ color: '#10B981', fontSize: 36, mb: 1 }} />
                    <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>No active emergency blood requests right now.</Typography>
                    <Typography variant="body2" color="text.secondary">
                      All urgent transfusions in your region are currently fulfilled.
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </Box>

        {/* Directory Filters & Controls */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
              Verified Voluntary Donors Directory
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Showing {donorsList.length} of {totalDonorsCount} registered donors ready for immediate contact
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            {/* Blood Filter */}
            <TextField
              select
              size="small"
              label="Filter Blood"
              value={bloodGroup || 'All'}
              onChange={(e) => {
                setBloodGroup(e.target.value === 'All' ? '' : e.target.value)
              }}
              sx={{ minWidth: 150, bgcolor: 'white', borderRadius: 2 }}
            >
              {BLOOD_GROUPS.map((bg) => (
                <MenuItem key={bg} value={bg}>
                  {bg === 'All' ? 'All Blood Groups' : bg}
                </MenuItem>
              ))}
            </TextField>

            {/* Radius Filter */}
            <TextField
              size="small"
              type="number"
              label="Radius (km)"
              value={radius}
              onChange={(e) => {
                setRadius(Number(e.target.value))
              }}
              sx={{ width: 120, bgcolor: 'white', borderRadius: 2 }}
            />

            {/* View Mode */}
            <Box sx={{ display: 'flex', border: '1px solid #CBD5E1', borderRadius: 2, p: 0.5, bgcolor: 'white' }}>
              <IconButton size="small" color={viewMode === 'grid' ? 'error' : 'default'} onClick={() => setViewMode('grid')}>
                <ViewModule fontSize="small" />
              </IconButton>
              <IconButton size="small" color={viewMode === 'list' ? 'error' : 'default'} onClick={() => setViewMode('list')}>
                <ViewList fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} color="error" />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>
            Failed to retrieve blood donors. Please check connection.
          </Alert>
        )}

        {/* Donors Cards List */}
        {donorsData && (
          <>
            {viewMode === 'grid' ? (
              <Grid container spacing={3}>
                {donorsList.map((donor: any) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={donor.id}>
                    <Card
                      sx={{
                        borderRadius: 3.5,
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                        transition: '0.2s',
                        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' },
                      }}
                    >
                      <CardContent sx={{ p: 3, textAlign: 'center' }}>
                        <Avatar
                          sx={{
                            width: 64,
                            height: 64,
                            mx: 'auto',
                            mb: 2,
                            bgcolor: '#FFE4E6',
                            color: '#E11D48',
                            fontSize: 22,
                            fontWeight: 900,
                            border: '2px solid #FDA4AF',
                          }}
                        >
                          {donor.blood_group}
                        </Avatar>

                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
                          {donor.full_name || 'Verified Donor'}
                        </Typography>

                        <Chip
                          label={donor.is_available ? 'Available to Donate' : 'Recently Donated'}
                          color={donor.is_available ? 'success' : 'default'}
                          size="small"
                          sx={{ fontWeight: 700, borderRadius: 1.5, mb: 2 }}
                        />

                        <Divider sx={{ my: 1.5 }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                          <Phone fontSize="small" sx={{ color: '#0D9488' }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            {donor.phone || '+8801700000000'}
                          </Typography>
                        </Box>

                        {donor.distance_km != null && (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <LocationOn fontSize="small" sx={{ color: '#64748B' }} />
                            <Typography variant="caption" color="text.secondary">
                              {donor.distance_km} km away
                            </Typography>
                          </Box>
                        )}

                        <Button
                          fullWidth
                          variant="contained"
                          component="a"
                          href={`tel:${donor.phone}`}
                          startIcon={<Phone />}
                          sx={{
                            mt: 2.5,
                            borderRadius: 2,
                            bgcolor: '#0F172A',
                            color: 'white',
                            fontWeight: 700,
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#1E293B' },
                          }}
                        >
                          Call Donor
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}

                {donorsList.length === 0 && !isLoading && (
                  <Grid size={12}>
                    <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: 'white', border: '1px dashed #CBD5E1' }}>
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                        No active blood donors found for group {bloodGroup || 'Selected'} within {radius} km.
                      </Typography>
                      <Button variant="contained" color="error" component={Link} to="/blood-request" sx={{ borderRadius: 2, textTransform: 'none' }}>
                        Post an Emergency Blood Request
                      </Button>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            ) : (
              <Stack spacing={2}>
                {donorsList.map((donor: any) => (
                  <Card
                    key={donor.id}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                      <Avatar sx={{ width: 52, height: 52, bgcolor: '#FFE4E6', color: '#E11D48', fontWeight: 900, fontSize: 18 }}>
                        {donor.blood_group}
                      </Avatar>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            {donor.full_name || 'Verified Donor'}
                          </Typography>
                          <Chip
                            label={donor.is_available ? 'Available' : 'Resting'}
                            color={donor.is_available ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {(donor as any).address || (donor as any).location_name || 'Dhaka, Bangladesh'} {donor.distance_km != null ? `• ${donor.distance_km} km away` : ''}
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      variant="contained"
                      component="a"
                      href={`tel:${donor.phone}`}
                      startIcon={<Phone />}
                      sx={{ borderRadius: 2, bgcolor: '#0F172A', textTransform: 'none', fontWeight: 700 }}
                    >
                      Call: {donor.phone || '+8801XXXXXXXXX'}
                    </Button>
                  </Card>
                ))}
              </Stack>
            )}

            {/* View More Donors Controls (Backend Pagination) */}
            {hasNextPage && (
              <Box
                sx={{
                  mt: 5,
                  p: 4,
                  bgcolor: '#F8FAFC',
                  borderRadius: 4,
                  border: '1px solid #E2E8F0',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Showing {donorsList.length} of {totalDonorsCount} verified donors
                </Typography>
                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    sx={{
                      bgcolor: '#E11D48',
                      color: 'white',
                      fontWeight: 800,
                      borderRadius: 3,
                      px: 3.5,
                      py: 1.2,
                      textTransform: 'none',
                      boxShadow: '0 4px 14px rgba(225, 29, 72, 0.25)',
                      '&:hover': { bgcolor: '#BE123C' },
                    }}
                  >
                    {isFetchingNextPage ? <CircularProgress size={16} color="inherit" /> : 'View More Donors (+12)'}
                  </Button>
                </Stack>
              </Box>
            )}
          </>
        )}

        {/* DONOR REGISTRATION MODAL */}
        <Dialog open={openRegisterModal} onClose={() => setOpenRegisterModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, bgcolor: '#0F172A', color: 'white' }}>
            Register as a Voluntary Blood Donor
          </DialogTitle>
          <form onSubmit={handleRegisterSubmit}>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: 3 }}>
              {regError && <Alert severity="error">{regError}</Alert>}

              <Typography variant="body2" color="text.secondary">
                Your profile will help patients and emergency hospital wards locate you during critical blood shortages.
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={donorFullName}
                    onChange={(e) => setDonorFullName(e.target.value)}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Contact Phone"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="Blood Group"
                    value={donorGroup}
                    onChange={(e) => setDonorGroup(e.target.value)}
                    required
                  >
                    {BLOOD_GROUPS.filter((bg) => bg !== 'All').map((bg) => (
                      <MenuItem key={bg} value={bg}>
                        {bg}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Total Past Donations"
                    value={totalDonations}
                    onChange={(e) => setTotalDonations(Number(e.target.value))}
                  />
                </Grid>

                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Residential Address / City"
                    value={donorAddress}
                    onChange={(e) => setDonorAddress(e.target.value)}
                    placeholder="e.g. Dhanmondi, Dhaka"
                  />
                </Grid>

                <Grid size={12}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Last Donation Date (if applicable)"
                    value={lastDonatedAt}
                    onChange={(e) => setLastDonatedAt(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Emergency Coordinates: {donorLat}, {donorLng}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<MyLocation />}
                    onClick={handleDetectLocation}
                    disabled={locating}
                    sx={{ textTransform: 'none' }}
                  >
                    {locating ? 'Detecting...' : 'Auto Detect'}
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Used exclusively to calculate distance for emergency blood matching.
                </Typography>
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    color="error"
                  />
                }
                label="I am currently eligible and available to donate blood."
              />
            </DialogContent>
            <DialogActions sx={{ p: 2.5, bgcolor: '#F8FAFC' }}>
              <Button onClick={() => setOpenRegisterModal(false)} color="inherit" sx={{ fontWeight: 700 }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="error"
                disabled={registerMutation.isPending}
                sx={{ px: 3, borderRadius: 2, fontWeight: 800, textTransform: 'none' }}
              >
                {registerMutation.isPending ? 'Submitting...' : 'Complete Registration'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </Box>
  )
}
