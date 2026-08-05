import {
  Container, Typography, Box, Paper, List, ListItem, ListItemText, ListItemAvatar,
  Avatar, Chip, Button, CircularProgress, Alert
} from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api/services'

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
              {notificationsList.map((n: any, idx: number) => (
                <ListItem
                  key={n.id}
                  divider={idx < notificationsList.length - 1}
                  sx={{
                    bgcolor: n.is_read ? 'transparent' : 'action.hover',
                    py: 2,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: n.is_read ? 'grey.400' : 'primary.main' }}>
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
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ my: 0.5 }}>
                          {n.body}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {new Date(n.created_at).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}

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
