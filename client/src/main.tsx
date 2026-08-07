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
    primary: { main: '#1A56DB', light: '#3B82F6', dark: '#1E3A8A', contrastText: '#FFFFFF' },
    secondary: { main: '#0E9F6E', light: '#34D399', dark: '#057A55', contrastText: '#FFFFFF' },
    error: { main: '#E02424', light: '#F87171', dark: '#C81E1E' },
    warning: { main: '#D97706', light: '#FBBF24', dark: '#B45309' },
    info: { main: '#1A56DB', light: '#60A5FA', dark: '#1E3A8A' },
    success: { main: '#0E9F6E', light: '#34D399', dark: '#057A55' },
    background: { default: '#F9FAFB', paper: '#FFFFFF' },
    text: { primary: '#111928', secondary: '#6B7280' },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 800, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.12)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
          border: '1px solid #F3F4F6',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1A56DB',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: 'none' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRadius: 0 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { borderRadius: 6, fontSize: 12 },
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