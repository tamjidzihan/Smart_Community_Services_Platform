import { useParams, Link } from 'react-router-dom'
import {
  Container, Typography, Box, Paper, Grid, Chip, Button, Rating, Divider, CircularProgress, Alert
} from '@mui/material'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import LanguageIcon from '@mui/icons-material/Language'
import VerifiedIcon from '@mui/icons-material/Verified'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { servicesApi } from '../api/services'

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: service, isLoading, error } = useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      if (!id) throw new Error('No service ID')
      const res = await servicesApi.getService(id)
      return res.data
    },
  })

  const favoriteMutation = useMutation({
    mutationFn: (serviceId: string) => servicesApi.addFavorite(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      alert('Service added to your favorites!')
    },
  })

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress size={48} />
      </Box>
    )
  }

  if (error || !service) {
    return (
      <Container sx={{ py: 6 }}>
        <Alert severity="error">Service not found or error loading details.</Alert>
        <Button startIcon={<ArrowBackIcon />} component={Link} to="/services" sx={{ mt: 2 }}>
          Back to Services
        </Button>
      </Container>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 6, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Button startIcon={<ArrowBackIcon />} component={Link} to="/services" sx={{ mb: 3 }}>
          Back to All Services
        </Button>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 4 }}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Chip label={service.category_name || 'Community Service'} color="primary" variant="outlined" />
                {service.is_verified && <Chip icon={<VerifiedIcon />} label="Verified Provider" color="success" />}
              </Box>

              <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
                {service.title}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Rating value={service.average_rating || 4.5} precision={0.5} readOnly />
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {service.average_rating || 4.5} ({service.review_count || 0} reviews)
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                About this Service
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 2 }}>
                {service.description}
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, mt: 3 }}>
                Provider Information
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {service.provider_name || 'Independent Provider'}
              </Typography>
            </Grid>

            {/* Sidebar Contact Info */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'primary.dark' }}>
                  Contact & Location
                </Typography>

                {service.address && (
                  <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                    <LocationOnIcon color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Address</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{service.address}</Typography>
                    </Box>
                  </Box>
                )}

                {service.phone && (
                  <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                    <PhoneIcon color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Phone</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{service.phone}</Typography>
                    </Box>
                  </Box>
                )}

                {service.email && (
                  <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                    <EmailIcon color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Email</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{service.email}</Typography>
                    </Box>
                  </Box>
                )}

                {service.website && (
                  <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                    <LanguageIcon color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Website</Typography>
                      <Typography variant="body2" component="a" href={service.website} target="_blank" rel="noreferrer" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        Visit Website
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => favoriteMutation.mutate(service.id)}
                  sx={{ mt: 2, borderRadius: 2 }}
                >
                  Save to Favorites
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  )
}
