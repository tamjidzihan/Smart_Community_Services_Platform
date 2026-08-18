import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AppBar, Toolbar, IconButton, Badge, Avatar, Menu, MenuItem,
  Drawer, List, ListItem, ListItemIcon, ListItemText, Divider,
  Box, Typography, Button, Tooltip, Chip,
} from '@mui/material'
import {
  Menu as MenuIcon, Notifications, LocalHospital, Bloodtype,
  School, People, AccountBalance, SmartToy,
  Dashboard, Person, Logout, Emergency, Home, MedicalServices, LocalShipping,
  ChevronRight, Shield, Phone, LocalPharmacy,
} from '@mui/icons-material'
import { useAuthStore, useNotificationStore } from '../../store/authStore'
import { authApi } from '../../api/services'
import { useNotificationWS } from '../../hooks'

const NAV_ITEMS = [
  { label: 'Services', path: '/services', icon: <MedicalServices /> },
  { label: 'Hospitals', path: '/hospitals', icon: <LocalHospital /> },
  { label: 'Doctors', path: '/doctors', icon: <LocalPharmacy /> },
  { label: 'Blood', path: '/blood-donors', icon: <Bloodtype /> },
  { label: 'Education', path: '/education', icon: <School /> },
  { label: 'NGOs', path: '/ngo', icon: <People /> },
  { label: 'Government', path: '/government', icon: <AccountBalance /> },
  { label: 'AI Assistant', path: '/ai-assistant', icon: <SmartToy /> },
]

export default function Layout() {
  useNotificationWS()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, logout, hasRole } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleLogout = async () => {
    const refresh = localStorage.getItem('refresh_token')
    if (refresh) await authApi.logout(refresh).catch(() => { })
    logout()
    navigate('/')
  }

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navbar */}
      <AppBar position="sticky" elevation={0} sx={{
        bgcolor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E5E7EB',
      }}>
        <Toolbar sx={{ gap: 1, minHeight: { xs: 64, md: 72 } }}>
          <IconButton
            sx={{ display: { md: 'none' }, color: '#111928' }}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </IconButton>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 2.5,
              background: 'linear-gradient(135deg, #1A56DB, #0E9F6E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(26,86,219,0.3)',
            }}>
              <Typography sx={{ color: 'white', fontWeight: 900, fontSize: 18 }}>S</Typography>
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography sx={{ fontWeight: 800, color: '#111928', fontSize: 18, lineHeight: 1.2 }}>
                SCSP
              </Typography>
              <Typography sx={{ fontSize: 10, color: '#6B7280', fontWeight: 500, letterSpacing: '0.05em' }}>
                SMART COMMUNITY
              </Typography>
            </Box>
          </Link>

          {/* Desktop nav */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, ml: 3, flex: 1 }}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                size="small"
                sx={{
                  color: isActive(item.path) ? '#1A56DB' : '#6B7280',
                  fontWeight: isActive(item.path) ? 700 : 500,
                  bgcolor: isActive(item.path) ? '#EBF5FF' : 'transparent',
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.75,
                  '&:hover': {
                    bgcolor: isActive(item.path) ? '#EBF5FF' : '#F3F4F6',
                    color: '#1A56DB',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Emergency button */}
            <Button
              component={Link}
              to="/emergency"
              variant="contained"
              color="error"
              size="small"
              startIcon={<Emergency />}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                borderRadius: 2,
                px: 2,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #E02424, #C81E1E)',
                '&:hover': { background: 'linear-gradient(135deg, #C81E1E, #E02424)' },
              }}
            >
              Emergency
            </Button>

            {isAuthenticated ? (
              <>
                <Tooltip title="Notifications">
                  <IconButton component={Link} to="/notifications" sx={{ color: '#6B7280' }}>
                    <Badge badgeContent={unreadCount} color="error" max={99}>
                      <Notifications />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Tooltip title="Account">
                  <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
                    <Avatar
                      sx={{
                        width: 36, height: 36,
                        bgcolor: '#1A56DB',
                        fontSize: 14,
                        fontWeight: 700,
                        border: '2px solid #EBF5FF',
                      }}
                    >
                      {user?.profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  slotProps={{
                    paper: { sx: { mt: 1, borderRadius: 2, minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #F3F4F6' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#111928' }}>
                      {user?.profile?.full_name || user?.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user?.email}
                    </Typography>
                  </Box>
                  <MenuItem component={Link} to="/dashboard" onClick={() => setAnchorEl(null)} sx={{ mt: 0.5 }}>
                    <Dashboard sx={{ mr: 1.5, fontSize: 20, color: '#1A56DB' }} /> Dashboard
                  </MenuItem>
                  <MenuItem component={Link} to="/profile" onClick={() => setAnchorEl(null)}>
                    <Person sx={{ mr: 1.5, fontSize: 20, color: '#0E9F6E' }} /> Profile
                  </MenuItem>
                  {hasRole('admin') && (
                    <>
                      <Divider sx={{ my: 0.5 }} />
                      <MenuItem component={Link} to="/admin" onClick={() => setAnchorEl(null)}>
                        <Shield sx={{ mr: 1.5, fontSize: 20, color: '#7C3AED' }} /> Admin Panel
                      </MenuItem>
                      <MenuItem component={Link} to="/admin/ambulances" onClick={() => setAnchorEl(null)}>
                        <LocalShipping sx={{ mr: 1.5, fontSize: 20, color: '#D97706' }} /> Manage Ambulances
                      </MenuItem>
                    </>
                  )}
                  <Divider sx={{ my: 0.5 }} />
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <Logout sx={{ mr: 1.5, fontSize: 20 }} /> Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button component={Link} to="/login" variant="outlined" size="small" sx={{ borderRadius: 2, px: 2 }}>
                  Login
                </Button>
                <Button component={Link} to="/register" variant="contained" size="small" sx={{ borderRadius: 2, px: 2 }}>
                  Sign Up
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { width: 280, borderRadius: 0 } } }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 2,
              background: 'linear-gradient(135deg, #1A56DB, #0E9F6E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ color: 'white', fontWeight: 900, fontSize: 16 }}>S</Typography>
            </Box>
            <Typography sx={{ fontWeight: 800, color: '#111928' }}>SCSP</Typography>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)} size="small" aria-label="Close menu">
            <MenuIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 2 }}>
          <Typography variant="overline" sx={{ color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.08em', px: 1 }}>
            Navigation
          </Typography>
          <List dense>
            <ListItem
              component={Link}
              to="/"
              onClick={() => setDrawerOpen(false)}
              sx={{
                cursor: 'pointer',
                borderRadius: 2,
                mb: 0.5,
                bgcolor: isActive('/') ? '#EBF5FF' : 'transparent',
                '&:hover': { bgcolor: '#F3F4F6' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: isActive('/') ? '#1A56DB' : '#6B7280' }}>
                <Home />
              </ListItemIcon>
              <ListItemText primary="Home" slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
              {isActive('/') && <ChevronRight sx={{ color: '#1A56DB', fontSize: 20 }} />}
            </ListItem>
            {NAV_ITEMS.map((item) => (
              <ListItem
                key={item.path}
                component={Link}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 2,
                  mb: 0.5,
                  bgcolor: isActive(item.path) ? '#EBF5FF' : 'transparent',
                  '&:hover': { bgcolor: '#F3F4F6' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive(item.path) ? '#1A56DB' : '#6B7280' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
                {isActive(item.path) && <ChevronRight sx={{ color: '#1A56DB', fontSize: 20 }} />}
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 1 }} />

          <List dense>
            <ListItem
              component={Link}
              to="/emergency"
              onClick={() => setDrawerOpen(false)}
              sx={{
                cursor: 'pointer',
                borderRadius: 2,
                bgcolor: '#FEF2F2',
                '&:hover': { bgcolor: '#FEE2E2' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Emergency sx={{ color: '#E02424' }} />
              </ListItemIcon>
              <ListItemText
                primary={<Typography color="error" sx={{ fontWeight: 700 }}>Emergency</Typography>}
              />
            </ListItem>
          </List>

          {isAuthenticated && (
            <>
              <Divider sx={{ my: 1 }} />
              <List dense>
                <ListItem
                  component={Link}
                  to="/dashboard"
                  onClick={() => setDrawerOpen(false)}
                  sx={{ cursor: 'pointer', borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: '#F3F4F6' } }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}><Dashboard sx={{ color: '#1A56DB' }} /></ListItemIcon>
                  <ListItemText primary="Dashboard" slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
                </ListItem>
                <ListItem
                  component={Link}
                  to="/profile"
                  onClick={() => setDrawerOpen(false)}
                  sx={{ cursor: 'pointer', borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: '#F3F4F6' } }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}><Person sx={{ color: '#0E9F6E' }} /></ListItemIcon>
                  <ListItemText primary="Profile" slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
                </ListItem>
                {hasRole('admin') && (
                  <ListItem
                    component={Link}
                    to="/admin"
                    onClick={() => setDrawerOpen(false)}
                    sx={{ cursor: 'pointer', borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: '#F3F4F6' } }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}><Shield sx={{ color: '#7C3AED' }} /></ListItemIcon>
                    <ListItemText primary="Admin Panel" slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
                  </ListItem>
                )}
              </List>
            </>
          )}
        </Box>
      </Drawer>

      {/* Page content with animation */}
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
      <Box component="footer" sx={{ bgcolor: '#111928', color: '#9CA3AF', pt: 5, pb: 3, mt: 'auto' }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, mb: 4 }}>
            {/* Brand */}
            <Box sx={{ maxWidth: 300 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: 2,
                  background: 'linear-gradient(135deg, #1A56DB, #0E9F6E)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Typography sx={{ color: 'white', fontWeight: 900, fontSize: 14 }}>S</Typography>
                </Box>
                <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 16 }}>SCSP</Typography>
              </Box>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                Smart Community Services Platform — connecting citizens with essential services through AI-powered technology.
              </Typography>
            </Box>

            {/* Quick links */}
            <Box>
              <Typography sx={{ color: 'white', fontWeight: 700, mb: 1.5, fontSize: 14 }}>Quick Links</Typography>
              {['Services', 'Hospitals', 'Blood Donors', 'Emergency'].map((l) => (
                <Typography key={l} variant="body2" sx={{ mb: 0.75, cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  {l}
                </Typography>
              ))}
            </Box>

            {/* Support */}
            <Box>
              <Typography sx={{ color: 'white', fontWeight: 700, mb: 1.5, fontSize: 14 }}>Support</Typography>
              {['About', 'Privacy Policy', 'Terms of Service', 'Contact'].map((l) => (
                <Typography key={l} variant="body2" sx={{ mb: 0.75, cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  {l}
                </Typography>
              ))}
            </Box>

            {/* Emergency contact */}
            <Box>
              <Typography sx={{ color: 'white', fontWeight: 700, mb: 1.5, fontSize: 14 }}>Emergency</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Phone sx={{ fontSize: 16, color: '#E02424' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#FCA5A5' }}>999</Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 0.75 }}>
                Ambulance: 199
              </Typography>
              <Typography variant="body2">
                Blood Bank: 16263
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body2">© 2025 Smart Community Services Platform. All rights reserved.</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Chip
                label="v1.0"
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#9CA3AF', fontSize: 11, height: 22 }}
              />
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                Made with ❤️ for the community
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}