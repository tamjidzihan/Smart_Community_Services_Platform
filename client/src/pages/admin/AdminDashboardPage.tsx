import { useState } from 'react'
import {
  Container, Typography, Box, Grid, Card, CardContent, Button, Alert,
  CircularProgress, Avatar, Chip, Divider, Tooltip as MuiTooltip, LinearProgress,
} from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import PeopleIcon from '@mui/icons-material/People'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import BloodtypeIcon from '@mui/icons-material/Bloodtype'
import EmergencyShareIcon from '@mui/icons-material/EmergencyShare'
import TodayIcon from '@mui/icons-material/Today'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import AssignmentIcon from '@mui/icons-material/Assignment'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../../api/services'
import { Link } from 'react-router-dom'
import AdminAddEntityModal from '../../components/admin/AdminAddEntityModal'

// ─── Stat Card ───────────────────────────────────────────────────────────────
function KPICard({
  icon, label, value, sub, color, trend, trendLabel,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  sub?: string
  color: string
  trend?: number
  trendLabel?: string
}) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          bgcolor: color,
        }}
      />
      <CardContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {label}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color, lineHeight: 1.2, my: 0.5 }}>
              {value}
            </Typography>
            {sub && (
              <Typography variant="caption" color="text.secondary">{sub}</Typography>
            )}
          </Box>
          <Box sx={{
            width: 52, height: 52, borderRadius: 2,
            bgcolor: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}>
            {icon}
          </Box>
        </Box>
        {trend !== undefined && (
          <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrendingUpIcon sx={{ fontSize: 14, color: 'success.main' }} />
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
              +{trend} {trendLabel}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Quick Stat Row ───────────────────────────────────────────────────────────
function QuickStatRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>{value}</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(pct, 100)}
        sx={{
          height: 6, borderRadius: 3,
          bgcolor: `${color}22`,
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
        }}
      />
    </Box>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [openAddModal, setOpenAddModal] = useState(false)

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => analyticsApi.getDashboard(),
    refetchInterval: 60_000,
  })

  const d = res?.data as any

  return (
    <Box sx={{ minHeight: '100vh', py: 5, bgcolor: 'grey.50' }}>
      <Container maxWidth="xl">

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AdminPanelSettingsIcon color="primary" sx={{ fontSize: 38 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                Platform Administration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time community services overview
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddCircleIcon />}
            onClick={() => setOpenAddModal(true)}
            sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 700 }}
          >
            Insert New Resource
          </Button>
        </Box>

        {/* Loading / Error */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            Error fetching platform analytics. Ensure you have admin credentials.
          </Alert>
        )}

        {d && (
          <>
            {/* ── KPI Cards ─────────────────────────────────────────────── */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <KPICard
                  icon={<PeopleIcon />}
                  label="Total Citizens"
                  value={d.total_users ?? d.users?.total ?? 0}
                  sub="Registered users"
                  color="#1A56DB"
                  trend={d.users?.new_this_week}
                  trendLabel="this week"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <KPICard
                  icon={<LocalHospitalIcon />}
                  label="Appointments"
                  value={d.total_appointments ?? d.appointments?.total ?? 0}
                  sub={`${d.appointments?.pending ?? 0} pending`}
                  color="#0E9F6E"
                  trend={d.appointments?.today}
                  trendLabel="today"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <KPICard
                  icon={<BloodtypeIcon />}
                  label="Blood Requests"
                  value={d.total_blood_requests ?? d.blood_requests?.total ?? 0}
                  sub={`${d.blood_requests?.open ?? 0} open`}
                  color="#7C3AED"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <KPICard
                  icon={<EmergencyShareIcon />}
                  label="Emergencies"
                  value={d.total_emergencies ?? d.emergencies?.total ?? 0}
                  sub={`${d.emergencies?.active ?? 0} active`}
                  color="#E02424"
                />
              </Grid>
            </Grid>

            {/* ── Second Row ────────────────────────────────────────────── */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Today's Snapshot */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <TodayIcon color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Today's Snapshot</Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1A56DB' }}>
                          {d.users?.new_today ?? 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">New Users</Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0E9F6E' }}>
                          {d.appointments?.today ?? 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Appointments</Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#E02424' }}>
                          {d.emergencies?.resolved_today ?? 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Resolved</Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <PersonAddIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>User Growth (Weekly)</Typography>
                    </Box>
                    <QuickStatRow
                      label="New this week"
                      value={d.users?.new_this_week ?? 0}
                      max={Math.max(d.users?.new_this_week ?? 1, 1)}
                      color="#1A56DB"
                    />
                    <QuickStatRow
                      label="Pending appointments"
                      value={d.appointments?.pending ?? 0}
                      max={Math.max(d.appointments?.total ?? 1, 1)}
                      color="#0E9F6E"
                    />
                    <QuickStatRow
                      label="Active emergencies"
                      value={d.emergencies?.active ?? 0}
                      max={Math.max(d.emergencies?.total ?? 1, 1)}
                      color="#E02424"
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Blood Donors */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <BloodtypeIcon sx={{ color: '#7C3AED' }} />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Blood Bank</Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      {[
                        { label: 'Total Donors', value: d.blood_requests?.total_donors ?? 0, color: '#7C3AED', icon: <PeopleIcon sx={{ fontSize: 20 }} /> },
                        { label: 'Available Now', value: d.blood_requests?.available_donors ?? 0, color: '#0E9F6E', icon: <CheckCircleIcon sx={{ fontSize: 20 }} /> },
                        { label: 'Open Requests', value: d.blood_requests?.open ?? 0, color: '#D97706', icon: <WarningAmberIcon sx={{ fontSize: 20 }} /> },
                        { label: 'Critical Cases', value: d.blood_requests?.critical ?? 0, color: '#E02424', icon: <EmergencyShareIcon sx={{ fontSize: 20 }} /> },
                      ].map((item) => (
                        <Grid key={item.label} size={{ xs: 6 }}>
                          <Box sx={{
                            p: 1.5, borderRadius: 2, bgcolor: `${item.color}10`,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                          }}>
                            <Box sx={{ color: item.color, mb: 0.5 }}>{item.icon}</Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: item.color }}>{item.value}</Typography>
                            <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Emergency Status */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <EmergencyShareIcon sx={{ color: '#E02424' }} />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Emergency Status</Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    {[
                      { label: 'Total Dispatches', value: d.emergencies?.total ?? 0, color: '#E02424' },
                      { label: 'Currently Active', value: d.emergencies?.active ?? 0, color: '#D97706' },
                      { label: 'Resolved Today', value: d.emergencies?.resolved_today ?? 0, color: '#0E9F6E' },
                    ].map((item) => (
                      <Box key={item.label} sx={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        mb: 2, p: 1.5, borderRadius: 2, bgcolor: `${item.color}10`,
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: item.color }}>{item.label}</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: item.color }}>{item.value}</Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* ── Recent Users ──────────────────────────────────────────── */}
            {d.recent_users && d.recent_users.length > 0 && (
              <Card sx={{ borderRadius: 3, mb: 4 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonAddIcon color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Recently Joined Users</Typography>
                    </Box>
                    <Button component={Link} to="/admin/users" size="small" variant="outlined" sx={{ borderRadius: 2 }}>
                      View All
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {d.recent_users.map((u: any) => (
                      <Box key={u.id} sx={{
                        display: 'flex', alignItems: 'center', gap: 2,
                        p: 1.5, borderRadius: 2, bgcolor: 'grey.50',
                        '&:hover': { bgcolor: 'primary.50' },
                        transition: 'background 0.2s',
                      }}>
                        <Avatar
                          src={u.avatar_url || undefined}
                          sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: 16, flexShrink: 0 }}
                        >
                          {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                            {u.full_name || '—'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>{u.email}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {u.roles.map((r: string) => (
                            <Chip key={r} label={r.toUpperCase()} size="small" variant="outlined" color="primary" />
                          ))}
                        </Box>
                        <MuiTooltip title={u.is_email_verified ? 'Email verified' : 'Email not verified'}>
                          <CheckCircleIcon
                            sx={{ fontSize: 18, color: u.is_email_verified ? 'success.main' : 'action.disabled', flexShrink: 0 }}
                          />
                        </MuiTooltip>
                        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                          {new Date(u.date_joined).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ borderRadius: 3, p: 1 }}>
              <CardContent>
                <PeopleIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>User & Provider Management</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Review registered users, assign roles (Provider, Moderator, Volunteer), and manage accounts.
                </Typography>
                <Button variant="contained" component={Link} to="/admin/users" fullWidth sx={{ borderRadius: 2 }}>
                  Manage Users
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ borderRadius: 3, p: 1 }}>
              <CardContent>
                <AssignmentIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Appointments & Requests</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  View all medical appointments, emergency dispatches, and blood requests across the platform.
                </Typography>
                <Button variant="contained" color="error" component={Link} to="/admin/requests" fullWidth sx={{ borderRadius: 2 }}>
                  View All Requests
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ borderRadius: 3, p: 1 }}>
              <CardContent>
                <AnalyticsIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>System Analytics & Charts</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Detailed graphs for daily user growth, blood request fulfillment, and service usage.
                </Typography>
                <Button variant="contained" component={Link} to="/admin/analytics" fullWidth sx={{ borderRadius: 2 }}>
                  View Full Analytics
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <AdminAddEntityModal open={openAddModal} onClose={() => setOpenAddModal(false)} />
      </Container>
    </Box>
  )
}
