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
  IconButton,
  Stack,
  Tooltip,
  InputAdornment,
  Tabs,
  Tab,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import {
  Emergency,
  WaterDrop,
  Phone,
  LocationOn,
  Search,
  Add,
  CheckCircle,
  ContentCopy,
  Check,
  Close,
  AccessTime,
  Person,
  VolunteerActivism,
  LocalHospital,
  WarningAmber,
  MyLocation,
  DoneAll,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bloodApi } from '../api/services'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { BloodRequest, BloodGroup } from '../types'

const BLOOD_GROUPS = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const URGENCY_LEVELS = [
  { value: 'all', label: 'All Urgencies' },
  { value: 'critical', label: 'Critical / Immediate' },
  { value: 'high', label: 'High Priority' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Standard / Scheduled' },
]

function formatRelativeTime(dateString: string) {
  if (!dateString) return 'Recently'
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function BloodRequestPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // ─── Filter & Search State ──────────────────────────────────────────
  const [selectedGroup, setSelectedGroup] = useState('All')
  const [selectedUrgency, setSelectedUrgency] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [subTab, setSubTab] = useState(0) // 0: Live Requests, 1: My Requests

  // ─── Post Request Modal State ───────────────────────────────────────
  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [patientName, setPatientName] = useState('')
  const [reqBloodGroup, setReqBloodGroup] = useState<BloodGroup>('O+')
  const [unitsNeeded, setUnitsNeeded] = useState(1)
  const [hospitalName, setHospitalName] = useState('')
  const [reqUrgency, setReqUrgency] = useState<'low' | 'medium' | 'high' | 'critical'>('high')
  const [reqNotes, setReqNotes] = useState('')
  const [reqLat, setReqLat] = useState(23.8103)
  const [reqLng, setReqLng] = useState(90.4125)
  const [locating, setLocating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState(false)

  // ─── Assist / Donate Modal State ────────────────────────────────────
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null)
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null)

  // ─── Queries ────────────────────────────────────────────────────────
  const { data: activeRequestsData, isLoading: loadingActive } = useQuery({
    queryKey: ['active-blood-requests', selectedGroup],
    queryFn: async () => {
      const res = await bloodApi.getActiveRequests(selectedGroup === 'All' ? undefined : selectedGroup)
      return res.data
    },
  })

  const { data: myRequestsData, isLoading: loadingMyRequests } = useQuery({
    queryKey: ['my-blood-requests'],
    queryFn: async () => {
      const res = await bloodApi.getMyRequests()
      return res.data
    },
  })

  const allActiveRequests: BloodRequest[] = activeRequestsData?.results || []
  const myRequests: BloodRequest[] = myRequestsData?.results || []

  // ─── Metrics ────────────────────────────────────────────────────────
  const criticalCount = allActiveRequests.filter((r) => r.urgency === 'critical').length
  const totalUnitsNeeded = allActiveRequests.reduce((acc, curr) => acc + (curr.units_needed || 1), 0)
  const fulfilledCount = myRequests.filter((r) => r.status === 'fulfilled').length

  // ─── Filtered List ──────────────────────────────────────────────────
  const currentList = subTab === 0 ? allActiveRequests : myRequests
  const filteredRequests = currentList.filter((req) => {
    // Blood group filter (if on subTab 1 or selected)
    if (selectedGroup !== 'All' && req.blood_group !== selectedGroup) return false
    // Urgency filter
    if (selectedUrgency !== 'all' && req.urgency !== selectedUrgency) return false
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchPatient = req.patient_name?.toLowerCase().includes(q)
      const matchHospital = req.hospital_name?.toLowerCase().includes(q)
      const matchNotes = req.notes?.toLowerCase().includes(q)
      const matchRequester = req.requester_name?.toLowerCase().includes(q)
      if (!matchPatient && !matchHospital && !matchNotes && !matchRequester) return false
    }
    return true
  })

  // ─── Mutations ──────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: Partial<BloodRequest>) => bloodApi.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-blood-requests'] })
      queryClient.invalidateQueries({ queryKey: ['my-blood-requests'] })
      setOpenCreateModal(false)
      setCreateSuccess(true)
      // Reset form
      setPatientName('')
      setUnitsNeeded(1)
      setHospitalName('')
      setReqNotes('')
      setReqUrgency('high')
    },
    onError: (err: any) => {
      setCreateError(err?.response?.data?.detail || err?.response?.data?.error || 'Failed to submit blood request.')
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => bloodApi.updateRequestStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-blood-requests'] })
      queryClient.invalidateQueries({ queryKey: ['my-blood-requests'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to update request status.')
    },
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    if (!patientName.trim()) {
      setCreateError('Please specify the patient name.')
      return
    }
    if (!hospitalName.trim()) {
      setCreateError('Please specify the hospital or clinic name.')
      return
    }

    createMutation.mutate({
      patient_name: patientName.trim(),
      blood_group: reqBloodGroup,
      units_needed: unitsNeeded,
      hospital_name: hospitalName.trim(),
      urgency: reqUrgency,
      notes: reqNotes.trim(),
      latitude: reqLat,
      longitude: reqLng,
    })
  }

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLocating(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setReqLat(pos.coords.latitude)
          setReqLng(pos.coords.longitude)
          setLocating(false)
        },
        () => {
          setLocating(false)
        }
      )
    }
  }

  const copyPhoneNumber = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone)
    setCopiedPhoneId(id)
    setTimeout(() => setCopiedPhoneId(null), 2000)
  }

  const getUrgencyChip = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return (
          <Chip
            icon={<WarningAmber sx={{ fontSize: '14px !important', color: '#FFFFFF !important' }} />}
            label="CRITICAL EMERGENCY"
            size="small"
            sx={{
              bgcolor: '#BE123C',
              color: 'white',
              fontWeight: 800,
              fontSize: '0.6875rem',
              letterSpacing: '0.04em',
              animation: 'pulse 1.8s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.75 },
                '100%': { opacity: 1 },
              },
            }}
          />
        )
      case 'high':
        return (
          <Chip
            label="HIGH PRIORITY"
            size="small"
            sx={{
              bgcolor: '#EA580C',
              color: 'white',
              fontWeight: 800,
              fontSize: '0.6875rem',
            }}
          />
        )
      case 'medium':
        return (
          <Chip
            label="MEDIUM"
            size="small"
            sx={{
              bgcolor: '#0284C7',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.6875rem',
            }}
          />
        )
      default:
        return (
          <Chip
            label="STANDARD"
            size="small"
            sx={{
              bgcolor: '#64748B',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.6875rem',
            }}
          />
        )
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 12 }}>
      {/* ─── Hero Section ──────────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: '#0F172A',
          color: 'white',
          pt: { xs: 4, md: 5 },
          pb: { xs: 8, md: 10 },
          px: { xs: 2, sm: 4 },
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at 85% 15%, rgba(225, 29, 72, 0.25) 0%, #0F172A 70%)',
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
              component={Link}
              to="/blood-donors"
              size="small"
              startIcon={<VolunteerActivism sx={{ fontSize: 16 }} />}
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
              Voluntary Donors
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Emergency sx={{ fontSize: 16 }} />}
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
              Emergency Requests
            </Button>
          </Box>

          <Box sx={{ maxWidth: 820 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '1.8rem', sm: '2.5rem' },
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                mb: 2,
              }}
            >
              Emergency Blood Requests.{' '}
              <span style={{ color: '#FB7185' }}>Respond & Save Lives.</span>
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
              Real-time critical blood requirements across accredited hospitals and clinics. Respond instantly or broadcast an urgent patient requirement to the voluntary donor network.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Add />}
                onClick={() => setOpenCreateModal(true)}
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
                Post Emergency Blood Request
              </Button>

              <Button
                variant="outlined"
                size="large"
                component={Link}
                to="/blood-donors"
                startIcon={<VolunteerActivism />}
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
                Find Voluntary Donors
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* ─── Metric Highlights ────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 10, mt: { xs: 3, md: -6 }, mb: 5 }}>
        {createSuccess && (
          <Alert
            severity="success"
            sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
            onClose={() => setCreateSuccess(false)}
          >
            Emergency blood request successfully broadcasted! Nearby compatible donors and administrators have been alerted.
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2.5,
          }}
        >
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
                <Emergency sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active Requests
                </Typography>
                <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>
                  {allActiveRequests.length}
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: '#E11D48', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              ● Awaiting donor response
            </Typography>
          </Paper>

          {/* Critical Urgency */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3.5,
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 35px rgba(234, 88, 12, 0.12)', borderColor: '#FDBA74' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2.5,
                  bgcolor: '#FFEDD5',
                  color: '#EA580C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <WarningAmber sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Critical Priority
                </Typography>
                <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>
                  {criticalCount}
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: '#EA580C', fontWeight: 600 }}>
              Immediate transfusion needed
            </Typography>
          </Paper>

          {/* Units Required */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3.5,
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 35px rgba(2, 132, 199, 0.12)', borderColor: '#BAE6FD' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2.5,
                  bgcolor: '#E0F2FE',
                  color: '#0284C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <WaterDrop sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Units Required
                </Typography>
                <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>
                  {totalUnitsNeeded} Bags
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 600 }}>
              Across community hospitals
            </Typography>
          </Paper>

          {/* Fulfilled Requests */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3.5,
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 35px rgba(16, 185, 129, 0.12)', borderColor: '#A7F3D0' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2.5,
                  bgcolor: '#D1FAE5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DoneAll sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Resolved / Safe
                </Typography>
                <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>
                  {fulfilledCount || 45}+
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
              Lives saved by donors
            </Typography>
          </Paper>
        </Box>
      </Container>

      {/* ─── Main Content & Filters ───────────────────────────────────── */}
      <Container maxWidth="lg">
        {/* Sub-Tabs: Live Requests vs My Requests */}
        <Box sx={{ borderBottom: '1px solid #E2E8F0', mb: 3 }}>
          <Tabs
            value={subTab}
            onChange={(_, val) => setSubTab(val)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.9375rem',
                minHeight: 48,
                color: '#64748B',
                '&.Mui-selected': { color: '#E11D48' },
              },
              '& .MuiTabs-indicator': { bgcolor: '#E11D48', height: 3, borderRadius: '3px 3px 0 0' },
            }}
          >
            <Tab
              icon={<Emergency sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={`All Live Emergency Requests (${allActiveRequests.length})`}
            />
            <Tab
              icon={<Person sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={`My Posted Requests (${myRequests.length})`}
            />
          </Tabs>
        </Box>

        {/* Filter Controls Card */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3.5,
            border: '1px solid #E2E8F0',
            bgcolor: 'white',
            mb: 4,
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
          }}
        >
          {/* Blood Group Pills */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <WaterDrop sx={{ fontSize: 16, color: '#E11D48' }} />
              Filter by Patient Blood Group:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {BLOOD_GROUPS.map((group) => {
                const isSelected = selectedGroup === group
                return (
                  <Chip
                    key={group}
                    label={group === 'All' ? 'ALL GROUPS' : group}
                    onClick={() => setSelectedGroup(group)}
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.8125rem',
                      px: 1,
                      py: 2,
                      borderRadius: 2.5,
                      cursor: 'pointer',
                      bgcolor: isSelected ? '#E11D48' : '#F1F5F9',
                      color: isSelected ? 'white' : '#475569',
                      border: '1px solid',
                      borderColor: isSelected ? '#E11D48' : '#E2E8F0',
                      '&:hover': {
                        bgcolor: isSelected ? '#BE123C' : '#E2E8F0',
                      },
                      transition: 'all 0.15s ease',
                    }}
                  />
                )
              })}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Search and Urgency Filter */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '7fr 5fr' }, gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by patient name, hospital, area, diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#94A3B8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                bgcolor: '#F8FAFC',
                borderRadius: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                },
              }}
            />

            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.875rem' }}>Filter by Urgency</InputLabel>
              <Select
                value={selectedUrgency}
                label="Filter by Urgency"
                onChange={(e) => setSelectedUrgency(e.target.value)}
                sx={{ borderRadius: 2.5, bgcolor: '#F8FAFC' }}
              >
                {URGENCY_LEVELS.map((u) => (
                  <MenuItem key={u.value} value={u.value}>
                    {u.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* ─── Requests List / Cards ──────────────────────────────────── */}
        {loadingActive && subTab === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#E11D48' }} />
          </Box>
        )}

        {loadingMyRequests && subTab === 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#E11D48' }} />
          </Box>
        )}

        {!loadingActive && !loadingMyRequests && (
          <>
            {filteredRequests.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 6,
                  textAlign: 'center',
                  borderRadius: 4,
                  bgcolor: 'white',
                  border: '1px solid #E2E8F0',
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: '#FFE4E6',
                    color: '#E11D48',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <Emergency sx={{ fontSize: 32 }} />
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.125rem', color: '#0F172A', mb: 1 }}>
                  {subTab === 0 ? 'No Active Emergency Requests Found' : 'You Haven’t Posted Any Requests Yet'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 450, mx: 'auto', mb: 3 }}>
                  {subTab === 0
                    ? 'No blood requests match your selected blood group and urgency criteria.'
                    : 'If someone is in critical need of blood, broadcast a new request to connect with donors immediately.'}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setOpenCreateModal(true)}
                  sx={{
                    bgcolor: '#E11D48',
                    color: 'white',
                    fontWeight: 700,
                    borderRadius: 2.5,
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#BE123C' },
                  }}
                >
                  Post Emergency Blood Request
                </Button>
              </Paper>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                  gap: 3,
                }}
              >
                {filteredRequests.map((req) => {
                  const isOwner = user?.id === req.requester
                  const isFulfilled = req.status === 'fulfilled'
                  const isCancelled = req.status === 'cancelled'

                  return (
                    <Card
                      key={req.id}
                      elevation={0}
                      sx={{
                        borderRadius: 3.5,
                        border: '1px solid',
                        borderColor: req.urgency === 'critical' ? '#FECDD3' : '#E2E8F0',
                        bgcolor: req.urgency === 'critical' ? '#FFF1F2' : 'white',
                        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
                          borderColor: '#FDA4AF',
                        },
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                      }}
                    >
                      <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Header: Urgency & Blood Group */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getUrgencyChip(req.urgency)}
                            {isFulfilled && (
                              <Chip
                                icon={<CheckCircle sx={{ fontSize: '14px !important', color: 'white !important' }} />}
                                label="FULFILLED"
                                size="small"
                                sx={{ bgcolor: '#059669', color: 'white', fontWeight: 800, fontSize: '0.6875rem' }}
                              />
                            )}
                          </Box>

                          {/* Blood Group Badge */}
                          <Box
                            sx={{
                              width: 46,
                              height: 46,
                              borderRadius: 3,
                              bgcolor: '#E11D48',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              fontSize: '1.125rem',
                              boxShadow: '0 4px 12px rgba(225, 29, 72, 0.35)',
                            }}
                          >
                            {req.blood_group}
                          </Box>
                        </Box>

                        {/* Patient & Hospital Info */}
                        <Box sx={{ mb: 2 }}>
                          <Typography sx={{ fontWeight: 800, fontSize: '1.125rem', color: '#0F172A', mb: 0.5 }}>
                            Patient: {req.patient_name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748B', fontSize: '0.875rem', mb: 0.5 }}>
                            <LocalHospital sx={{ fontSize: 16, color: '#0D9488' }} />
                            <span style={{ fontWeight: 600, color: '#334155' }}>{req.hospital_name || 'Designated Healthcare Facility'}</span>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748B', fontSize: '0.8125rem' }}>
                            <AccessTime sx={{ fontSize: 15, color: '#94A3B8' }} />
                            <span>Posted {formatRelativeTime(req.created_at)}</span>
                            <span style={{ margin: '0 4px' }}>•</span>
                            <span style={{ fontWeight: 700, color: '#E11D48' }}>{req.units_needed} Unit(s) Needed</span>
                          </Box>
                        </Box>

                        {/* Notes */}
                        {req.notes && (
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 2.5,
                              bgcolor: req.urgency === 'critical' ? 'rgba(255,255,255,0.7)' : '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              mb: 2,
                            }}
                          >
                            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8125rem', lineHeight: 1.5 }}>
                              💡 <strong>Note:</strong> {req.notes}
                            </Typography>
                          </Box>
                        )}

                        {/* Requester Profile */}
                        <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: req.urgency === 'critical' ? '#FECDD3' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 30, height: 30, bgcolor: '#0D9488', fontSize: '0.75rem', fontWeight: 700 }}>
                              {req.requester_name?.[0] || 'U'}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>
                                {req.requester_name || 'Family Representative'}
                              </Typography>
                              <Typography sx={{ fontSize: '0.6875rem', color: '#64748B' }}>
                                Requester
                              </Typography>
                            </Box>
                          </Box>

                          {/* Actions */}
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {req.requester_phone ? (
                              <>
                                <Button
                                  variant="contained"
                                  size="small"
                                  component="a"
                                  href={`tel:${req.requester_phone}`}
                                  startIcon={<Phone sx={{ fontSize: 16 }} />}
                                  sx={{
                                    bgcolor: '#E11D48',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    borderRadius: 2,
                                    px: 1.8,
                                    textTransform: 'none',
                                    '&:hover': { bgcolor: '#BE123C' },
                                  }}
                                >
                                  Call Now
                                </Button>
                                <Tooltip title="Copy Phone Number">
                                  <IconButton
                                    size="small"
                                    onClick={() => copyPhoneNumber(req.id, req.requester_phone || '')}
                                    sx={{ bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' } }}
                                  >
                                    {copiedPhoneId === req.id ? <Check sx={{ fontSize: 16, color: '#059669' }} /> : <ContentCopy sx={{ fontSize: 16, color: '#64748B' }} />}
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setSelectedRequest(req)}
                                startIcon={<VolunteerActivism sx={{ fontSize: 16 }} />}
                                sx={{
                                  borderColor: '#E11D48',
                                  color: '#E11D48',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  '&:hover': { bgcolor: '#FFE4E6', borderColor: '#E11D48' },
                                }}
                              >
                                I Can Donate
                              </Button>
                            )}

                            {/* Owner actions */}
                            {isOwner && !isFulfilled && !isCancelled && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'fulfilled' })}
                                sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
                              >
                                Mark Fulfilled
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  )
                })}
              </Box>
            )}
          </>
        )}
      </Container>

      {/* ─── Post Blood Request Modal ─────────────────────────────────── */}
      <Dialog
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 4, p: 1 },
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2.5,
                bgcolor: '#FFE4E6',
                color: '#E11D48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Emergency sx={{ fontSize: 20 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.25rem' }}>Post Emergency Blood Request</Typography>
          </Box>
          <IconButton onClick={() => setOpenCreateModal(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleCreateSubmit}>
          <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {createError && <Alert severity="error" sx={{ borderRadius: 2.5 }}>{createError}</Alert>}

            <TextField
              label="Patient Full Name *"
              fullWidth
              size="small"
              placeholder="e.g. Tanvir Ahmed"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              required
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Required Blood Group *</InputLabel>
                <Select
                  value={reqBloodGroup}
                  label="Required Blood Group *"
                  onChange={(e) => setReqBloodGroup(e.target.value as BloodGroup)}
                >
                  {BLOOD_GROUPS.filter((g) => g !== 'All').map((g) => (
                    <MenuItem key={g} value={g} sx={{ fontWeight: 700 }}>
                      {g}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Units (Bags) Needed *"
                type="number"
                fullWidth
                size="small"
                slotProps={{ htmlInput: { min: 1, max: 10 } }}
                value={unitsNeeded}
                onChange={(e) => setUnitsNeeded(Math.max(1, parseInt(e.target.value) || 1))}
                required
              />
            </Box>

            <TextField
              label="Hospital / Clinic Name & Area *"
              fullWidth
              size="small"
              placeholder="e.g. Dhaka Medical College Hospital, Ward 4"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              required
            />

            <FormControl fullWidth size="small">
              <InputLabel>Urgency Level *</InputLabel>
              <Select
                value={reqUrgency}
                label="Urgency Level *"
                onChange={(e) => setReqUrgency(e.target.value as any)}
              >
                <MenuItem value="critical" sx={{ color: '#BE123C', fontWeight: 700 }}>
                  🚨 Critical / Immediate (Emergency Transfusion)
                </MenuItem>
                <MenuItem value="high" sx={{ color: '#EA580C', fontWeight: 700 }}>
                  ⚠️ High Priority (Needed within 6-12 hours)
                </MenuItem>
                <MenuItem value="medium" sx={{ color: '#0284C7', fontWeight: 600 }}>
                  ℹ️ Medium (Needed tomorrow)
                </MenuItem>
                <MenuItem value="low" sx={{ color: '#64748B', fontWeight: 600 }}>
                  📅 Standard / Scheduled Surgery
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Additional Notes / Diagnosis / Contact Guidance"
              fullWidth
              multiline
              rows={3}
              placeholder="Provide clinical details, contact person phone if different, or critical timeline..."
              value={reqNotes}
              onChange={(e) => setReqNotes(e.target.value)}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#F8FAFC', p: 1.5, borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ color: '#E11D48', fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                  Coordinates: {reqLat.toFixed(4)}, {reqLng.toFixed(4)}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<MyLocation sx={{ fontSize: 14 }} />}
                onClick={handleGetLocation}
                disabled={locating}
                sx={{ fontSize: '0.75rem', textTransform: 'none', borderRadius: 2 }}
              >
                {locating ? 'Locating...' : 'Auto Detect GPS'}
              </Button>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, pt: 1 }}>
            <Button onClick={() => setOpenCreateModal(false)} sx={{ color: '#64748B', fontWeight: 600, textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending}
              sx={{
                bgcolor: '#E11D48',
                color: 'white',
                fontWeight: 700,
                borderRadius: 2.5,
                px: 3,
                textTransform: 'none',
                '&:hover': { bgcolor: '#BE123C' },
              }}
            >
              {createMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Broadcast Blood Request'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── I Can Donate Modal Dialog ───────────────────────────────── */}
      <Dialog
        open={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 4, p: 1 } },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VolunteerActivism sx={{ color: '#E11D48' }} />
            <Typography sx={{ fontWeight: 800 }}>Donate Blood for Patient</Typography>
          </Box>
          <IconButton onClick={() => setSelectedRequest(null)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedRequest && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ bgcolor: '#FFF1F2', p: 2, borderRadius: 3, border: '1px solid #FECDD3' }}>
                <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem', mb: 0.5 }}>
                  {selectedRequest.patient_name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#E11D48', fontWeight: 700 }}>
                  {selectedRequest.blood_group} • {selectedRequest.units_needed} Unit(s) Needed
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                  Hospital: {selectedRequest.hospital_name}
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
                Thank you for stepping up to help! You can reach the patient’s representative or coordinate with the hospital directly.
              </Typography>

              {selectedRequest.requester_phone && (
                <Button
                  variant="contained"
                  fullWidth
                  component="a"
                  href={`tel:${selectedRequest.requester_phone}`}
                  startIcon={<Phone />}
                  sx={{
                    bgcolor: '#E11D48',
                    color: 'white',
                    fontWeight: 800,
                    borderRadius: 2.5,
                    py: 1.2,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#BE123C' },
                  }}
                >
                  Call {selectedRequest.requester_name || 'Requester'} Now
                </Button>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}
