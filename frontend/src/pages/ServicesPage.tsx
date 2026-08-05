import { useState } from 'react'
import {
  Container, Typography, Box, Grid, Card, CardContent, TextField, Button, MenuItem,
  Chip, Rating, CircularProgress, Alert, Paper, InputAdornment, Divider, Pagination
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import VerifiedIcon from '@mui/icons-material/Verified'
import PhoneIcon from '@mui/icons-material/Phone'
import AddIcon from '@mui/icons-material/Add'
import { useQuery } from '@tanstack/react-query'
import { servicesApi } from '../api/services'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import AdminAddEntityModal from '../components/admin/AdminAddEntityModal'

export default function ServicesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [openAddModal, setOpenAddModal] = useState(false)

  const { isAuthenticated, hasRole } = useAuthStore()
  const canAdd = isAuthenticated && (hasRole('admin') || hasRole('moderator') || hasRole('provider'))

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await servicesApi.getCategories()
      return res.data
    },
  })

  const categoriesList = Array.isArray(categoriesData)
    ? categoriesData
    : Array.isArray((categoriesData as any)?.results)
    ? (categoriesData as any).results
    : []

  const { data: servicesData, isLoading, error } = useQuery({
    queryKey: ['services', search, category, page],
    queryFn: async () => {
      const res = await servicesApi.getServices({ search, category, page })
      return res.data
    },
  })

  const servicesList = Array.isArray(servicesData)
    ? servicesData
    : Array.isArray((servicesData as any)?.results)
    ? (servicesData as any).results
    : []

  return (
    <Box sx={{ minHeight: '100vh', py: 6, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
              Community Services Directory
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Find verified healthcare, emergency, education, and municipal services near you.
            </Typography>
          </Box>

          {canAdd && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddModal(true)}
              sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 700 }}
            >
              Add New Service
            </Button>
          )}
        </Box>

        {/* Filter Card */}
        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <TextField
                fullWidth
                placeholder="Search services, providers, or location..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                select
                label="Filter by Category"
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categoriesList.map((cat: any) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {/* Loading / Error */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            Failed to load community services. Please ensure the backend server is running.
          </Alert>
        )}

        {/* Services Grid */}
        {servicesData && (
          <>
            <Grid container spacing={3}>
              {servicesList.map((service: any) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={service.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Chip label={service.category_name || 'Service'} color="primary" size="small" variant="outlined" />
                        {service.is_verified && (
                          <Chip icon={<VerifiedIcon />} label="Verified" color="success" size="small" />
                        )}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, textDecoration: 'none', color: 'inherit' }} component={Link} to={`/services/${service.id}`}>
                        {service.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {service.description}
                      </Typography>

                      <Divider sx={{ my: 1.5 }} />

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationOnIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {service.address || 'Location provided upon booking'}
                        </Typography>
                      </Box>

                      {service.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {service.phone}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                        <Rating value={service.average_rating || 4.5} precision={0.5} readOnly size="small" />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {service.average_rating || 4.5} ({service.review_count || 0})
                        </Typography>
                      </Box>
                    </CardContent>

                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button fullWidth variant="contained" component={Link} to={`/services/${service.id}`} sx={{ borderRadius: 2 }}>
                        View Service Details
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {servicesData.results.length === 0 && !isLoading && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  No services found matching your query.
                </Typography>
              </Box>
            )}

            {/* Pagination */}
            {servicesData.total_pages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                <Pagination
                  count={servicesData.total_pages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}

        <AdminAddEntityModal open={openAddModal} onClose={() => setOpenAddModal(false)} initialTab={0} />
      </Container>
    </Box>
  )
}
