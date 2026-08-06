import { useState } from 'react'
import {
  Container, Typography, Box, Grid, Card, CardContent, TextField, Button, Chip,
  CircularProgress, Alert, Paper, InputAdornment, Divider
} from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhoneIcon from '@mui/icons-material/Phone'
import LanguageIcon from '@mui/icons-material/Language'
import SearchIcon from '@mui/icons-material/Search'
import VerifiedIcon from '@mui/icons-material/Verified'
import AddIcon from '@mui/icons-material/Add'
import { useQuery } from '@tanstack/react-query'
import { educationApi } from '../api/services'
import { useAuthStore } from '../store/authStore'
import AdminAddEntityModal from '../components/admin/AdminAddEntityModal'

export default function EducationPage() {
  const [search, setSearch] = useState('')
  const [openAddModal, setOpenAddModal] = useState(false)

  const { isAuthenticated, hasRole } = useAuthStore()
  const canAdd = isAuthenticated && (hasRole('admin') || hasRole('moderator'))

  const { data: educationData, isLoading, error } = useQuery({
    queryKey: ['education', search],
    queryFn: async () => {
      const res = await educationApi.getInstitutions({ search })
      return res.data
    },
  })

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
          <Grid container spacing={3}>
            {educationData.results.map((inst) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={inst.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4 } }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Chip label={inst.institution_type || 'Academic'} color="primary" size="small" variant="outlined" />
                      {inst.is_verified && <Chip icon={<VerifiedIcon />} label="Verified" color="success" size="small" />}
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
        )}

        <AdminAddEntityModal open={openAddModal} onClose={() => setOpenAddModal(false)} initialTab={3} />
      </Container>
    </Box>
  )
}
