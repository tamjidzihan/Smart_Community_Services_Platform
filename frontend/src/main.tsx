import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { router } from './router'
import { authApi } from './api/services'
import { useAuthStore } from './store/authStore'
import './index.css'
import { RouterProvider } from 'react-router-dom'


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

const theme = createTheme({
  palette: {
    primary: { main: '#1A56DB' },
    secondary: { main: '#0E9F6E' },
    error: { main: '#E02424' },
    background: { default: '#F9FAFB' },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
      },
    },
  },
})


// eslint-disable-next-line react-refresh/only-export-components
function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setUser, logout } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      authApi.me()
        .then((res) => setUser(res.data))
        .catch(() => logout())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppInitializer>
          <RouterProvider router={router} />
        </AppInitializer>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
