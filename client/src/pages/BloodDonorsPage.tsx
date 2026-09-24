/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
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
  Tooltip,
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
  ContentCopy,
  Check,
  Close,
  Search,
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
    notes: 'Universal Red Blood Cell Donor. Critical for emergency trauma transfusions when recipient blood type is unknown.',
  },
  'O+': {
    canDonateTo: ['A+', 'B+', 'AB+', 'O+'],
    canReceiveFrom: ['O+', 'O-'],
    notes: 'Most common blood group. High demand across all hospital surgical and emergency wards.',
  },
  'A-': {
    canDonateTo: ['A+', 'A-', 'AB+', 'AB-'],
    canReceiveFrom: ['A-', 'O-'],
    notes: 'Can safely donate to any A or AB positive/negative patients. Highly versatile donor type.',
  },
  'A+': {
    canDonateTo: ['A+', 'AB+'],
    canReceiveFrom: ['A+', 'A-', 'O+', 'O-'],
    notes: 'Second most common blood group. Compatible with A+ and AB+ recipients.',
  },
  'B-': {
    canDonateTo: ['B+', 'B-', 'AB+', 'AB-'],
    canReceiveFrom: ['B-', 'O-'],
    notes: 'Rare blood type. High value for matched scheduled surgeries and thalassemia patients.',
  },
  'B+': {
    canDonateTo: ['B+', 'AB+'],
    canReceiveFrom: ['B+', 'B-', 'O+', 'O-'],
    notes: 'Compatible with B+ and AB+ recipients. High demand in community hospitals.',
  },
  'AB-': {
    canDonateTo: ['AB+', 'AB-'],
    canReceiveFrom: ['AB-', 'A-', 'B-', 'O-'],
    notes: 'Universal Plasma donor. Rarest red blood cell type in South Asia.',
  },
  'AB+': {
    canDonateTo: ['AB+'],
    canReceiveFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    notes: 'Universal Red Blood Cell Recipient. Can safely receive blood from any blood group.',
  },
}

export default function BloodDonorsPage() {
  const [bloodGroup, setBloodGroup] = useState('')
  const [radius, setRadius] = useState(50)
  const [searchQuery, setSearchQuery] = useState('')
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
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null)

  const [regSuccess, setRegSuccess] = useState(false)
  const [regError, setRegError] = useState('')

  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

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

  // Filter donors by client-side text search if provided
  const filteredDonors = donorsList.filter((d: any) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      d.full_name?.toLowerCase().includes(q) ||
      d.address?.toLowerCase().includes(q) ||
      d.blood_group?.toLowerCase().includes(q) ||
      d.phone?.includes(q)
    )
  })

  const { data: requestsData } = useQuery({
    queryKey: ['active-blood-requests', bloodGroup],
    queryFn: async () => {
      const res = await bloodApi.getActiveRequests(bloodGroup === 'All' ? undefined : bloodGroup)
      return res.data
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

  const copyPhoneNumber = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone)
    setCopiedPhoneId(id)
    setTimeout(() => setCopiedPhoneId(null), 2000)
  }

  const compatInfo = COMPATIBILITY_RULES[selectedCompatGroup] || COMPATIBILITY_RULES['O+']

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 12 }}>
      {/* ─── Hero Section ──────────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: '#0F172A',
          color: 'white',
          pt: { xs: 4, md: 6 },
          pb: { xs: 8, md: 10 },
          px: { xs: 2, sm: 4 },
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at 85% 15%, rgba(225, 29, 72, 0.22) 0%, #0F172A 70%)',
          borderBottom: '1px solid rgba(225, 29, 72, 0.2)',
        }}
      >
        <Container maxWidth="lg">
          {/* Subpage Navigation Switcher */}
          <Box
            sx={{
              display: 'inline-flex',
              p: 0.6,
              borderRadius: 3.5,
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              mb: 3.5,
              gap: 0.5,
            }}
          >
            <Button
              variant="contained"
              size="small"
              startIcon={<VolunteerActivism sx={{ fontSize: 16 }} />}
              sx={{
                bgcolor: '#E11D48',
                color: 'white',
                fontWeight: 800,
                borderRadius: 2.5,
                px: 2.5,
                py: 0.8,
                fontSize: '0.8125rem',
                textTransform: 'none',
                boxShadow: '0 4px 15px rgba(225, 29, 72, 0.4)',
                '&:hover': { bgcolor: '#BE123C' },
              }}
            >
              Voluntary Donors
            </Button>
            <Button
              component={Link}
              to="/blood/requests"
              size="small"
              startIcon={<Emergency sx={{ fontSize: 16 }} />}
              sx={{
                color: '#94A3B8',
                fontWeight: 700,
                borderRadius: 2.5,
                px: 2.2,
                py: 0.8,
                fontSize: '0.8125rem',
                textTransform: 'none',
                '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.06)' },
              }}
            >
              Emergency Requests
            </Button>
          </Box>

          <Box sx={{ maxWidth: 820 }}>

            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '1.2rem', sm: '2.2rem' },
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                mb: 2,
              }}
            >
              Every Drop Saves Lives.{' '}
              <span style={{ color: '#FB7185' }}>Connect in Seconds.</span>
            </Typography>

            <Typography
              sx={{
                color: '#94A3B8',
                fontSize: { xs: 15, sm: 17 },
                lineHeight: 1.6,
                mb: 4,
                maxWidth: 680,
              }}
            >
              Find certified voluntary blood donors near you in real-time, respond to urgent emergency hospital requests, or register as a hero donor today.
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
                  fontSize: '0.9375rem',
                  textTransform: 'none',
                  boxShadow: '0 8px 25px rgba(225, 29, 72, 0.4)',
                  '&:hover': { bgcolor: '#BE123C', transform: 'translateY(-1px)' },
                  transition: 'all 0.2s',
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
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  borderRadius: 2.5,
                  px: 3.5,
                  py: 1.4,
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  textTransform: 'none',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.12)', borderColor: 'white' },
                }}
              >
                Post Emergency Blood Request
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* ─── Metric Highlights ────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 10, mt: { xs: 3, md: -6 }, mb: 5 }}>
        {regSuccess && (
          <Alert
            severity="success"
            sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
            onClose={() => setRegSuccess(false)}
          >
            Thank you! You are now registered as an active voluntary blood donor. Patients in need can reach out to you directly.
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2.5,
          }}
        >
          {/* Active Donors */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3.5,
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 35px rgba(225, 29, 72, 0.12)', borderColor: '#FDA4AF' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2.5,
                  bgcolor: '#FFE4E6',
                  color: '#E11D48',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <WaterDrop sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active Donors
                </Typography>
                <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>
                  {totalDonorsCount || 1000}+
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              ● Ready for immediate call
            </Typography>
          </Paper>

          {/* Active Requests */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3.5,
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 35px rgba(245, 158, 11, 0.12)', borderColor: '#FDE68A' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2.5,
                  bgcolor: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Emergency sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Urgent Requests
                </Typography>
                <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>
                  {requestsData?.count || 0}
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              ● Critical hospital alerts
            </Typography>
          </Paper>

          {/* Compatibility Match */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3.5,
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 35px rgba(13, 148, 136, 0.12)', borderColor: '#99F6E4' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2.5,
                  bgcolor: '#CCFBF1',
                  color: '#0D9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Verified sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Verification
                </Typography>
                <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>
                  100%
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: '#0D9488', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              ● Verified contact details
            </Typography>
          </Paper>

          {/* Emergency Radius */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3.5,
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 35px rgba(124, 58, 237, 0.12)', borderColor: '#DDD6FE' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2.5,
                  bgcolor: '#EDE9FE',
                  color: '#7C3AED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HealthAndSafety sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Search Radius
                </Typography>
                <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>
                  {radius} km
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: '#7C3AED', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              ● Proximity GPS matched
            </Typography>
          </Paper>
        </Box>

        {/* ─── Interactive Compatibility Matrix Explorer ──────────────── */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            my: 5,
            borderRadius: 3.5,
            bgcolor: 'white',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoOutlined sx={{ color: '#E11D48' }} /> Blood Compatibility Matrix
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.875rem' }}>
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
                    transition: 'all 0.15s ease',
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
              <Box sx={{ p: 2.5, bgcolor: '#FFF1F2', borderRadius: 3, border: '1px solid #FFE4E6' }}>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#9F1239', mb: 1.5, letterSpacing: '0.04em' }}>
                  CAN DONATE BLOOD TO:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {compatInfo.canDonateTo.map((g) => (
                    <Chip key={g} label={g} color="error" sx={{ fontWeight: 800, borderRadius: 2 }} />
                  ))}
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ p: 2.5, bgcolor: '#F0FDF4', borderRadius: 3, border: '1px solid #DCFCE7' }}>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#166534', mb: 1.5, letterSpacing: '0.04em' }}>
                  CAN RECEIVE BLOOD FROM:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {compatInfo.canReceiveFrom.map((g) => (
                    <Chip key={g} label={g} color="success" sx={{ fontWeight: 800, borderRadius: 2 }} />
                  ))}
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Typography sx={{ fontSize: '0.8125rem', color: '#64748B', fontStyle: 'italic', lineHeight: 1.5 }}>
                {compatInfo.notes}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* ─── Directory Filters & Controls ─────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 4,
            borderRadius: 3.5,
            bgcolor: 'white',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          }}
        >
          {/* Top row: Title and Search input */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                Verified Voluntary Donors Directory
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8125rem' }}>
                Showing {filteredDonors.length} of {totalDonorsCount} registered donors ready for immediate contact
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Keyword Search */}
              <TextField
                size="small"
                placeholder="Search donor name or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <Search sx={{ fontSize: 18, color: '#94A3B8', mr: 1 }} />,
                  },
                }}
                sx={{ width: { xs: '100%', sm: 220 }, bgcolor: '#F8FAFC', borderRadius: 2 }}
              />

              {/* Radius Filter */}
              <TextField
                size="small"
                type="number"
                label="Radius (km)"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                sx={{ width: 110, bgcolor: '#F8FAFC', borderRadius: 2 }}
              />

              {/* View Mode Toggle */}
              <Box sx={{ display: 'flex', border: '1px solid #CBD5E1', borderRadius: 2, p: 0.3, bgcolor: '#F8FAFC' }}>
                <IconButton size="small" color={viewMode === 'grid' ? 'error' : 'default'} onClick={() => setViewMode('grid')}>
                  <ViewModule fontSize="small" />
                </IconButton>
                <IconButton size="small" color={viewMode === 'list' ? 'error' : 'default'} onClick={() => setViewMode('list')}>
                  <ViewList fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* Bottom row: Quick Blood Group Chips Filter */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pt: 1, borderTop: '1px solid #F1F5F9' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', alignSelf: 'center', mr: 1 }}>
              FILTER BY BLOOD:
            </Typography>
            {BLOOD_GROUPS.map((bg) => {
              const isSelected = (bloodGroup === '' && bg === 'All') || bloodGroup === bg
              return (
                <Chip
                  key={bg}
                  label={bg === 'All' ? 'All Donors' : bg}
                  clickable
                  onClick={() => setBloodGroup(bg === 'All' ? '' : bg)}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    borderRadius: 2,
                    bgcolor: isSelected ? '#E11D48' : '#F1F5F9',
                    color: isSelected ? 'white' : '#475569',
                    '&:hover': {
                      bgcolor: isSelected ? '#BE123C' : '#E2E8F0',
                    },
                  }}
                />
              )
            })}
          </Box>
        </Paper>

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

        {/* ─── Donors Card / List View ──────────────────────────────────── */}
        {donorsData && (
          <>
            {viewMode === 'grid' ? (
              <Grid container spacing={2.5}>
                {filteredDonors.map((donor: any) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={donor.id}>
                    <Card
                      sx={{
                        borderRadius: 3.5,
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                        bgcolor: 'white',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 10px 25px rgba(225, 29, 72, 0.1)',
                          borderColor: '#FDA4AF',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        {/* Top Header with Avatar & Availability */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Avatar
                            sx={{
                              width: 52,
                              height: 52,
                              bgcolor: '#FFF1F2',
                              color: '#E11D48',
                              fontSize: 18,
                              fontWeight: 900,
                              border: '2px solid #FDA4AF',
                            }}
                          >
                            {donor.blood_group}
                          </Avatar>
                          <Chip
                            label={donor.is_available ? 'Available' : 'Cooldown'}
                            size="small"
                            sx={{
                              bgcolor: donor.is_available ? '#F0FDF4' : '#F1F5F9',
                              color: donor.is_available ? '#166534' : '#64748B',
                              fontWeight: 700,
                              fontSize: 11,
                              border: donor.is_available ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                              borderRadius: 2,
                            }}
                          />
                        </Box>

                        {/* Donor Info */}
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
                          {donor.full_name || 'Verified Donor'}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B', mb: 1.5 }}>
                          <LocationOn sx={{ fontSize: 16, color: '#E11D48' }} />
                          <Typography variant="caption" sx={{ fontWeight: 500 }}>
                            {donor.address || 'Dhaka'} {donor.distance_km ? `· ${donor.distance_km} km away` : ''}
                          </Typography>
                        </Box>

                        {/* Badges: Total donations & verification */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <Chip
                            icon={<WaterDrop sx={{ fontSize: '13px !important', color: '#E11D48' }} />}
                            label={`${donor.total_donations || 1} Donations`}
                            size="small"
                            sx={{ bgcolor: '#FFF1F2', color: '#9F1239', fontWeight: 600, fontSize: 11 }}
                          />
                          <Chip
                            icon={<Verified sx={{ fontSize: '13px !important', color: '#0D9488' }} />}
                            label="Verified"
                            size="small"
                            sx={{ bgcolor: '#F0FDFA', color: '#0F766E', fontWeight: 600, fontSize: 11 }}
                          />
                        </Box>

                        <Divider sx={{ my: 1.5 }} />

                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Button
                            fullWidth
                            variant="contained"
                            component="a"
                            href={`tel:${donor.phone}`}
                            startIcon={<Phone sx={{ fontSize: 16 }} />}
                            sx={{
                              bgcolor: '#E11D48',
                              color: 'white',
                              fontWeight: 800,
                              fontSize: '0.8125rem',
                              textTransform: 'none',
                              borderRadius: 2,
                              py: 0.8,
                              boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)',
                              '&:hover': { bgcolor: '#BE123C' },
                            }}
                          >
                            Call Donor
                          </Button>

                          <Tooltip title={copiedPhoneId === donor.id ? 'Copied!' : 'Copy phone number'}>
                            <IconButton
                              onClick={() => copyPhoneNumber(donor.id, donor.phone)}
                              sx={{
                                border: '1px solid #E2E8F0',
                                borderRadius: 2,
                                color: copiedPhoneId === donor.id ? '#10B981' : '#64748B',
                                '&:hover': { bgcolor: '#F8FAFC', color: '#0F172A' },
                              }}
                            >
                              {copiedPhoneId === donor.id ? <Check sx={{ fontSize: 18 }} /> : <ContentCopy sx={{ fontSize: 18 }} />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              /* List / Table View */
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {filteredDonors.map((donor: any) => (
                  <Paper
                    key={donor.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 2,
                      transition: 'all 0.15s ease',
                      '&:hover': { borderColor: '#FDA4AF', bgcolor: '#FFFBFB' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 46,
                          height: 46,
                          bgcolor: '#FFF1F2',
                          color: '#E11D48',
                          fontWeight: 900,
                          fontSize: 16,
                          border: '2px solid #FDA4AF',
                        }}
                      >
                        {donor.blood_group}
                      </Avatar>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            {donor.full_name}
                          </Typography>
                          <Chip
                            label={donor.is_available ? 'Available' : 'Cooldown'}
                            size="small"
                            sx={{
                              fontSize: 10,
                              height: 20,
                              fontWeight: 700,
                              bgcolor: donor.is_available ? '#F0FDF4' : '#F1F5F9',
                              color: donor.is_available ? '#166534' : '#64748B',
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          📍 {donor.address || 'Dhaka'} {donor.distance_km ? `· ${donor.distance_km} km` : ''} · 🩸 {donor.total_donations || 1} donations
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        variant="contained"
                        component="a"
                        href={`tel:${donor.phone}`}
                        startIcon={<Phone sx={{ fontSize: 15 }} />}
                        size="small"
                        sx={{
                          bgcolor: '#E11D48',
                          textTransform: 'none',
                          fontWeight: 700,
                          borderRadius: 2,
                          px: 2,
                          '&:hover': { bgcolor: '#BE123C' },
                        }}
                      >
                        Call ({donor.phone})
                      </Button>
                      <Tooltip title={copiedPhoneId === donor.id ? 'Copied!' : 'Copy'}>
                        <IconButton
                          size="small"
                          onClick={() => copyPhoneNumber(donor.id, donor.phone)}
                          sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}
                        >
                          {copiedPhoneId === donor.id ? <Check sx={{ fontSize: 16, color: '#10B981' }} /> : <ContentCopy sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}

            {/* Load More Pagination */}
            {hasNextPage && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <Button
                  variant="outlined"
                  size="large"
                  disabled={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                  sx={{
                    px: 5,
                    py: 1.2,
                    borderRadius: 3,
                    borderColor: '#CBD5E1',
                    color: '#0F172A',
                    fontWeight: 700,
                    textTransform: 'none',
                    bgcolor: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    '&:hover': { borderColor: '#E11D48', color: '#E11D48', bgcolor: '#FFF1F2' },
                  }}
                >
                  {isFetchingNextPage ? <CircularProgress size={20} color="error" /> : 'Load More Donors'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Container>

      {/* ─── Donor Registration Modal ─────────────────────────────────── */}
      <Dialog
        open={openRegisterModal}
        onClose={() => setOpenRegisterModal(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3.5, p: 1 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Register as Voluntary Blood Donor</span>
          <IconButton size="small" onClick={() => setOpenRegisterModal(false)}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: '#F1F5F9' }}>
          {regError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {regError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleRegisterSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Full Name"
              required
              fullWidth
              value={donorFullName}
              onChange={(e) => setDonorFullName(e.target.value)}
              placeholder="e.g. Dr. Tanvir Ahmed"
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Contact Phone Number"
                  required
                  fullWidth
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Blood Group"
                  required
                  fullWidth
                  value={donorGroup}
                  onChange={(e) => setDonorGroup(e.target.value)}
                  slotProps={{ select: { native: true } }}
                >
                  {BLOOD_GROUPS.filter((g) => g !== 'All').map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <TextField
              label="Area / Detailed Address"
              fullWidth
              value={donorAddress}
              onChange={(e) => setDonorAddress(e.target.value)}
              placeholder="e.g. Road 11, Dhanmondi, Dhaka"
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block' }}>
                  GPS Coordinates for Proximity Match
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  {donorLat}, {donorLng}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<MyLocation />}
                onClick={handleDetectLocation}
                disabled={locating}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                {locating ? 'Detecting...' : 'Auto Detect'}
              </Button>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Last Donated Date"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={lastDonatedAt}
                  onChange={(e) => setLastDonatedAt(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Total Past Donations"
                  type="number"
                  fullWidth
                  value={totalDonations}
                  onChange={(e) => setTotalDonations(Number(e.target.value))}
                />
              </Grid>
            </Grid>

            <FormControlLabel
              control={<Checkbox checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} color="error" />}
              label="I am currently eligible and available to donate blood immediately."
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenRegisterModal(false)} sx={{ textTransform: 'none', color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRegisterSubmit}
            disabled={registerMutation.isPending}
            sx={{
              bgcolor: '#E11D48',
              color: 'white',
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              '&:hover': { bgcolor: '#BE123C' },
            }}
          >
            {registerMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Confirm Registration'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  )
}
