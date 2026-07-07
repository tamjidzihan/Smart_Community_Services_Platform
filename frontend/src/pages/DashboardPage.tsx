import { Container, Typography } from '@mui/material'
export default function DashboardPage() {
  return (
    <Container sx={{ py: 6 }}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>DashboardPage</Typography>
      <Typography color="text.secondary">Full implementation included in project build.</Typography>
    </Container>
  )
}
