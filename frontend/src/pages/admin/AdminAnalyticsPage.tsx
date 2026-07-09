import { Container, Grid, Card, CardContent, Typography, Box, CircularProgress } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
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

  const d = dashboard?.data

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Platform Analytics</Typography>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<People />} label="Total Users" value={d?.users?.total || 0}
            sub={`+${d?.users?.new_this_week || 0} this week`} color="#1A56DB" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<LocalHospital />} label="Appointments" value={d?.appointments?.total || 0}
            sub={`${d?.appointments?.today || 0} today`} color="#0E9F6E" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<Bloodtype />} label="Blood Requests" value={d?.blood_requests?.total || 0}
            sub={`${d?.blood_requests?.open || 0} open`} color="#E02424" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<Emergency />} label="Emergencies" value={d?.emergencies?.total || 0}
            sub={`${d?.emergencies?.active || 0} active`} color="#D97706" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Daily Users Line Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>New User Registrations (14 Days)</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyUsers?.data?.results || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="new_users" stroke="#1A56DB" strokeWidth={2} dot={{ r: 4 }} name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Blood group pie */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Donors by Blood Group</Typography>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={bloodStats?.data?.donors_by_blood_group || []}
                  dataKey="count"
                  nameKey="blood_group"
                  cx="50%" cy="50%"
                  outerRadius={80}
                  label={({ blood_group, count }) => `${blood_group}: ${count}`}
                  labelLine={false}
                >
                  {(bloodStats?.data?.donors_by_blood_group || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Appointments Bar Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Daily Appointments (14 Days)</Typography>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={appointments?.data?.results || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="appointments" fill="#0E9F6E" radius={[4, 4, 0, 0]} name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Emergency by type */}
        <Grid item xs={12} md={6}>
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
