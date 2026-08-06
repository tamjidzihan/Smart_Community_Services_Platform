import { Container, Grid, Paper, Card, CardContent, Typography, Box, CircularProgress } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { analyticsApi } from '../../api/services'
import {
  People, LocalHospital, Bloodtype, Emergency,
} from '@mui/icons-material'

const COLORS = ['#1A56DB', '#0E9F6E', '#E02424', '#D97706', '#7C3AED']

function StatCard({ icon, label, value, sub, color }: any) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ width: 50, height: 50, borderRadius: 2, bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{value}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{label}</Typography>
          <Typography variant="caption" color="text.secondary">{sub}</Typography>
        </Box>
      </CardContent>
    </Card>
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

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  const dashData = dashboard?.data
  const trendsData = appointments

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Platform Analytics</Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<People />} label="Total Users" value={dashData?.users?.total || 0} sub="Registered citizens" color="#1A56DB" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<LocalHospital />} label="Services" value={dashData?.appointments?.total || 0} sub="Active listings" color="#0E9F6E" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<Bloodtype />} label="Appointments" value={dashData?.blood_requests?.total || 0} sub="Total booked" color="#7C3AED" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<Emergency />} label="Emergencies" value={dashData?.emergencies?.total || 0} sub="Dispatches handled" color="#E02424" />
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Daily User Registrations (Last 7 Days)</Typography>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailyUsers?.data?.results || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="new_users" stroke="#1A56DB" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Donors by Blood Group</Typography>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={bloodStats?.data?.donors_by_blood_group || []}
                  dataKey="count"
                  nameKey="blood_group"
                  cx="50%" cy="50%"
                  outerRadius={80}
                  label={(entry: any) => `${entry.blood_group}: ${entry.count}`}
                  labelLine={false}
                >
                  {(bloodStats?.data?.donors_by_blood_group || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Appointment Trends</Typography>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trendsData?.data?.results || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appointments" fill="#0E9F6E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Emergency Requests by Type</Typography>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={emergencyStats?.data?.by_type || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="request_type" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#E02424" radius={[0, 4, 4, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}
