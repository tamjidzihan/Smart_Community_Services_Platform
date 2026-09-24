import { useState } from 'react'
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Avatar, CircularProgress, Alert, TextField,
  InputAdornment, Select, MenuItem, FormControl, InputLabel, Pagination,
  Tooltip, Stack,
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import SearchIcon from '@mui/icons-material/Search'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { adminApi } from '../../api/services'

const ROLE_OPTIONS = ['', 'citizen', 'provider', 'volunteer', 'moderator', 'admin'] as const

const ROLE_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  admin: 'error',
  moderator: 'warning',
  provider: 'info',
  volunteer: 'success',
  citizen: 'primary',
  visitor: 'default',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' })
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', search, role, page],
    queryFn: () => adminApi.listUsers({ search: search || undefined, role: role || undefined, page, page_size: 20 }),
    placeholderData: keepPreviousData,
  })

  const users = data?.data?.results ?? []
  const totalPages = data?.data?.total_pages ?? 1
  const totalCount = data?.data?.count ?? 0

  return (
    <Box sx={{ minHeight: '100vh', py: 5, bgcolor: 'grey.50' }}>
      <Container maxWidth="xl">

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <AdminPanelSettingsIcon color="primary" sx={{ fontSize: 38 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Platform Users Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {totalCount > 0 ? `${totalCount} registered users` : 'Loading user data…'}
            </Typography>
          </Box>
        </Box>

        {/* Filters */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField
            variant="outlined"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            size="small"
            sx={{ flex: 1, maxWidth: 400, bgcolor: 'white', borderRadius: 2 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 160, bgcolor: 'white', borderRadius: 2 }}>
            <InputLabel>Filter by Role</InputLabel>
            <Select value={role} label="Filter by Role" onChange={(e) => { setRole(e.target.value); setPage(1) }}>
              <MenuItem value="">All Roles</MenuItem>
              {ROLE_OPTIONS.filter(Boolean).map((r) => (
                <MenuItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Loading / Error */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load users. Make sure you are logged in as an admin.
          </Alert>
        )}

        {/* Table */}
        {!isLoading && (
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email Address</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Roles</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Verified</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Active</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Joined</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Last Login</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        <PeopleIcon sx={{ fontSize: 48, mb: 1, display: 'block', mx: 'auto', opacity: 0.3 }} />
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              src={u.avatar_url || undefined}
                              sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}
                            >
                              {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {u.full_name || '—'}
                                {u.is_staff && (
                                  <Tooltip title="Staff / Admin">
                                    <AdminPanelSettingsIcon sx={{ ml: 0.5, fontSize: 14, color: 'error.main', verticalAlign: 'middle' }} />
                                  </Tooltip>
                                )}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{u.phone || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {u.roles && u.roles.length > 0 ? u.roles.map((r: any) => {
                              const rName = typeof r === 'string' ? r : r.name
                              return (
                                <Chip
                                  key={rName}
                                  label={rName.toUpperCase()}
                                  color={ROLE_COLORS[rName] ?? 'default'}
                                  size="small"
                                  variant="outlined"
                                />
                              )
                            }) : <Chip label="NO ROLE" size="small" variant="outlined" color="default" />}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {u.is_email_verified
                            ? <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                            : <CancelIcon sx={{ color: 'text.disabled', fontSize: 20 }} />}
                        </TableCell>
                        <TableCell align="center">
                          {u.is_active
                            ? <Chip label="Active" color="success" size="small" />
                            : <Chip label="Inactive" color="default" size="small" />}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">{formatDate(u.date_joined)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">{formatDate(u.last_login || null)}</Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, p) => setPage(p)}
                  color="primary"
                  shape="rounded"
                />
              </Box>
            )}
          </Paper>
        )}
      </Container>
    </Box>
  )
}
