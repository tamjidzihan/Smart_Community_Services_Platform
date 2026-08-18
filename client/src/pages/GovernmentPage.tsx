/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import {
  Container, Typography, Box, Grid, Card, CardContent, TextField, Button, Chip,
  CircularProgress, Alert, Paper, InputAdornment, Divider, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack
} from '@mui/material'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import LanguageIcon from '@mui/icons-material/Language'
import SearchIcon from '@mui/icons-material/Search'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import ViewListIcon from '@mui/icons-material/ViewList'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { govApi, adminApi } from '../api/services'
import { useAuthStore } from '../store/authStore'
import AdminAddEntityModal from '../components/admin/AdminAddEntityModal'
import type { GovOffice } from '../types'

export default function GovernmentPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [openAddModal, setOpenAddModal] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [editingOffice, setEditingOffice] = useState<GovOffice | null>(null)
  const [officeToDelete, setOfficeToDelete] = useState<GovOffice | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [officeType, setOfficeType] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [formError, setFormError] = useState('')

  const { isAuthenticated, hasRole } = useAuthStore()
  const canAdd = isAuthenticated && (hasRole('admin') || hasRole('moderator'))
  const isAdmin = hasRole('admin') || hasRole('moderator')

  // View mode state: 'grid' or 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { data: officesData, isLoading, error } = useQuery({
    queryKey: ['gov-offices', search],
    queryFn: async () => {
      const res = await govApi.getOffices({ search })
      return res.data
    },
  })

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GovOffice> }) => adminApi.updateGovOffice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gov-offices'] })
      handleCloseEditDialog()
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || err.message || 'Failed to update office')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteGovOffice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gov-offices'] })
      setDeleteConfirmOpen(false)
      setOfficeToDelete(null)
    },
  })

  const handleOpenEdit = (office: any) => {
    setEditingOffice(office)
    setName(office.name)
    setDescription(office.description || '')
    setOfficeType(office.office_type || '')
    setAddress(office.address)
    setPhone(office.phone || '')
    setEmail(office.email || '')
    setWebsite(office.website || '')
    setFormError('')
    setEditDialogOpen(true)
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setEditingOffice(null)
    setFormError('')
  }

  const handleOpenDeleteConfirm = (office: any) => {
    setOfficeToDelete(office)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (officeToDelete) {
      deleteMutation.mutate(officeToDelete.id)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!editingOffice) return

    const payload: Partial<GovOffice> = {
      name,
      description,
      office_type: officeType,
      address,
      phone,
      email,
      website,
    }

    updateMutation.mutate({ id: editingOffice.id, data: payload })
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 6, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AccountBalanceIcon fontSize="large" color="primary" /> Public & Government Services
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Access municipal services, public utility offices, civil registration, and citizen portals.
            </Typography>
          </Box>

          {canAdd && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddModal(true)}
              sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 700 }}
            >
              Add Govt Office
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

        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Search government offices or services (e.g. Passport, NID, Utility, Tax Office)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        </Paper>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            Error loading public services directory.
          </Alert>
        )}

        {officesData && (
          viewMode === 'grid' ? (
            <Grid container spacing={3}>
            {((officesData as any).results || officesData).map((office: any) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={office.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4 } }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Chip label={office.office_type || 'Municipal'} color="primary" size="small" variant="outlined" />
                      {isAdmin && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit Office">
                            <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenEdit(office); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Office">
                            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleOpenDeleteConfirm(office); }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      {office.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {office.description || 'Public administration office serving citizen requests and civil services.'}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {office.address}
                      </Typography>
                    </Box>

                    {office.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {office.phone}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>

                  <Box sx={{ p: 2, pt: 0 }}>
                    {office.website ? (
                      <Button fullWidth variant="contained" component="a" href={office.website} target="_blank" startIcon={<LanguageIcon />} sx={{ borderRadius: 2 }}>
                        Access Online Service
                      </Button>
                    ) : (
                      <Button fullWidth variant="outlined" disabled sx={{ borderRadius: 2 }}>
                        In-person Office Only
                      </Button>
                    )}
                  </Box>
                </Card>
              </Grid>
            ))}
            </Grid>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {((officesData as any).results || officesData).map((office: any) => (
                <Card key={office.id} sx={{ borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4 } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip label={office.office_type || 'Municipal'} color="primary" size="small" variant="outlined" />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {office.name}
                        </Typography>
                      </Box>
                      {isAdmin && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit Office">
                            <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenEdit(office); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Office">
                            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleOpenDeleteConfirm(office); }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {office.description || 'Public administration office serving citizen requests and civil services.'}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {office.address}
                      </Typography>
                    </Box>

                    {office.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {office.phone}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 2, mt: 2, borderTop: 1, borderColor: 'divider' }}>
                      {office.website ? (
                        <Button variant="contained" component="a" href={office.website} target="_blank" startIcon={<LanguageIcon />} sx={{ borderRadius: 2 }}>
                          Access Online Service
                        </Button>
                      ) : (
                        <Button variant="outlined" disabled sx={{ borderRadius: 2 }}>
                          In-person Office Only
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )
        )}

        <AdminAddEntityModal open={openAddModal} onClose={() => setOpenAddModal(false)} initialTab={5} />

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} fullWidth maxWidth="md" sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
          <form onSubmit={handleSubmit}>
            <DialogTitle sx={{ fontWeight: 700 }}>Edit Government Office Information</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3} sx={{ mt: 1 }}>
                {formError && <Alert severity="error">{formError}</Alert>}
                <TextField variant="outlined" label="Office Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
                <TextField variant="outlined" label="Office Type" value={officeType} onChange={(e) => setOfficeType(e.target.value)} fullWidth placeholder="e.g., Municipal, Tax Office, Passport" />
                <TextField variant="outlined" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={3} fullWidth />
                <TextField variant="outlined" label="Address" value={address} onChange={(e) => setAddress(e.target.value)} multiline rows={2} fullWidth required slotProps={{ input: { startAdornment: <LocationOnIcon sx={{ color: 'text.secondary', mr: 1, mt: 1, alignSelf: 'flex-start' }} /> } }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField variant="outlined" label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth slotProps={{ input: { startAdornment: <PhoneIcon sx={{ color: 'text.secondary', mr: 1 }} /> } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField variant="outlined" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth slotProps={{ input: { startAdornment: <EmailIcon sx={{ color: 'text.secondary', mr: 1 }} /> } }} />
                  </Grid>
                </Grid>
                <TextField variant="outlined" label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} fullWidth placeholder="https://example.gov" />
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
            <Typography>Are you sure you want to delete <strong>{officeToDelete?.name}</strong>? This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button onClick={handleConfirmDelete} variant="contained" color="error" sx={{ px: 3, fontWeight: 600, borderRadius: 2 }} disabled={deleteMutation.isPending}>Delete</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}
