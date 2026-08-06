import {
  Container, Typography, Box, Paper, List, ListItem, ListItemText, ListItemAvatar,
  Avatar, Chip, Button, CircularProgress, Alert
} from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api/services'
import { Link } from 'react-router-dom'

export default function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationsApi.getAll()
      return res.data
    },
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const notificationsList: any[] = Array.isArray(notifications)
    ? notifications
    : Array.isArray((notifications as any)?.results)
    ? (notifications as any).results
    : []

  return (
    <Box sx={{ minHeight: '100vh', py: 6, bgcolor: 'grey.50' }}>
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <NotificationsIcon color="primary" sx={{ fontSize: 36 }} />
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Notifications & Alerts
            </Typography>
          </Box>

          <Button
            startIcon={<DoneAllIcon />}
            variant="outlined"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            Mark All Read
          </Button>
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            Error fetching notifications.
          </Alert>
        )}

        {notifications && (
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <List sx={{ p: 0 }}>
              {notificationsList.map((n: any, idx: number) => {
                const navLink = n.data?.link || (n.notification_type === 'ambulance_dispatch' ? '/admin/requests' : n.notification_type === 'blood_request' ? '/admin/requests' : null)
                const isAmbulanceDispatch = n.notification_type === 'ambulance_dispatch'
                const isBloodRequest = n.notification_type === 'blood_request'

                return (
                  <ListItem
                    key={n.id}
                    divider={idx < notificationsList.length - 1}
                    sx={{
                      bgcolor: n.is_read ? 'transparent' : 'action.hover',
                      py: 2,
                    }}
                    secondaryAction={
                      navLink ? (
                        <Button
                          variant="contained"
                          color={isAmbulanceDispatch ? 'error' : 'primary'}
                          size="small"
                          component={Link}
                          to={navLink}
                          sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                          View Request
                        </Button>
                      ) : null
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: n.is_read ? 'grey.400' : (isAmbulanceDispatch || isBloodRequest ? 'error.main' : 'primary.main') }}>
                        <NotificationsIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: n.is_read ? 600 : 800 }}>
                            {n.title}
                          </Typography>
                          {!n.is_read && <Chip label="New" color="error" size="small" />}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {n.body}
                          </Typography>

                          {/* Extra dispatch parameters if present */}
                          {n.data?.registration_number && (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 0.5 }}>
                              <Chip size="small" label={`Vehicle: ${n.data.registration_number}`} color="error" variant="outlined" />
                              {n.data.driver_name && <Chip size="small" label={`Driver: ${n.data.driver_name}`} variant="outlined" />}
                              {n.data.driver_phone && <Chip size="small" label={`Phone: ${n.data.driver_phone}`} variant="outlined" />}
                              {n.data.eta_minutes && <Chip size="small" label={`ETA: ~${n.data.eta_minutes} min`} color="info" variant="outlined" />}
                            </Box>
                          )}

                          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                            {new Date(n.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                )
              })}

              {notificationsList.length === 0 && (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography color="text.secondary">No notifications found.</Typography>
                </Box>
              )}
            </List>
          </Paper>
        )}
      </Container>
    </Box>
  )
}
