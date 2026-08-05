import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Avatar
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'

export default function AdminUsersPage() {
  const mockUsers = [
    { id: '1', name: 'Rahim Uddin', email: 'citizen@example.com', role: 'citizen', status: 'Active', joined: '2025-01-15' },
    { id: '2', name: 'Dr. Farhan Hossain', email: 'dr.farhan@hospital.com', role: 'provider', status: 'Verified', joined: '2025-01-10' },
    { id: '3', name: 'System Admin', email: 'admin@scsp.app', role: 'admin', status: 'Active', joined: '2025-01-01' },
    { id: '4', name: 'Karim Ahmed', email: 'karim@blood.org', role: 'volunteer', status: 'Active', joined: '2025-02-01' },
  ]

  return (
    <Box sx={{ minHeight: '100vh', py: 6, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <PeopleIcon color="primary" sx={{ fontSize: 36 }} />
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Platform Users Management
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email Address</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Joined Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockUsers.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 600 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                        {u.name.charAt(0)}
                      </Avatar>
                      {u.name}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Chip label={u.role.toUpperCase()} color="primary" size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={u.status} color="success" size="small" />
                    </TableCell>
                    <TableCell>{u.joined}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  )
}
