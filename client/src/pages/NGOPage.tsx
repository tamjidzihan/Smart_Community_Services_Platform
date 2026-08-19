/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import {
  Container, Typography, Box, Grid, Card, CardContent, TextField, Button, Chip,
  CircularProgress, Alert, Paper, InputAdornment, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, Stack, FormControl, InputLabel, Select, MenuItem
} from '@mui/material'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import SearchIcon from '@mui/icons-material/Search'
import VerifiedIcon from '@mui/icons-material/Verified'
import GroupsIcon from '@mui/icons-material/Groups'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import ViewListIcon from '@mui/icons-material/ViewList'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ngoApi, adminApi } from '../api/services'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

import AddIcon from '@mui/icons-material/Add'
import AdminAddEntityModal from '../components/admin/AdminAddEntityModal'
import type { NGO } from '../types'

export default function NGOPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [openRegisterModal, setOpenRegisterModal] = useState(false)
  const [openAddModal, setOpenAddModal] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [editingNGO, setEditingNGO] = useState<NGO | null>(null)
  const [ngoToDelete, setNGOToDelete] = useState<NGO | null>(null)
  const [skills, setSkills] = useState('')
  const [regSuccess, setRegSuccess] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [formError, setFormError] = useState('')

  const { isAuthenticated, hasRole } = useAuthStore()
  const canAdd = isAuthenticated && (hasRole('admin') || hasRole('moderator'))
  const isAdmin = hasRole('admin') || hasRole('moderator')
  const navigate = useNavigate()

  // View mode state: 'grid' or 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { data: ngoData, isLoading, error } = useQuery({
    queryKey: ['ngos', search],
    queryFn: async () => {
      const res = await ngoApi.getNGOs({ search })
      return res.data
    },
  })

  const volunteerMutation = useMutation({
    mutationFn: (data: any) => ngoApi.registerVolunteer(data),
    onSuccess: () => {
      setRegSuccess(true)
      setOpenRegisterModal(false)
      setSkills('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NGO> }) => adminApi.updateNGO(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngos'] })
      handleCloseEditDialog()
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || err.message || 'Failed to update NGO')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteNGO,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngos'] })
      setDeleteConfirmOpen(false)
      setNGOToDelete(null)
    },
  })

  const handleOpenRegister = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setOpenRegisterModal(true)
    setRegSuccess(false)
  }

  const handleOpenEdit = (ngo: any) => {
    setEditingNGO(ngo)
    setName(ngo.name)
    setDescription(ngo.description || '')
    setAddress(ngo.address)
    setPhone(ngo.phone || '')
    setEmail(ngo.email || '')
    setWebsite(ngo.website || '')
    setIsVerified(ngo.is_verified || false)
    setFormError('')
    setEditDialogOpen(true)
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setEditingNGO(null)
    setFormError('')
  }

  const handleOpenDeleteConfirm = (ngo: any) => {
    setNGOToDelete(ngo)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (ngoToDelete) {
      deleteMutation.mutate(ngoToDelete.id)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!editingNGO) return

    const payload: Partial<NGO> = {
      name,
      description,
      address,
      phone,
      email,
      website,
      is_verified: isVerified,
    }

    updateMutation.mutate({ id: editingNGO.id, data: payload })
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 6, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <VolunteerActivismIcon fontSize="large" color="primary" /> NGOs & Community Volunteers
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Connect with non-profit organizations, participate in social initiatives, and sign up as a volunteer.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" size="large" onClick={handleOpenRegister} sx={{ borderRadius: 3, px: 3, fontWeight: 700 }}>
              Register as Volunteer
            </Button>
            {canAdd && (
              <Button variant="outlined" size="large" startIcon={<AddIcon />} onClick={() => setOpenAddModal(true)} sx={{ borderRadius: 3, px: 3, fontWeight: 700 }}>
                Add NGO
              </Button>
            )}
          </Box>
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

        {regSuccess && (
          <Alert severity="success" sx={{ mb: 4 }} onClose={() => setRegSuccess(false)}>
            You have successfully registered as a community volunteer! Local NGOs will contact you for initiatives.
          </Alert>
        )}

        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Search NGO by name, social cause, or focus area (e.g. Disaster Relief, Health)..."
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
            Error fetching NGO registry.
          </Alert>
        )}

        {ngoData && (
          viewMode === 'grid' ? (
            <Grid container spacing={3}>
              {ngoData.results.map((ngo) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={ngo.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4 } }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Chip label="Verified NGO" color="primary" size="small" variant="outlined" />
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                          {ngo.is_verified && <Chip icon={<VerifiedIcon />} label="Certified" color="success" size="small" />}
                          {isAdmin && (
                            <>
                              <Tooltip title="Edit NGO">
                                <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenEdit(ngo); }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete NGO">
                                <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleOpenDeleteConfirm(ngo); }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        {ngo.name}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {ngo.description || 'Non-profit organization dedicated to community development and humanitarian support.'}
                      </Typography>

                      <Divider sx={{ my: 1.5 }} />

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationOnIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {ngo.address}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GroupsIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Active Volunteers: <strong>{ngo.volunteer_count || 24}</strong>
                        </Typography>
                      </Box>
                    </CardContent>

                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button fullWidth variant="outlined" onClick={handleOpenRegister} sx={{ borderRadius: 2 }}>
                        Join Initiatives
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {ngoData.results.map((ngo) => (
                <Card
                  key={ngo.id}
                  sx={{
                    borderRadius: 3,
                    transition: '0.3s',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)'
                    },
                    overflow: 'hidden'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Header Section */}
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 2,
                      mb: 1.5
                    }}>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        flexWrap: 'wrap'
                      }}>
                        <Chip
                          label="NGO"
                          color="primary"
                          size="small"
                          variant="outlined"
                          sx={{
                            fontWeight: 600,
                            '& .MuiChip-label': { px: 1.5 }
                          }}
                        />
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                          {ngo.name}
                        </Typography>
                      </Box>

                      <Box sx={{
                        display: 'flex',
                        gap: 0.5,
                        alignItems: 'center',
                        flexShrink: 0
                      }}>
                        {ngo.is_verified && (
                          <Chip
                            icon={<VerifiedIcon sx={{ fontSize: 16 }} />}
                            label="Certified"
                            color="success"
                            size="small"
                            sx={{
                              fontWeight: 600,
                              '& .MuiChip-label': { px: 1.5 }
                            }}
                          />
                        )}
                        {isAdmin && (
                          <>
                            <Tooltip title="Edit NGO">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(ngo);
                                }}
                                sx={{
                                  '&:hover': { backgroundColor: 'primary.light', color: 'primary.dark' }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete NGO">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDeleteConfirm(ngo);
                                }}
                                sx={{
                                  '&:hover': { backgroundColor: 'error.light', color: 'error.dark' }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </Box>

                    {/* Description */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.6
                      }}
                    >
                      {ngo.description || 'Non-profit organization dedicated to community development and humanitarian support.'}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    {/* Info Grid */}
                    <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 2,
                      mb: 2.5
                    }}>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        py: 1,
                        px: 1.5,
                        bgcolor: 'action.hover',
                        borderRadius: 2
                      }}>
                        <LocationOnIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {ngo.address}
                        </Typography>
                      </Box>

                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        py: 1,
                        px: 1.5,
                        bgcolor: 'action.hover',
                        borderRadius: 2
                      }}>
                        <GroupsIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          <strong>{ngo.volunteer_count || 24}</strong> Active Volunteers
                        </Typography>
                      </Box>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{
                      display: 'flex',
                      gap: 2,
                      flexWrap: 'wrap',
                      pt: 2,
                      borderTop: 1,
                      borderColor: 'divider'
                    }}>
                      <Button
                        variant="contained"
                        onClick={handleOpenRegister}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          px: 3,
                          boxShadow: 2,
                          '&:hover': { boxShadow: 4 }
                        }}
                      >
                        Join Initiatives
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}

              {ngoData.results.length === 0 && !isLoading && (
                <Box sx={{
                  py: 8,
                  textAlign: 'center',
                  bgcolor: 'action.hover',
                  borderRadius: 3
                }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No NGOs found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Check back later for new organizations or adjust your search criteria.
                  </Typography>
                </Box>
              )}
            </Box>
          )
        )}

        {/* Volunteer Modal */}
        <Dialog open={openRegisterModal} onClose={() => setOpenRegisterModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Register as a Community Volunteer</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Join our network of community volunteers to help during medical emergencies, blood drives, and social welfare events.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Your Skills & Areas of Interest"
              placeholder="e.g. First Aid certified, Event Management, Driving, Teaching..."
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenRegisterModal(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={!skills || volunteerMutation.isPending}
              onClick={() => volunteerMutation.mutate({ skills })}
            >
              {volunteerMutation.isPending ? 'Registering...' : 'Complete Volunteer Signup'}
            </Button>
          </DialogActions>
        </Dialog>

        <AdminAddEntityModal open={openAddModal} onClose={() => setOpenAddModal(false)} initialTab={4} />

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} fullWidth maxWidth="md" sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
          <form onSubmit={handleSubmit}>
            <DialogTitle sx={{ fontWeight: 700 }}>Edit NGO Information</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3} sx={{ mt: 1 }}>
                {formError && <Alert severity="error">{formError}</Alert>}
                <TextField variant="outlined" label="NGO Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
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
                <TextField variant="outlined" label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} fullWidth placeholder="https://example.org" />
                {isAdmin && (
                  <FormControl fullWidth>
                    <InputLabel>Verified</InputLabel>
                    <Select value={isVerified ? 'yes' : 'no'} label="Verified" onChange={(e) => setIsVerified(e.target.value === 'yes')}>
                      <MenuItem value="yes">Yes - Verified</MenuItem>
                      <MenuItem value="no">No - Not Verified</MenuItem>
                    </Select>
                  </FormControl>
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
            <Typography>Are you sure you want to delete <strong>{ngoToDelete?.name}</strong>? This action cannot be undone.</Typography>
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
