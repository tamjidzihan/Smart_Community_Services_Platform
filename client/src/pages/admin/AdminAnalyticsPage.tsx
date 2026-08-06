import {
  Container, Grid, Paper, Card, CardContent, Typography, Box, CircularProgress, Chip,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { analyticsApi } from '../../api/services'
import {
  People, LocalHospital, Bloodtype, Emergency, TrendingUp,
} from '@mui/icons-material'

const CHART_COLORS = ['#1A56DB', '#0E9F6E', '#E02424', '#D97706', '#7C3AED', '#EC4899']

function StatCard({
  icon, label, value, sub, color, badge,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  sub?: string
  color: string
  badge?: { label: string; color: 'success' | 'warning' | 'error' | 'info' }
}) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%', overflow: 'hidden', position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: color }} />
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: 3 }}>
        <Box sx={{
          width: 54, height: 54, borderRadius: 2.5,
          bgcolor: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, flexShrink: 0,
        }}>
          {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color }}>{value}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
          {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
        </Box>
        {badge && (
          <Chip label={badge.label} color={badge.color} size="small" sx={{ flexShrink: 0 }} />
        )}
      </CardContent>
    </Card>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <TrendingUp sx={{ color: 'primary.main', fontSize: 20 }} />
      <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
    </Box>
  )
}

export default function AdminAnalyticsPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsApi.getDashboard(),
    refetchInterval: 60000,
  })
  const { data: dailyUsers } = useQuery({
    queryKey: ['daily-users'],
    queryFn: () => analyticsApi.getDailyUsers(14),
  })
  const { data: appointments } = useQuery({
    queryKey: ['appointment-trends'],
    queryFn: () => analyticsApi.getAppointmentTrends(14),
  })
  const { data: bloodStats } = useQuery({
    queryKey: ['blood-stats'],
    queryFn: () => analyticsApi.getBloodStats(),
  })
  const { data: emergencyStats } = useQuery({
    queryKey: ['emergency-stats'],
    queryFn: () => analyticsApi.getEmergencyStats(),
  })

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
        <CircularProgress size={52} />
      </Box>
    )
  }

  const d = dashboard?.data as any
  const dailyData = (dailyUsers as any)?.data?.results ?? []
  const appointmentData = (appointments as any)?.data?.results ?? []
  const bloodData = (bloodStats as any)?.data ?? {}
  const emergData = (emergencyStats as any)?.data ?? {}

  // Build combined donors vs requests per blood group
  const donorsByGroup: { blood_group: string; count: number }[] = bloodData.donors_by_blood_group ?? []
  const requestsByGroup: { blood_group: string; count: number }[] = bloodData.requests_by_blood_group ?? []
  const allGroups = Array.from(new Set([
    ...donorsByGroup.map((x) => x.blood_group),
    ...requestsByGroup.map((x) => x.blood_group),
  ]))
  const bloodCompare = allGroups.map((g) => ({
    blood_group: g,
    donors: donorsByGroup.find((x) => x.blood_group === g)?.count ?? 0,
    requests: requestsByGroup.find((x) => x.blood_group === g)?.count ?? 0,
  }))

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Platform Analytics</Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time statistics and trends across all community services
        </Typography>
      </Box>

      {/* ── KPI Cards ────────────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<People />}
            label="Total Users"
            value={d?.total_users ?? d?.users?.total ?? 0}
            sub={`+${d?.users?.new_this_week ?? 0} this week · +${d?.users?.new_today ?? 0} today`}
            color="#1A56DB"
            badge={{ label: `+${d?.users?.new_today ?? 0} today`, color: 'info' }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<LocalHospital />}
            label="Appointments"
            value={d?.total_appointments ?? d?.appointments?.total ?? 0}
            sub={`${d?.appointments?.pending ?? 0} pending · ${d?.appointments?.today ?? 0} today`}
            color="#0E9F6E"
            badge={{ label: `${d?.appointments?.pending ?? 0} pending`, color: 'warning' }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<Bloodtype />}
            label="Blood Requests"
            value={d?.total_blood_requests ?? d?.blood_requests?.total ?? 0}
            sub={`${d?.blood_requests?.open ?? 0} open · ${d?.blood_requests?.critical ?? 0} critical`}
            color="#7C3AED"
            badge={
              (d?.blood_requests?.critical ?? 0) > 0
                ? { label: `${d.blood_requests.critical} critical`, color: 'error' }
                : undefined
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<Emergency />}
            label="Emergencies"
            value={d?.total_emergencies ?? d?.emergencies?.total ?? 0}
            sub={`${d?.emergencies?.active ?? 0} active · ${d?.emergencies?.resolved_today ?? 0} resolved today`}
            color="#E02424"
            badge={
              (d?.emergencies?.active ?? 0) > 0
                ? { label: `${d.emergencies.active} active`, color: 'error' }
                : undefined
            }
          />
        </Grid>
      </Grid>

      {/* ── Row 1: Daily Users + Blood Pie ───────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <SectionHeader title="Daily User Registrations (Last 14 Days)" />
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [v, 'New Users']}
                />
                <Line
                  type="monotone"
                  dataKey="new_users"
                  stroke="#1A56DB"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#1A56DB' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <SectionHeader title="Blood Donors by Group" />
            {donorsByGroup.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260, color: 'text.disabled' }}>
                <Typography variant="body2">No donor data</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={donorsByGroup}
                    dataKey="count"
                    nameKey="blood_group"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ blood_group, percent }) => `${blood_group} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {donorsByGroup.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [v, name]} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Blood donor summary */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#7C3AED' }}>
                  {bloodData.total_donors ?? 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">Total Donors</Typography>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0E9F6E' }}>
                  {bloodData.available_donors ?? 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">Available</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Row 2: Appointment Trends + Emergency ────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <SectionHeader title="Appointment Trends (Last 14 Days)" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={appointmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [v, 'Appointments']}
                />
                <Bar dataKey="appointments" fill="#0E9F6E" radius={[4, 4, 0, 0]} name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <SectionHeader title="Emergency Requests by Type" />
            {(emergData.by_type ?? []).length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260, color: 'text.disabled' }}>
                <Typography variant="body2">No emergency data</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={emergData.by_type ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="request_type" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#E02424" radius={[0, 4, 4, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── Row 3: Blood Group Donors vs Requests Comparison ─────────── */}
      {bloodCompare.length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
          <SectionHeader title="Blood Group: Donors vs Requests" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bloodCompare}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="blood_group" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend />
              <Bar dataKey="donors" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Donors" />
              <Bar dataKey="requests" fill="#E02424" radius={[4, 4, 0, 0]} name="Requests" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* ── Emergency Status Breakdown ────────────────────────────────── */}
      {(emergData.by_status ?? []).length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <SectionHeader title="Emergency Status Breakdown" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={emergData.by_status ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="status" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Count">
                {(emergData.by_status ?? []).map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}
    </Container>
  )
}
