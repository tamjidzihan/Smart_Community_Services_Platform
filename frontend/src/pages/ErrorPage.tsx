import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom'
import { Container, Box, Typography, Button, Paper, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import ErrorIcon from '@mui/icons-material/Error'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import HomeIcon from '@mui/icons-material/Home'
import RefreshIcon from '@mui/icons-material/Refresh'
import { motion } from 'framer-motion'

export default function ErrorPage() {
  const error = useRouteError() as any
  const navigate = useNavigate()

  let errorMessage = 'An unexpected error occurred while rendering this page.'
  let errorTitle = 'Unexpected Application Error'
  let statusCode: number | string = '500'
  let stackTrace = ''

  if (isRouteErrorResponse(error)) {
    statusCode = error.status
    errorTitle = error.statusText || 'Navigation Error'
    errorMessage = error.data?.message || error.data || 'Page or resource could not be loaded.'
  } else if (error instanceof Error) {
    errorMessage = error.message
    stackTrace = error.stack || ''
  } else if (typeof error === 'string') {
    errorMessage = error
  } else if (error && typeof error === 'object') {
    errorMessage = error.message || JSON.stringify(error)
    stackTrace = error.stack || ''
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#F9FAFB',
        py: 6,
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              textAlign: 'center',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.05)',
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <ErrorIcon sx={{ fontSize: 40 }} />
            </Box>

            <Typography variant="caption" sx={{ fontWeight: 800, color: '#DC2626', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Error {statusCode}
            </Typography>

            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, mb: 1, color: '#111827' }}>
              {errorTitle}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
              {errorMessage}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                justifyContent: 'center',
                mb: stackTrace ? 3 : 0,
              }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<HomeIcon />}
                onClick={() => navigate('/')}
                sx={{
                  bgcolor: '#1A56DB',
                  px: 3,
                  py: 1.2,
                  borderRadius: 3,
                  fontWeight: 700,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#1E40AF', boxShadow: 'none' },
                }}
              >
                Back to Home
              </Button>

              <Button
                variant="outlined"
                size="large"
                startIcon={<RefreshIcon />}
                onClick={() => window.location.reload()}
                sx={{
                  borderColor: '#D1D5DB',
                  color: '#374151',
                  px: 3,
                  py: 1.2,
                  borderRadius: 3,
                  fontWeight: 700,
                  '&:hover': { borderColor: '#9CA3AF', bgcolor: '#F3F4F6' },
                }}
              >
                Reload Page
              </Button>
            </Box>

            {stackTrace && (
              <Accordion elevation={0} sx={{ mt: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, textAlign: 'left' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    Technical Details & Stack Trace
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box
                    component="pre"
                    sx={{
                      fontSize: 11,
                      fontFamily: 'monospace',
                      bgcolor: '#1F2937',
                      color: '#F3F4F6',
                      p: 2,
                      borderRadius: 2,
                      overflowX: 'auto',
                      maxHeight: 200,
                      m: 0,
                    }}
                  >
                    {stackTrace}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}
          </Paper>
        </motion.div>
      </Container>
    </Box>
  )
}
