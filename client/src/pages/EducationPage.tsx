/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import {
  Container, Typography, Box, Grid, Card, CardContent, TextField, Button, Chip,
  CircularProgress, Alert, Paper, InputAdornment, Divider, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, FormControl, InputLabel, Select, MenuItem
} from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import LanguageIcon from '@mui/icons-material/Language'
import SearchIcon from '@mui/icons-material/Search'
import VerifiedIcon from '@mui/icons-material/Verified'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import ViewListIcon from '@mui/icons-material/ViewList'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { educationApi, adminApi } from '../api/services'
import { useAuthStore } from '../store/authStore'
import AdminAddEntityModal from '../components/admin/AdminAddEntityModal'
import type { EducationInstitution } from '../types'

export default function EducationPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [openAddModal, setOpenAddModal] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [editingInstitution, setEditingInstitution] = useState<EducationInstitution | null>(null)
  const [institutionToDelete, setInstitutionToDelete] = useState<EducationInstitution | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [institutionType, setInstitutionType] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [admissionOpen, setAdmissionOpen] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [formError, setFormError] = useState('')

  const { isAuthenticated, hasRole } = useAuthStore()
  const canAdd = isAuthenticated && (hasRole('admin') || hasRole('moderator'))
  const isAdmin = hasRole('admin') || hasRole('moderator')

  // View mode state: 'grid' or 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { data: educationData, isLoading, error } = useQuery({
    queryKey: ['education', search],
    queryFn: async () => {
      const res = await educationApi.getInstitutions({ search })
      return res.data
    },
  })

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EducationInstitution> }) => adminApi.updateEducation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education'] })
      handleCloseEditDialog()
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || err.message || 'Failed to update institution')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteEducation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education'] })
      setDeleteConfirmOpen(false)
      setInstitutionToDelete(null)
    },
  })

  const handleOpenEdit = (institution: any) => {
    setEditingInstitution(institution)
    setName(institution.name)
    setDescription(institution.description || '')
    setInstitutionType(institution.institution_type || '')
    setAddress(institution.address)
    setPhone(institution.phone || '')
    setEmail(institution.email || '')
    setWebsite(institution.website || '')
    setAdmissionOpen(institution.admission_open || false)
    setIsVerified(institution.is_verified || false)
    setFormError('')
    setEditDialogOpen(true)
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setEditingInstitution(null)
    setFormError('')
  }

  const handleOpenDeleteConfirm = (institution: any) => {
    setInstitutionToDelete(institution)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (institutionToDelete) {
      deleteMutation.mutate(institutionToDelete.id)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!editingInstitution) return

    const payload: Partial<EducationInstitution> = {
      name,
      description,
      institution_type: institutionType,
      address,
      phone,
      email,
      website,
      admission_open: admissionOpen,
      is_verified: isVerified,
    }

    updateMutation.mutate({ id: editingInstitution.id, data: payload })
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 6, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <SchoolIcon fontSize="large" /> Educational Institutions
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Explore schools, colleges, universities, and training institutes with live admission information.
            </Typography>
          </Box>

          {canAdd && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddModal(true)}
              sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 700 }}
            >
              Add Institution
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
            placeholder="Search institution by name, type, or academic program..."
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
            Error fetching educational institutions.
          </Alert>
        )}

        {educationData && (
          viewMode === 'grid' ? (
            <Grid container spacing={3}>
            {educationData.results.map((inst) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={inst.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4 } }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Chip label={inst.institution_type || 'Academic'} color="primary" size="small" variant="outlined" />
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        {inst.is_verified && <Chip icon={<VerifiedIcon />} label="Verified" color="success" size="small" />}
                        {isAdmin && (
                          <>
                            <Tooltip title="Edit Institution">
                              <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenEdit(inst); }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Institution">
                              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleOpenDeleteConfirm(inst); }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      {inst.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {inst.description || 'Recognized educational institution providing modern curriculum and campus facilities.'}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {inst.address}
                      </Typography>
                    </Box>

                    {inst.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {inst.phone}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ mt: 2 }}>
                      {inst.admission_open ? (
                        <Chip label="Admissions Open" color="success" size="small" sx={{ fontWeight: 700 }} />
                      ) : (
                        <Chip label="Admissions Closed" color="default" size="small" />
                      )}
                    </Box>
                  </CardContent>

                  <Box sx={{ p: 2, pt: 0 }}>
                    {inst.website ? (
                      <Button fullWidth variant="contained" component="a" href={inst.website} target="_blank" startIcon={<LanguageIcon />} sx={{ borderRadius: 2 }}>
                        Visit Official Portal
                      </Button>
                    ) : (
                      <Button fullWidth variant="outlined" disabled sx={{ borderRadius: 2 }}>
                        Info Portal Unavailable
                      </Button>
                    )}
                  </Box>
                </Card>
              </Grid>
            ))}

            {educationData.results.length === 0 && !isLoading && (
              <Grid size={12}>
                <Typography variant="h6" color="text.secondary" align="center" sx={{ py: 6 }}>
                  No educational institutions found matching your search.
                </Typography>
              </Grid>
            )}
            </Grid>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {educationData.results.map((inst) => (
                <Card key={inst.id} sx={{ borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4 } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip label={inst.institution_type || 'Academic'} color="primary" size="small" variant="outlined" />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {inst.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        {inst.is_verified && <Chip icon={<VerifiedIcon />} label="Verified" color="success" size="small" />}
                        {isAdmin && (
                          <>
                            <Tooltip title="Edit Institution">
                              <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenEdit(inst); }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Institution">
                              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleOpenDeleteConfirm(inst); }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {inst.description || 'Recognized educational institution providing modern curriculum and campus facilities.'}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {inst.address}
                      </Typography>
                    </Box>

                    {inst.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {inst.phone}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ mt: 2 }}>
                      {inst.admission_open ? (
                        <Chip label="Admissions Open" color="success" size="small" sx={{ fontWeight: 700 }} />
                      ) : (
                        <Chip label="Admissions Closed" color="default" size="small" />
                      )}
                    </Box>

                    <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 2, mt: 2, borderTop: 1, borderColor: 'divider' }}>
                      {inst.website ? (
                        <Button variant="contained" component="a" href={inst.website} target="_blank" startIcon={<LanguageIcon />} sx={{ borderRadius: 2 }}>
                          Visit Official Portal
                        </Button>
                      ) : (
                        <Button variant="outlined" disabled sx={{ borderRadius: 2 }}>
                          Info Portal Unavailable
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
              {educationData.results.length === 0 && !isLoading && (
                <Typography variant="h6" color="text.secondary" align="center" sx={{ py: 6 }}>
                  No educational institutions found matching your search.
                </Typography>
              )}
            </Box>
          )
        )}

        <AdminAddEntityModal open={openAddModal} onClose={() => setOpenAddModal(false)} initialTab={3} />

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} fullWidth maxWidth="md" sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
          <form onSubmit={handleSubmit}>
            <DialogTitle sx={{ fontWeight: 700 }}>Edit Institution Information</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3} sx={{ mt: 1 }}>
                {formError && <Alert severity="error">{formError}</Alert>}
                <TextField variant="outlined" label="Institution Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
                <TextField variant="outlined" label="Institution Type" value={institutionType} onChange={(e) => setInstitutionType(e.target.value)} fullWidth placeholder="e.g., School, College, University" />
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
                <TextField variant="outlined" label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} fullWidth placeholder="https://example.edu" />
                {isAdmin && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Admission Status</InputLabel>
                        <Select value={admissionOpen ? 'open' : 'closed'} label="Admission Status" onChange={(e) => setAdmissionOpen(e.target.value === 'open')}>
                          <MenuItem value="open">Open - Accepting Applications</MenuItem>
                          <MenuItem value="closed">Closed - Not Accepting</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Verified</InputLabel>
                        <Select value={isVerified ? 'yes' : 'no'} label="Verified" onChange={(e) => setIsVerified(e.target.value === 'yes')}>
                          <MenuItem value="yes">Yes - Verified</MenuItem>
                          <MenuItem value="no">No - Not Verified</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
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
            <Typography>Are you sure you want to delete <strong>{institutionToDelete?.name}</strong>? This action cannot be undone.</Typography>
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
