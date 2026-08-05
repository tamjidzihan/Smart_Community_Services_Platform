import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AppBar, Toolbar, IconButton, Badge, Avatar, Menu, MenuItem,
  Drawer, List, ListItem, ListItemIcon, ListItemText, Divider,
  Box, Typography, Button,
} from '@mui/material'
import {
  Menu as MenuIcon, Notifications, LocalHospital, Bloodtype,
  School, People, AccountBalance, SmartToy,
  Dashboard, Person, Logout, Emergency, Home, MedicalServices,
} from '@mui/icons-material'
import { useAuthStore, useNotificationStore } from '../../store/authStore'
import { authApi } from '../../api/services'

const NAV_ITEMS = [
  { label: 'Services', path: '/services', icon: <MedicalServices /> },
  { label: 'Hospitals', path: '/hospitals', icon: <LocalHospital /> },
  { label: 'Blood', path: '/blood-donors', icon: <Bloodtype /> },
  { label: 'Education', path: '/education', icon: <School /> },
  { label: 'NGOs', path: '/ngo', icon: <People /> },
  { label: 'Government', path: '/government', icon: <AccountBalance /> },
  { label: 'AI Assistant', path: '/ai-assistant', icon: <SmartToy /> },
]

export default function Layout() {
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navbar */}
      <AppBar position="sticky" elevation={0} sx={{
        bgcolor: 'white', borderBottom: '1px solid #E5E7EB',
      }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton sx={{ display: { md: 'none' } }} onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 2,
              background: 'linear-gradient(135deg, #1A56DB, #0E9F6E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 16 }}>S</Typography>
            </Box>
            <Typography sx={{ fontWeight: 700, color: '#111928', fontSize: 18 }}>SCSP</Typography>
          </Link>

          {/* Desktop nav */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, ml: 2, flex: 1 }}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                size="small"
                sx={{
                  color: location.pathname.startsWith(item.path) ? '#1A56DB' : '#6B7280',
                  fontWeight: location.pathname.startsWith(item.path) ? 600 : 400,
                  bgcolor: location.pathname.startsWith(item.path) ? '#EBF5FF' : 'transparent',
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
              sx={{ display: { xs: 'none', sm: 'flex' }, animation: 'pulse 2s infinite' }}
            >
              Emergency
            </Button>

            {isAuthenticated ? (
              <>
                <IconButton component={Link} to="/notifications">
                  <Badge badgeContent={unreadCount} color="error">
                    <Notifications sx={{ color: '#6B7280' }} />
                  </Badge>
                </IconButton>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                  <Avatar sx={{ width: 34, height: 34, bgcolor: '#1A56DB', fontSize: 14 }}>
                    {user?.profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                  <MenuItem component={Link} to="/dashboard" onClick={() => setAnchorEl(null)}>
                    <Dashboard sx={{ mr: 1, fontSize: 20 }} /> Dashboard
                  </MenuItem>
                  <MenuItem component={Link} to="/profile" onClick={() => setAnchorEl(null)}>
                    <Person sx={{ mr: 1, fontSize: 20 }} /> Profile
                  </MenuItem>
                  {hasRole('admin') && (
                    <MenuItem component={Link} to="/admin" onClick={() => setAnchorEl(null)}>
                      <AccountBalance sx={{ mr: 1, fontSize: 20 }} /> Admin Panel
                    </MenuItem>
                  )}
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <Logout sx={{ mr: 1, fontSize: 20 }} /> Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button component={Link} to="/login" variant="outlined" size="small">Login</Button>
                <Button component={Link} to="/register" variant="contained" size="small">Sign Up</Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 260, pt: 2 }}>
          <Typography sx={{ px: 2, pb: 1, fontWeight: 700, color: '#1A56DB' }}>SCSP Menu</Typography>
          <List dense>
            <ListItem component={Link} to="/" onClick={() => setDrawerOpen(false)} sx={{ cursor: 'pointer' }}>
              <ListItemIcon><Home /></ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            {NAV_ITEMS.map((item) => (
              <ListItem
                key={item.path}
                component={Link}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                sx={{ cursor: 'pointer', bgcolor: location.pathname.startsWith(item.path) ? '#EBF5FF' : 'transparent' }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
            <Divider />
            <ListItem component={Link} to="/emergency" onClick={() => setDrawerOpen(false)} sx={{ cursor: 'pointer' }}>
              <ListItemIcon><Emergency sx={{ color: '#E02424' }} /></ListItemIcon>
              <ListItemText primary={<Typography color="error" sx={{ fontWeight: 600 }}>Emergency</Typography>} />
            </ListItem>
          </List>
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
      <Box component="footer" sx={{ bgcolor: '#111928', color: '#9CA3AF', py: 3, mt: 'auto' }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2">© 2025 Smart Community Services Platform. All rights reserved.</Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            {['Services', 'About', 'Privacy', 'Contact'].map((l) => (
              <Typography key={l} variant="body2" sx={{ cursor: 'pointer', '&:hover': { color: 'white' } }}>{l}</Typography>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
