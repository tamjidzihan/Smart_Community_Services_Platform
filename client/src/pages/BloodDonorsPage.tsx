/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import {
  Container, Typography, Box, Grid, Card, CardContent, TextField, Button, MenuItem,
  Chip, Avatar, Paper, CircularProgress, Alert, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControlLabel, Checkbox, Tooltip, IconButton
} from '@mui/material'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import FavoriteIcon from '@mui/icons-material/Favorite'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import ViewListIcon from '@mui/icons-material/ViewList'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bloodApi } from '../api/services'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const BLOOD_GROUPS = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function BloodDonorsPage() {
  const [bloodGroup, setBloodGroup] = useState('')
  const [radius, setRadius] = useState(50)

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

  const { data: donorsData, isLoading, error } = useQuery({
    queryKey: ['blood-donors', bloodGroup, radius],
    queryFn: async () => {
      const res = await bloodApi.searchDonors(bloodGroup === 'All' ? '' : bloodGroup, 23.8103, 90.4125, radius)
      return res.data
    },
  })

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
    }
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
    // Pre-fill user details if available
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

  return (
    <Box sx={{ minHeight: '100vh', py: 6, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'error.main', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <WaterDropIcon fontSize="large" /> Voluntary Blood Donors Network
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Find compatible voluntary blood donors near your location in real time or sign up to save lives.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<FavoriteIcon />}
              onClick={handleOpenRegister}
              sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 700 }}
            >
              Become a Blood Donor
            </Button>

            <Button
              variant="outlined"
              color="error"
              component={Link}
              to="/blood-request"
              sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 700 }}
            >
              Request Blood Urgently
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 0.5 }}>
            <Tooltip title="Grid View">
              <IconButton
                size="small"
                color={viewMode === 'grid' ? 'error' : 'inherit'}
                onClick={() => setViewMode('grid')}
              >
                <ViewModuleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="List View">
              <IconButton
                size="small"
                color={viewMode === 'list' ? 'error' : 'inherit'}
                onClick={() => setViewMode('list')}
              >
                <ViewListIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {regSuccess && (
          <Alert severity="success" sx={{ mb: 4 }} onClose={() => setRegSuccess(false)}>
            Thank you! You are now registered as an active voluntary blood donor. Patients in need can reach out to you directly.
          </Alert>
        )}

        {/* Filter Card */}
        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={3} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Required Blood Group"
                value={bloodGroup || 'All'}
                onChange={(e) => setBloodGroup(e.target.value === 'All' ? '' : e.target.value)}
              >
                {BLOOD_GROUPS.map((bg) => (
                  <MenuItem key={bg} value={bg}>
                    {bg === 'All' ? 'All Blood Groups (Show All Donors)' : `${bg} (Includes compatible types)`}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Search Radius (km)"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Live Emergency Requests Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <span style={{ height: 10, width: 10, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            Live Emergency Requests ({requestsData?.count || 0})
            <style>
              {`
                @keyframes pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: .5; }
                }
              `}
            </style>
          </Typography>

          {isLoadingRequests ? (
            <CircularProgress size={32} color="error" />
          ) : (
            <Grid container spacing={2}>
              {requestsData?.results.map((req: any) => {
                const isOwner = user?.id === req.requester
                return (
                  <Grid size={{ xs: 12, md: 6 }} key={req.id}>
                    <Card sx={{ borderRadius: 3, borderLeft: '4px solid', borderColor: req.urgency === 'critical' ? 'error.main' : 'warning.main', position: 'relative' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Avatar sx={{ bgcolor: 'error.light', color: 'error.main', fontWeight: 800 }}>{req.blood_group}</Avatar>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{req.units_needed} Unit(s) Needed</Typography>
                              <Typography variant="body2" color="text.secondary">Patient: {req.patient_name}</Typography>
                            </Box>
                          </Box>
                          <Chip label={req.urgency.toUpperCase()} color={req.urgency === 'critical' ? 'error' : 'warning'} size="small" />
                        </Box>
                        
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Hospital:</strong> {req.hospital_name || 'N/A'}
                        </Typography>
                        {req.notes && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {req.notes}
                          </Typography>
                        )}
                        
                        <Divider sx={{ my: 1.5 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Requested by {req.requester_name} • {new Date(req.created_at).toLocaleDateString()}
                          </Typography>
                          
                          {isOwner && (
                            <Button 
                              variant="contained" 
                              color="success" 
                              size="small"
                              disabled={resolveRequestMutation.isPending}
                              onClick={() => resolveRequestMutation.mutate(req.id)}
                            >
                              Mark as Solved
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
                  <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: 'transparent', border: '1px dashed', borderColor: 'divider' }}>
                    <Typography color="text.secondary">No active blood requests in your area right now.</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </Box>

        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Available Donors ({donorsData?.count || 0})
          </Typography>
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} color="error" />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            Error fetching blood donors. Please try again.
          </Alert>
        )}

        {donorsData && (
          viewMode === 'grid' ? (
            <Grid container spacing={3}>
              {donorsData.results.map((donor) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={donor.id}>
                  <Card sx={{ borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4 } }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'error.main', fontSize: 24, fontWeight: 800 }}>
                        {donor.blood_group}
                      </Avatar>

                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {donor.full_name || 'Anonymous Donor'}
                      </Typography>

                      <Chip
                        label={donor.is_available ? 'Available Now' : 'Recently Donated'}
                        color={donor.is_available ? 'success' : 'default'}
                        size="small"
                        sx={{ my: 1 }}
                      />

                      <Divider sx={{ my: 1.5 }} />

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {donor.phone || '+8801700000000'}
                        </Typography>
                      </Box>

                      {donor.distance_km != null && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <LocationOnIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {donor.distance_km} km away
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}

              {donorsData.results.length === 0 && !isLoading && (
                <Grid size={{ xs: 12 }}>
                  <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                    <Typography variant="h6" color="text.secondary">
                      No active blood donors found for group {bloodGroup} within {radius} km.
                    </Typography>
                    <Button variant="outlined" color="error" component={Link} to="/blood-request" sx={{ mt: 2 }}>
                      Post an Emergency Blood Request
                    </Button>
                  </Paper>
                </Grid>
              )}
            </Grid>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {donorsData.results.map((donor) => (
                <Card key={donor.id} sx={{ borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4 } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                      <Avatar sx={{ width: 60, height: 60, bgcolor: 'error.main', fontSize: 22, fontWeight: 800, flexShrink: 0 }}>
                        {donor.blood_group}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {donor.full_name || 'Anonymous Donor'}
                          </Typography>
                          <Chip
                            label={donor.is_available ? 'Available Now' : 'Recently Donated'}
                            color={donor.is_available ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {donor.phone || '+8801700000000'}
                            </Typography>
                          </Box>
                          {donor.distance_km != null && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationOnIcon fontSize="small" color="action" />
                              <Typography variant="caption" color="text.secondary">
                                {donor.distance_km} km away
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
              {donorsData.results.length === 0 && !isLoading && (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                  <Typography variant="h6" color="text.secondary">
                    No active blood donors found for group {bloodGroup} within {radius} km.
                  </Typography>
                  <Button variant="outlined" color="error" component={Link} to="/blood-request" sx={{ mt: 2 }}>
                    Post an Emergency Blood Request
                  </Button>
                </Paper>
              )}
            </Box>
          )
        )}

        {/* DETAILED DONOR REGISTRATION DIALOG */}
        <Dialog open={openRegisterModal} onClose={() => setOpenRegisterModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>
            Register as a Voluntary Blood Donor
          </DialogTitle>
          <form onSubmit={handleRegisterSubmit}>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {regError && <Alert severity="error">{regError}</Alert>}

              <Typography variant="body2" color="text.secondary">
                Your donor profile will help patients and emergency responders locate you when urgent blood transfusions are required.
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
                    label="Contact Phone Number"
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
                      <MenuItem key={bg} value={bg}>{bg}</MenuItem>
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
                    label="City / Area Address"
                    placeholder="e.g. Dhanmondi, Dhaka"
                    value={donorAddress}
                    onChange={(e) => setDonorAddress(e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Last Donated Date"
                    slotProps={{
                      htmlInput: { max: new Date().toISOString().split('T')[0] },
                      inputLabel: { shrink: true }
                    }}
                    value={lastDonatedAt}
                    onChange={(e) => setLastDonatedAt(e.target.value)}
                    helperText="Leave blank if first time donor"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<MyLocationIcon />}
                    onClick={handleDetectLocation}
                    disabled={locating}
                    sx={{ height: 56 }}
                  >
                    {locating ? 'Locating...' : 'Detect GPS Location'}
                  </Button>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Latitude"
                    value={donorLat}
                    onChange={(e) => setDonorLat(Number(e.target.value))}
                  />
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Longitude"
                    value={donorLng}
                    onChange={(e) => setDonorLng(Number(e.target.value))}
                  />
                </Grid>
              </Grid>

              <FormControlLabel
                control={<Checkbox checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} color="error" />}
                label="Available to donate blood immediately"
              />
            </DialogContent>

            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setOpenRegisterModal(false)} color="inherit">Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                color="error"
                disabled={registerMutation.isPending}
                sx={{ fontWeight: 700, px: 3 }}
              >
                {registerMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Register as Donor'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </Box>
  )
}
