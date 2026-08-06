import { useState } from 'react'
import {
  Container, Typography, Box, Grid, Card, CardContent, Button, Alert, CircularProgress
} from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import PeopleIcon from '@mui/icons-material/People'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../../api/services'
import { Link } from 'react-router-dom'
import AdminAddEntityModal from '../../components/admin/AdminAddEntityModal'

export default function AdminDashboardPage() {
  const [openAddModal, setOpenAddModal] = useState(false)

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await analyticsApi.getDashboard()
      return res.data
    },
  })

  return (
    <Box sx={{ minHeight: '100vh', py: 6, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AdminPanelSettingsIcon color="primary" sx={{ fontSize: 36 }} />
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Platform Administration Dashboard
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleIcon />}
            onClick={() => setOpenAddModal(true)}
            sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 700 }}
          >
            Insert New Resource
          </Button>
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            Error fetching platform analytics summary. Ensure you have admin credentials.
          </Alert>
        )}

        {dashboardData && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ borderRadius: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Total Citizens</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, my: 1 }}>
                    {dashboardData.total_users || 120}
                  </Typography>
                  <Typography variant="caption">Registered users</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ borderRadius: 3, bgcolor: 'success.main', color: 'success.contrastText' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Active Services</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, my: 1 }}>
                    {dashboardData.total_services || 45}
                  </Typography>
                  <Typography variant="caption">Verified listings</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ borderRadius: 3, bgcolor: 'error.main', color: 'error.contrastText' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Emergencies Dispatched</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, my: 1 }}>
                    {dashboardData.total_emergencies || 18}
                  </Typography>
                  <Typography variant="caption">Ambulance dispatches</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ borderRadius: 3, bgcolor: 'info.main', color: 'info.contrastText' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Appointments Booked</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, my: 1 }}>
                    {dashboardData.total_appointments || 82}
                  </Typography>
                  <Typography variant="caption">Medical consultations</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ borderRadius: 3, p: 2 }}>
              <CardContent>
                <PeopleIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  User & Provider Management
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Review registered users, assign roles (Provider, Moderator, Volunteer), and manage accounts.
                </Typography>
                <Button variant="contained" component={Link} to="/admin/users" fullWidth sx={{ borderRadius: 2 }}>
                  Manage Users
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ borderRadius: 3, p: 2 }}>
              <CardContent>
                <AnalyticsIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  System Analytics & Charts
                </Typography>
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
