import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Button,
  Tooltip,
  Chip,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Notifications,
  LocalHospital,
  Bloodtype,
  SmartToy,
  Dashboard,
  Person,
  Logout,
  LocalPharmacy,
  CalendarMonth,
  Search,
} from '@mui/icons-material'
import { useAuthStore, useNotificationStore } from '../../store/authStore'
import { authApi } from '../../api/services'
import { useNotificationWS } from '../../hooks'

const NAV_ITEMS = [
  { label: 'Hospitals', path: '/hospitals', icon: <LocalHospital /> },
  { label: 'Doctors', path: '/doctors', icon: <LocalPharmacy /> },
  { label: 'Blood Network', path: '/blood-donors', icon: <Bloodtype /> },
  { label: 'AI Health Assistant', path: '/ai-assistant', icon: <SmartToy /> },
]

export default function Layout() {
  useNotificationWS()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, logout } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [navSearch, setNavSearch] = useState('')

  const handleNavSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (navSearch.trim()) {
      navigate(`/doctors?search=${encodeURIComponent(navSearch.trim())}`)
      setNavSearch('')
      setDrawerOpen(false)
    }
  }

  const handleLogout = async () => {
    const refresh = localStorage.getItem('refresh_token')
    if (refresh) await authApi.logout(refresh).catch(() => { })
    logout()
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      {/* Navbar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: { xs: 64, md: 72 }, px: { xs: 2, sm: 4, lg: 6 } }}>
          <IconButton
            sx={{ display: { md: 'none' }, color: '#0F172A' }}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </IconButton>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(13,148,136,0.3)',
                color: 'white',
              }}
            >
              <LocalHospital sx={{ fontSize: 24 }} />
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: 18, lineHeight: 1.2 }}>
                Smart Health
              </Typography>
              <Typography sx={{ fontSize: 10, color: '#0D9488', fontWeight: 700, letterSpacing: '0.08em' }}>
                HEALTHCARE PLATFORM
              </Typography>
            </Box>
          </Link>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, ml: 3, flex: 1, alignItems: 'center' }}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                size="small"
                sx={{
                  color: isActive(item.path) ? '#0D9488' : '#64748B',
                  fontWeight: isActive(item.path) ? 700 : 600,
                  bgcolor: isActive(item.path) ? '#F0FDFA' : 'transparent',
                  borderRadius: 2.5,
                  px: 1.75,
                  py: 0.8,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#F8FAFC',
                    color: '#0F172A',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* Navbar Search: Find Care */}
          <form
            onSubmit={handleNavSearch}
            className="hidden lg:flex items-center relative mr-3"
            style={{ width: 220 }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 18 }} />
            <input
              type="text"
              placeholder="Search doctors, care..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-slate-900 placeholder-slate-400 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all shadow-2xs"
            />
          </form>

          {/* Right Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: { xs: 'auto', lg: 0 } }}>
            {isAuthenticated ? (
              <>
                <Tooltip title="Notifications">
                  <IconButton
                    component={Link}
                    to="/notifications"
                    sx={{ color: '#64748B', '&:hover': { color: '#0F172A', bgcolor: '#F1F5F9' } }}
                  >
                    <Badge badgeContent={unreadCount} color="error">
                      <Notifications fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>

                <IconButton
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{ p: 0.5, border: '2px solid #E2E8F0', borderRadius: 3 }}
                >
                  <Avatar
                    src={user?.profile?.avatar_url}
                    sx={{ width: 34, height: 34, bgcolor: '#0D9488', fontSize: '0.875rem', fontWeight: 700 }}
                  >
                    {user?.profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                  </Avatar>
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  slotProps={{
                    paper: {
                      sx: {
                        borderRadius: 3,
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                        minWidth: 200,
                        p: 1,
                      },
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #F1F5F9' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>
                      {user?.profile?.full_name || 'Healthcare User'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>{user?.email}</Typography>
                  </Box>
                  <MenuItem component={Link} to="/dashboard" onClick={() => setAnchorEl(null)} sx={{ borderRadius: 2, my: 0.5 }}>
                    <ListItemIcon><Dashboard fontSize="small" sx={{ color: '#0D9488' }} /></ListItemIcon>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Dashboard</Typography>
                  </MenuItem>
                  <MenuItem component={Link} to="/appointments" onClick={() => setAnchorEl(null)} sx={{ borderRadius: 2, my: 0.5 }}>
                    <ListItemIcon><CalendarMonth fontSize="small" sx={{ color: '#0D9488' }} /></ListItemIcon>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>My Appointments</Typography>
                  </MenuItem>
                  <MenuItem component={Link} to="/profile" onClick={() => setAnchorEl(null)} sx={{ borderRadius: 2, my: 0.5 }}>
                    <ListItemIcon><Person fontSize="small" sx={{ color: '#64748B' }} /></ListItemIcon>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Profile</Typography>
                  </MenuItem>
                  <Divider sx={{ my: 1 }} />
                  <MenuItem onClick={handleLogout} sx={{ borderRadius: 2, color: '#DC2626' }}>
                    <ListItemIcon><Logout fontSize="small" sx={{ color: '#DC2626' }} /></ListItemIcon>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Sign Out</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  component={Link}
                  to="/login"
                  size="small"
                  sx={{ color: '#0F172A', fontWeight: 600, textTransform: 'none', px: 2 }}
                >
                  Log in
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  size="small"
                  sx={{
                    bgcolor: '#0D9488',
                    color: 'white',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 2.5,
                    px: 2.5,
                    '&:hover': { bgcolor: '#0F766E' },
                  }}
                >
                  Sign up
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { width: 280, p: 2 } } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #0D9488, #0F766E)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <LocalHospital sx={{ fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: 16 }}>
            Smart Health
          </Typography>
        </Box>

        {/* Mobile Search */}
        <form onSubmit={handleNavSearch} className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 18 }} />
          <input
            type="text"
            placeholder="Search doctors, hospitals..."
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-100 text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </form>

        <List>
          {NAV_ITEMS.map((item) => (
            <ListItem
              key={item.path}
              component={Link}
              to={item.path}
              onClick={() => setDrawerOpen(false)}
              sx={{
                borderRadius: 2.5,
                mb: 0.5,
                bgcolor: isActive(item.path) ? '#F0FDFA' : 'transparent',
                color: isActive(item.path) ? '#0D9488' : '#475569',
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 38 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 600, fontSize: '0.875rem' } } }} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Page Content */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          style={{ flex: 1 }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      {/* Footer */}
      <Box component="footer" sx={{ bgcolor: '#0F172A', color: '#94A3B8', pt: 8, pb: 4, mt: 'auto' }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: 4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' }, gap: 4, mb: 6 }}>
            {/* Brand */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <LocalHospital sx={{ fontSize: 20 }} />
                </Box>
                <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 18 }}>Smart Health</Typography>
              </Box>
              <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#94A3B8', fontSize: '0.8125rem' }}>
                Find Better Care. Make Better Health Decisions. <br />
                A centralized, intelligent healthcare platform connecting citizens with certified doctors, accredited hospitals, clinical departments, and voluntary blood donors.
              </Typography>
            </Box>

            {/* Healthcare Discovery */}
            <Box>
              <Typography sx={{ color: 'white', fontWeight: 700, mb: 2, fontSize: '0.875rem' }}>Healthcare Services</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, fontSize: '0.8125rem' }}>
                <Link to="/doctors" style={{ color: 'inherit', textDecoration: 'none' }}>Find Doctors</Link>
                <Link to="/hospitals" style={{ color: 'inherit', textDecoration: 'none' }}>Hospitals & Clinics</Link>
                <Link to="/blood-donors" style={{ color: 'inherit', textDecoration: 'none' }}>Blood Donors</Link>
                <Link to="/ai-assistant" style={{ color: 'inherit', textDecoration: 'none' }}>Smart Health AI</Link>
              </Box>
            </Box>

            {/* Quick Actions */}
            <Box>
              <Typography sx={{ color: 'white', fontWeight: 700, mb: 2, fontSize: '0.875rem' }}>Patient Access</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, fontSize: '0.8125rem' }}>
                <Link to="/appointments" style={{ color: 'inherit', textDecoration: 'none' }}>My Appointments</Link>
                <Link to="/blood-request" style={{ color: 'inherit', textDecoration: 'none' }}>Request Blood</Link>
                <Link to="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>Patient Dashboard</Link>
                <Link to="/profile" style={{ color: 'inherit', textDecoration: 'none' }}>Profile Settings</Link>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#64748B' }}>
              © {new Date().getFullYear()} Smart Health Platform. All medical records and profiles are confidential.
            </Typography>
            <Chip
              label="Smart Health v2.0"
              size="small"
              sx={{ bgcolor: 'rgba(13,148,136,0.2)', color: '#2DD4BF', fontSize: '0.6875rem', height: 22, fontWeight: 700 }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}