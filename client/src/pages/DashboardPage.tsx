/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  TextField,
  MenuItem,
  Grid,
} from '@mui/material'
import {
  LocalHospital,
  Bloodtype,
  EventNote,
  Person,
  AdminPanelSettings,
  MedicationLiquid,
  Search,
  Refresh,
  Launch,
  SmartToy,
  Schedule,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import {
  analyticsApi,
  adminApi,
  appointmentApi,
  bloodApi,
  doctorApi,
} from '../api/services'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { user, hasRole } = useAuthStore()
  const queryClient = useQueryClient()

  const isAdmin = hasRole('admin') || (user as any)?.role === 'admin'
  const isDoctor = hasRole('doctor') || (user as any)?.role === 'doctor'

  // Admin active sub-tab
  const [adminTab, setAdminTab] = useState<'overview' | 'users' | 'doctors' | 'blood'>('overview')
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('')

  // ─── ADMIN QUERIES ─────────────────────────────────────────────────────────
  const { data: analyticsData, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => (await analyticsApi.getPlatformStats()).data,
    enabled: isAdmin,
  })

  const { data: usersData, isLoading: loadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users-list', userSearch, userRoleFilter],
    queryFn: async () => {
      const res = await adminApi.listUsers({
        search: userSearch || undefined,
        role: userRoleFilter || undefined,
      })
      return res.data
    },
    enabled: isAdmin && adminTab === 'users',
  })

  const { data: adminDoctorsData, isLoading: loadingDoctors, refetch: refetchDoctors } = useQuery({
    queryKey: ['admin-doctors-list'],
    queryFn: async () => (await doctorApi.getDoctors()).data,
    enabled: isAdmin && adminTab === 'doctors',
  })

  const { data: adminBloodData, isLoading: loadingBlood, refetch: refetchBlood } = useQuery({
    queryKey: ['admin-blood-requests'],
    queryFn: async () => (await bloodApi.getActiveRequests()).data,
    enabled: isAdmin && adminTab === 'blood',
  })

  // ─── PATIENT / CITIZEN QUERIES ─────────────────────────────────────────────
  const { data: userAppointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: async () => (await appointmentApi.getAppointments()).data,
    enabled: !isAdmin,
  })

  const { data: myBloodRequests } = useQuery({
    queryKey: ['my-blood-requests'],
    queryFn: async () => (await bloodApi.getMyRequests()).data,
    enabled: !isAdmin,
  })

  // Blood resolve mutation
  const resolveBloodMutation = useMutation({
    mutationFn: (id: string) => bloodApi.updateRequestStatus(id, 'fulfilled'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blood-requests'] })
      queryClient.invalidateQueries({ queryKey: ['my-blood-requests'] })
    },
  })

  return (
    <Box sx={{ minHeight: '100vh', py: 5, bgcolor: '#F8FAFC' }}>
      <Container maxWidth="lg">
        {/* Welcome Header */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            border: '1px solid #E2E8F0',
            mb: 4,
            bgcolor: isAdmin ? '#0F172A' : '#0D9488',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                  Welcome back, {user?.profile?.full_name || user?.email?.split('@')[0] || 'User'}!
                </Typography>
                <Chip
                  label={isAdmin ? 'Administrator' : isDoctor ? 'Doctor / Specialist' : 'Patient'}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: 11,
                  }}
                />
              </Box>
              <Typography sx={{ opacity: 0.9, fontSize: { xs: 13, sm: 15 }, maxWidth: 650 }}>
                {isAdmin
                  ? 'Manage hospital directory, verify medical specialists, oversee patient appointments and blood network requests in one unified console.'
                  : isDoctor
                  ? 'Manage your daily consultation roster, view scheduled patient appointments, and update chamber availability.'
                  : 'Track your medical appointments, manage active blood requests, and access instant healthcare services.'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="contained"
                component={Link}
                to="/doctors"
                startIcon={<LocalHospital />}
                sx={{
                  bgcolor: 'white',
                  color: isAdmin ? '#0F172A' : '#0D9488',
                  fontWeight: 800,
                  borderRadius: 2.5,
                  px: 2.5,
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                  '&:hover': { bgcolor: '#F1F5F9' },
                }}
              >
                Find Doctors
              </Button>
              <Button
                variant="outlined"
                component={Link}
                to="/blood-donors"
                startIcon={<Bloodtype />}
                sx={{
                  borderColor: 'rgba(255,255,255,0.4)',
                  color: 'white',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  px: 2.5,
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'white' },
                }}
              >
                Blood Network
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* ═══════════════════════════════════════════════════════════════════════
            ADMIN INTEGRATED CONSOLE
        ═══════════════════════════════════════════════════════════════════════ */}
        {isAdmin && (
          <Box sx={{ mb: 6 }}>
            {/* Admin Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs
                value={adminTab}
                onChange={(_, val) => setAdminTab(val)}
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: 14,
                    minHeight: 48,
                  },
                }}
              >
                <Tab value="overview" label="Platform Metrics" icon={<AdminPanelSettings fontSize="small" />} iconPosition="start" />
                <Tab value="users" label="User Accounts" icon={<Person fontSize="small" />} iconPosition="start" />
                <Tab value="doctors" label="Doctor Verification" icon={<MedicationLiquid fontSize="small" />} iconPosition="start" />
                <Tab value="blood" label="Blood Requests Moderation" icon={<Bloodtype fontSize="small" />} iconPosition="start" />
              </Tabs>
            </Box>

            {/* TAB 1: OVERVIEW METRICS */}
            {adminTab === 'overview' && (
              <Box>
                {loadingAnalytics ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={36} color="primary" />
                  </Box>
                ) : (
                  <Box>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0', p: 1 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 700 }}>TOTAL USERS</Typography>
                              <Avatar sx={{ bgcolor: '#CCFBF1', color: '#0D9488', width: 36, height: 36 }}>
                                <Person fontSize="small" />
                              </Avatar>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
                              {analyticsData?.total_users || 0}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                              +{analyticsData?.users?.new_this_week || 0} new this week
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0', p: 1 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 700 }}>APPOINTMENTS</Typography>
                              <Avatar sx={{ bgcolor: '#E0E7FF', color: '#4F46E5', width: 36, height: 36 }}>
                                <EventNote fontSize="small" />
                              </Avatar>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
                              {analyticsData?.total_appointments || 0}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6366F1', fontWeight: 600 }}>
                              {analyticsData?.appointments?.pending || 0} scheduled
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0', p: 1 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 700 }}>VERIFIED DOCTORS</Typography>
                              <Avatar sx={{ bgcolor: '#DCFCE7', color: '#16A34A', width: 36, height: 36 }}>
                                <MedicationLiquid fontSize="small" />
                              </Avatar>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
                              {analyticsData?.total_doctors || analyticsData?.healthcare?.doctors_count || 0}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 600 }}>
                              Across all specialties
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0', p: 1 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 700 }}>BLOOD DONORS</Typography>
                              <Avatar sx={{ bgcolor: '#FFE4E6', color: '#E11D48', width: 36, height: 36 }}>
                                <Bloodtype fontSize="small" />
                              </Avatar>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
                              {analyticsData?.blood_requests?.total_donors || 0}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#E11D48', fontWeight: 600 }}>
                              {analyticsData?.blood_requests?.open || 0} open requests
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Recent Registrations Table */}
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: '#0F172A' }}>
                        Recent User Signups
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Registered On</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(analyticsData?.recent_users || []).map((u: any) => (
                              <TableRow key={u.id} hover>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#0D9488' }}>
                                      {(u.full_name || u.email || '?')[0].toUpperCase()}
                                    </Avatar>
                                    <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{u.full_name || '—'}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ fontSize: 13, color: '#64748B' }}>{u.email}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={(u.roles?.[0] || 'citizen').toUpperCase()}
                                    size="small"
                                    sx={{ fontWeight: 700, fontSize: 10 }}
                                  />
                                </TableCell>
                                <TableCell sx={{ fontSize: 12, color: '#64748B' }}>
                                  {new Date(u.date_joined).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label="Active"
                                    color="success"
                                    size="small"
                                    sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Box>
                )}
              </Box>
            )}

            {/* TAB 2: USER ACCOUNTS */}
            {adminTab === 'users' && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    User Accounts Directory
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      placeholder="Search name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      sx={{ minWidth: 220 }}
                      slotProps={{ input: { startAdornment: <Search fontSize="small" sx={{ color: '#94A3B8', mr: 1 }} /> } }}
                    />
                    <TextField
                      select
                      size="small"
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      sx={{ minWidth: 140 }}
                    >
                      <MenuItem value="">All Roles</MenuItem>
                      <MenuItem value="citizen">Citizens</MenuItem>
                      <MenuItem value="doctor">Doctors</MenuItem>
                      <MenuItem value="admin">Admins</MenuItem>
                    </TextField>
                    <IconButton onClick={() => refetchUsers()} size="small" sx={{ border: '1px solid #E2E8F0' }}>
                      <Refresh fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {loadingUsers ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Full Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Email Address</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Joined</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Verified</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(usersData?.results || []).map((u: any) => (
                          <TableRow key={u.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{u.profile?.full_name || u.full_name || '—'}</TableCell>
                            <TableCell sx={{ color: '#64748B' }}>{u.email}</TableCell>
                            <TableCell>
                              <Chip
                                label={(u.role || u.roles?.[0] || 'citizen').toUpperCase()}
                                size="small"
                                sx={{ fontWeight: 700, fontSize: 10 }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontSize: 12, color: '#64748B' }}>
                              {new Date(u.date_joined).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {u.is_email_verified ? (
                                <Chip label="Verified" color="success" size="small" sx={{ height: 20, fontSize: 10 }} />
                              ) : (
                                <Chip label="Unverified" size="small" sx={{ height: 20, fontSize: 10 }} />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            )}

            {/* TAB 3: DOCTORS DIRECTORY */}
            {adminTab === 'doctors' && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                      Registered Medical Doctors & Faculty
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active clinical consultants and hospital chambers
                    </Typography>
                  </Box>
                  <IconButton onClick={() => refetchDoctors()} size="small" sx={{ border: '1px solid #E2E8F0' }}>
                    <Refresh fontSize="small" />
                  </IconButton>
                </Box>

                {loadingDoctors ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Doctor Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Specialties</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Position / Degree</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Rating</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(adminDoctorsData?.results || (Array.isArray(adminDoctorsData) ? adminDoctorsData : [])).map((doc: any) => (
                          <TableRow key={doc.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar src={doc.image_url} sx={{ width: 32, height: 32, bgcolor: '#0D9488', fontSize: 12 }}>
                                  {doc.full_name?.[0] || 'D'}
                                </Avatar>
                                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{doc.full_name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {(doc.specialists || []).map((s: any) => (
                                  <Chip key={s.id} label={s.name} size="small" sx={{ fontSize: 10, height: 20 }} />
                                ))}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontSize: 12, color: '#64748B', maxWidth: 200 }}>
                              {doc.degree_summary || doc.current_position || '—'}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#D97706' }}>
                              ★ {doc.average_rating || '5.0'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={doc.is_active ? 'Active' : 'Inactive'}
                                color={doc.is_active ? 'success' : 'default'}
                                size="small"
                                sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton component={Link} to={`/doctors/${doc.id}`} size="small" color="primary">
                                <Launch fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            )}

            {/* TAB 4: BLOOD MODERATION */}
            {adminTab === 'blood' && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                      Blood Transfusion Requests Moderation
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active patient emergency transfusion broadcasts
                    </Typography>
                  </Box>
                  <IconButton onClick={() => refetchBlood()} size="small" sx={{ border: '1px solid #E2E8F0' }}>
                    <Refresh fontSize="small" />
                  </IconButton>
                </Box>

                {loadingBlood ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Group</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Units</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Patient Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Hospital</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Urgency</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(adminBloodData?.results || []).map((req: any) => (
                          <TableRow key={req.id} hover>
                            <TableCell>
                              <Avatar sx={{ bgcolor: '#FFE4E6', color: '#E11D48', width: 30, height: 30, fontSize: 12, fontWeight: 900 }}>
                                {req.blood_group}
                              </Avatar>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{req.units_needed} unit(s)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{req.patient_name}</TableCell>
                            <TableCell sx={{ color: '#64748B', fontSize: 13 }}>{req.hospital_name || '—'}</TableCell>
                            <TableCell>
                              <Chip
                                label={req.urgency.toUpperCase()}
                                color={req.urgency === 'critical' ? 'error' : 'warning'}
                                size="small"
                                sx={{ height: 20, fontSize: 10, fontWeight: 800 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip label={req.status} size="small" sx={{ height: 20, fontSize: 10 }} />
                            </TableCell>
                            <TableCell align="right">
                              {req.status !== 'fulfilled' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  disabled={resolveBloodMutation.isPending}
                                  onClick={() => resolveBloodMutation.mutate(req.id)}
                                  sx={{ textTransform: 'none', borderRadius: 2, fontSize: 11, fontWeight: 700 }}
                                >
                                  Resolve
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            )}
          </Box>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            PATIENT / CITIZEN & DOCTOR OVERVIEW
        ═══════════════════════════════════════════════════════════════════════ */}
        {!isAdmin && (
          <Box>
            {/* Quick Actions Bar */}
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 2 }}>
              Quick Healthcare Actions
            </Typography>

            <Grid container spacing={3} sx={{ mb: 5 }}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0', p: 1, transition: '0.2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 25px rgba(0,0,0,0.06)' } }}>
                  <CardContent>
                    <Avatar sx={{ bgcolor: '#CCFBF1', color: '#0D9488', width: 44, height: 44, mb: 1.5 }}>
                      <EventNote />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, color: '#0F172A' }}>
                      Book Consultation
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.5 }}>
                      Browse verified specialist doctors, inspect weekly clinic schedules, and reserve your chamber slot.
                    </Typography>
                    <Button fullWidth variant="contained" component={Link} to="/doctors" sx={{ bgcolor: '#0D9488', textTransform: 'none', borderRadius: 2, fontWeight: 700, '&:hover': { bgcolor: '#0F766E' } }}>
                      Find & Book Doctors
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0', p: 1, transition: '0.2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 25px rgba(0,0,0,0.06)' } }}>
                  <CardContent>
                    <Avatar sx={{ bgcolor: '#FFE4E6', color: '#E11D48', width: 44, height: 44, mb: 1.5 }}>
                      <Bloodtype />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, color: '#0F172A' }}>
                      Blood Donation Hub
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.5 }}>
                      Locate compatible blood donors in your radius or submit an emergency transfusion broadcast.
                    </Typography>
                    <Button fullWidth variant="contained" color="error" component={Link} to="/blood-donors" sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}>
                      Explore Blood Network
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0', p: 1, transition: '0.2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 25px rgba(0,0,0,0.06)' } }}>
                  <CardContent>
                    <Avatar sx={{ bgcolor: '#F0FDFA', color: '#0D9488', width: 44, height: 44, mb: 1.5, border: '1px solid #CCFBF1' }}>
                      <SmartToy />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, color: '#0F172A' }}>
                      AI Health Assistant
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.5 }}>
                      Chat with the AI health assistant to identify appropriate clinical departments and recommended specialists.
                    </Typography>
                    <Button fullWidth variant="outlined" component={Link} to="/ai-assistant" sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, borderColor: '#0D9488', color: '#0D9488' }}>
                      Ask AI Assistant
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Patient Appointments Table */}
            <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule sx={{ color: '#0D9488' }} /> My Scheduled Appointments
                </Typography>
                <Button component={Link} to="/appointments" size="small" sx={{ textTransform: 'none', fontWeight: 700, color: '#0D9488' }}>
                  View All
                </Button>
              </Box>

              {loadingAppointments ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={28} color="primary" />
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Doctor</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Hospital</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Scheduled At</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {((userAppointments as any)?.results || (Array.isArray(userAppointments) ? userAppointments : [])).slice(0, 5).map((appt: any) => (
                        <TableRow key={appt.id} hover>
                          <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>
                            {appt.doctor_name || 'Medical Doctor'}
                          </TableCell>
                          <TableCell sx={{ color: '#64748B' }}>
                            {appt.hospital_name || 'Hospital Chamber'}
                          </TableCell>
                          <TableCell sx={{ fontSize: 13 }}>
                            {new Date(appt.scheduled_at).toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ color: '#64748B', fontSize: 13 }}>
                            {appt.reason || 'General Consultation'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={appt.status}
                              color={appt.status === 'confirmed' ? 'success' : appt.status === 'cancelled' ? 'error' : 'primary'}
                              size="small"
                              sx={{ height: 22, fontSize: 10, fontWeight: 700 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}

                      {(!userAppointments || ((userAppointments as any)?.results?.length === 0 && (Array.isArray(userAppointments) ? userAppointments.length === 0 : true))) && (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                            No scheduled medical appointments found.{' '}
                            <Link to="/doctors" style={{ color: '#0D9488', fontWeight: 700 }}>
                              Book a consultation today.
                            </Link>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>

            {/* My Active Blood Requests */}
            {((myBloodRequests as any)?.results?.length > 0 || (Array.isArray(myBloodRequests) && myBloodRequests.length > 0)) && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Bloodtype sx={{ color: '#E11D48' }} /> My Posted Blood Requests
                </Typography>
                <Grid container spacing={2}>
                  {((myBloodRequests as any)?.results || (Array.isArray(myBloodRequests) ? myBloodRequests : [])).map((req: any) => (
                    <Grid size={{ xs: 12, md: 6 }} key={req.id}>
                      <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: '#FFE4E6', color: '#E11D48', fontWeight: 900, width: 36, height: 36 }}>
                              {req.blood_group}
                            </Avatar>
                            <Typography sx={{ fontWeight: 800 }}>{req.units_needed} Units Needed</Typography>
                          </Box>
                          <Chip label={req.status} size="small" color={req.status === 'fulfilled' ? 'success' : 'error'} />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Hospital: {req.hospital_name || 'N/A'} • Patient: {req.patient_name}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}
          </Box>
        )}
      </Container>
    </Box>
  )
}
