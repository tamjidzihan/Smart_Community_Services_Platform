import {
  Container, Typography, Box, Grid, Paper, Card, CardContent, Button
} from '@mui/material'
import EventNoteIcon from '@mui/icons-material/EventNote'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle'
import NotificationsIcon from '@mui/icons-material/Notifications'
import PersonIcon from '@mui/icons-material/Person'
import { useAuthStore } from '../store/authStore'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <Box sx={{ minHeight: '100vh', py: 6, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        {/* Welcome Header */}
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 4, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Grid container spacing={3} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 8 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                Welcome back, {user?.profile?.full_name || user?.email || 'Citizen'}!
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Your Smart Community Services hub — access appointments, blood requests, and emergency services.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }} sx={{ textAlign: { sm: 'right' } }}>
              <Button variant="contained" color="secondary" component={Link} to="/emergency" size="large" sx={{ fontWeight: 800, borderRadius: 3 }}>
                One-Tap Emergency
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Quick Action Navigation Grid */}
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
          Community Dashboards & Quick Actions
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4, transform: 'translateY(-4px)' } }}>
              <CardContent sx={{ p: 3 }}>
                <EventNoteIcon color="primary" sx={{ fontSize: 40, mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Doctor Appointments
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Manage scheduled medical appointments, view specialist schedules, or book new consultations.
                </Typography>
                <Button fullWidth variant="outlined" component={Link} to="/appointments" sx={{ borderRadius: 2 }}>
                  View Appointments
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4, transform: 'translateY(-4px)' } }}>
              <CardContent sx={{ p: 3 }}>
                <WaterDropIcon color="error" sx={{ fontSize: 40, mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Blood Donation
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Search for compatible blood donors near you or broadcast an emergency blood request.
                </Typography>
                <Button fullWidth variant="outlined" color="error" component={Link} to="/blood-donors" sx={{ borderRadius: 2 }}>
                  Find Blood Donors
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4, transform: 'translateY(-4px)' } }}>
              <CardContent sx={{ p: 3 }}>
                <AirportShuttleIcon color="error" sx={{ fontSize: 40, mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Ambulance & Emergency
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Request instant ambulance dispatch and track responder status live on map.
                </Typography>
                <Button fullWidth variant="contained" color="error" component={Link} to="/emergency" sx={{ borderRadius: 2 }}>
                  Request Emergency Unit
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4, transform: 'translateY(-4px)' } }}>
              <CardContent sx={{ p: 3 }}>
                <NotificationsIcon color="primary" sx={{ fontSize: 40, mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Alerts & Notifications
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Stay updated with community alerts, appointment status updates, and emergency broadcasts.
                </Typography>
                <Button fullWidth variant="outlined" component={Link} to="/notifications" sx={{ borderRadius: 2 }}>
                  Check Notifications
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4, transform: 'translateY(-4px)' } }}>
              <CardContent sx={{ p: 3 }}>
                <PersonIcon color="primary" sx={{ fontSize: 40, mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  My Profile
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Update your contact details, emergency location coordinates, and preference settings.
                </Typography>
                <Button fullWidth variant="outlined" component={Link} to="/profile" sx={{ borderRadius: 2 }}>
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
