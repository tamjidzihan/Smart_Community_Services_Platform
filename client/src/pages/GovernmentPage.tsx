import { useState } from 'react'
import {
  Container, Typography, Box, Grid, Card, CardContent, TextField, Button, Chip,
  CircularProgress, Alert, Paper, InputAdornment, Divider
} from '@mui/material'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhoneIcon from '@mui/icons-material/Phone'
import LanguageIcon from '@mui/icons-material/Language'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import { useQuery } from '@tanstack/react-query'
import { govApi } from '../api/services'
import { useAuthStore } from '../store/authStore'
import AdminAddEntityModal from '../components/admin/AdminAddEntityModal'

export default function GovernmentPage() {
  const [search, setSearch] = useState('')
  const [openAddModal, setOpenAddModal] = useState(false)

  const { isAuthenticated, hasRole } = useAuthStore()
  const canAdd = isAuthenticated && (hasRole('admin') || hasRole('moderator'))

  const { data: officesData, isLoading, error } = useQuery({
    queryKey: ['gov-offices', search],
    queryFn: async () => {
      const res = await govApi.getOffices({ search })
      return res.data
    },
  })

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
          <Grid container spacing={3}>
            {((officesData as any).results || officesData).map((office: any) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={office.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4 } }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Chip label={office.office_type || 'Municipal'} color="primary" size="small" variant="outlined" sx={{ mb: 1.5 }} />

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
        )}

        <AdminAddEntityModal open={openAddModal} onClose={() => setOpenAddModal(false)} initialTab={5} />
      </Container>
    </Box>
  )
}
