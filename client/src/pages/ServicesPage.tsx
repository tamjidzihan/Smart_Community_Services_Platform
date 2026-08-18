/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import {
  Container, Typography, Box, Grid, Card, CardContent, TextField, Button, MenuItem,
  Chip, Rating, CircularProgress, Alert, Paper, InputAdornment, Divider, Pagination,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Stack,
  FormControl, InputLabel, Select,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import VerifiedIcon from '@mui/icons-material/Verified'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import ViewListIcon from '@mui/icons-material/ViewList'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { servicesApi, adminApi } from '../api/services'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import AdminAddEntityModal from '../components/admin/AdminAddEntityModal'
import type { ServiceListing } from '../types'

export default function ServicesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [openAddModal, setOpenAddModal] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceListing | null>(null)
  const [serviceToDelete, setServiceToDelete] = useState<ServiceListing | null>(null)

  // Form states for edit dialog
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState('active')
  const [isVerified, setIsVerified] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [formError, setFormError] = useState('')

  // Category form states
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDesc, setNewCategoryDesc] = useState('')
  const [categoryError, setCategoryError] = useState('')

  const { isAuthenticated, hasRole } = useAuthStore()
  const canAdd = isAuthenticated && (hasRole('admin') || hasRole('moderator') || hasRole('provider'))
  const isAdmin = hasRole('admin') || hasRole('moderator')

  // View mode state: 'grid' or 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

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

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServiceListing> }) => adminApi.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      handleCloseEditDialog()
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || err.message || 'Failed to update service')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      setDeleteConfirmOpen(false)
      setServiceToDelete(null)
    },
  })

  const createCategoryMutation = useMutation({
    mutationFn: servicesApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setCategoryDialogOpen(false)
      setNewCategoryName('')
      setNewCategoryDesc('')
      setCategoryError('')
    },
    onError: (err: any) => {
      setCategoryError(err.response?.data?.detail || err.message || 'Failed to create category')
    },
  })

  const handleOpenEdit = (service: any) => {
    setEditingService(service)
    setTitle(service.title)
    setDescription(service.description)
    setEditCategory(service.category)
    setAddress(service.address)
    setPhone(service.phone || '')
    setEmail(service.email || '')
    setWebsite(service.website || '')
    setStatus(service.status)
    setIsVerified(service.is_verified)
    setIsFeatured(service.is_featured)
    setFormError('')
    setEditDialogOpen(true)
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setEditingService(null)
    setFormError('')
  }

  const handleOpenDeleteConfirm = (service: any) => {
    setServiceToDelete(service)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (serviceToDelete) {
      deleteMutation.mutate(serviceToDelete.id)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!editingService) return

    const payload: Partial<ServiceListing> = {
      title,
      description,
      category: editCategory,
      address,
      phone,
      email,
      website,
      status,
      is_verified: isVerified,
      is_featured: isFeatured,
    }

    updateMutation.mutate({ id: editingService.id, data: payload })
  }

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault()
    setCategoryError('')
    if (!newCategoryName.trim()) {
      setCategoryError('Category name is required')
      return
    }
    createCategoryMutation.mutate({
      name: newCategoryName.trim(),
      description: newCategoryDesc.trim() || undefined
    })
  }

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

          {isAdmin && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setCategoryDialogOpen(true)}
              sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 700 }}
            >
              Add Category
            </Button>
          )}
          <Box sx={{ display: 'flex', gap: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 0.5 }}>
            <Tooltip title="Grid View">
              <IconButton
                size="small"
                color={viewMode === 'grid' ? 'primary' : 'inherit'}
                onClick={() => setViewMode('grid')}
              >
                <ViewModuleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="List View">
              <IconButton
                size="small"
                color={viewMode === 'list' ? 'primary' : 'inherit'}
                onClick={() => setViewMode('list')}
              >
                <ViewListIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
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
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {service.is_verified && (
                            <Chip icon={<VerifiedIcon />} label="Verified" color="success" size="small" />
                          )}
                          {isAdmin && (
                            <>
                              <Tooltip title="Edit Service">
                                <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenEdit(service); }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Service">
                                <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleOpenDeleteConfirm(service); }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
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

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} fullWidth maxWidth="md" sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
          <form onSubmit={handleSubmit}>
            <DialogTitle sx={{ fontWeight: 700 }}>Edit Service Information</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3} sx={{ mt: 1 }}>
                {formError && <Alert severity="error">{formError}</Alert>}
                <TextField variant="outlined" label="Service Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth required />
                <TextField variant="outlined" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={3} fullWidth required />
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select value={editCategory} label="Category" onChange={(e) => setEditCategory(e.target.value)}>
                    {categoriesList.map((cat: any) => (
                      <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField variant="outlined" label="Address" value={address} onChange={(e) => setAddress(e.target.value)} multiline rows={2} fullWidth required slotProps={{ input: { startAdornment: <LocationOnIcon sx={{ color: 'text.secondary', mr: 1, mt: 1, alignSelf: 'flex-start' }} /> } }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField variant="outlined" label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth slotProps={{ input: { startAdornment: <PhoneIcon sx={{ color: 'text.secondary', mr: 1 }} /> } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField variant="outlined" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth slotProps={{ input: { startAdornment: <EmailIcon sx={{ color: 'text.secondary', mr: 1 }} /> } }} />
                  </Grid>
                </Grid>
                <TextField variant="outlined" label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} fullWidth placeholder="https://example.com" />
                {isAdmin && (
                  <>
                    <FormControl fullWidth required>
                      <InputLabel>Status</InputLabel>
                      <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                        <MenuItem value="pending">Pending Review</MenuItem>
                      </Select>
                    </FormControl>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                          <InputLabel>Verified</InputLabel>
                          <Select value={isVerified ? 'yes' : 'no'} label="Verified" onChange={(e) => setIsVerified(e.target.value === 'yes')}>
                            <MenuItem value="yes">Yes - Verified</MenuItem>
                            <MenuItem value="no">No - Not Verified</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                          <InputLabel>Featured</InputLabel>
                          <Select value={isFeatured ? 'yes' : 'no'} label="Featured" onChange={(e) => setIsFeatured(e.target.value === 'yes')}>
                            <MenuItem value="yes">Yes - Featured</MenuItem>
                            <MenuItem value="no">No - Regular</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </>
                )}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={handleCloseEditDialog} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary" sx={{ px: 3, fontWeight: 600, borderRadius: 2 }} disabled={updateMutation.isPending}>Save Changes</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete <strong>{serviceToDelete?.title}</strong>? This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button onClick={handleConfirmDelete} variant="contained" color="error" sx={{ px: 3, fontWeight: 600, borderRadius: 2 }} disabled={deleteMutation.isPending}>Delete</Button>
          </DialogActions>
        </Dialog>

        {/* Add Category Dialog */}
        <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
          <form onSubmit={handleCreateCategory}>
            <DialogTitle sx={{ fontWeight: 700 }}>Add New Service Category</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3} sx={{ mt: 1 }}>
                {categoryError && <Alert severity="error">{categoryError}</Alert>}
                <TextField
                  variant="outlined"
                  label="Category Name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  fullWidth
                  required
                  placeholder="e.g., Healthcare, Education"
                />
                <TextField
                  variant="outlined"
                  label="Description (Optional)"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  multiline
                  rows={2}
                  fullWidth
                  placeholder="Brief description of this category"
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setCategoryDialogOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary" sx={{ px: 3, fontWeight: 600, borderRadius: 2 }} disabled={createCategoryMutation.isPending}>Create Category</Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </Box>
  )
}
