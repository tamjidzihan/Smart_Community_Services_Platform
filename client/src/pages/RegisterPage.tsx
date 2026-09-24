import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Container,
  Card,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  InputAdornment,
  IconButton,
  Divider,
  Tabs,
  Tab,
  MenuItem,
  Chip,
  Paper,
  Stack,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/services'
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  LocalHospital,
  Person,
  MedicationLiquid,
  Security,
  Verified,
  VolunteerActivism,
} from '@mui/icons-material'

const schema = z
  .object({
    full_name: z.string().min(2, 'Full name is required'),
    email: z.string().email('Please provide a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
    phone: z.string().optional(),
    blood_group: z.string().optional(),
    license_number: z.string().optional(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type FormData = z.infer<typeof schema>

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function RegisterPage() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'doctor'>('citizen')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDonorChecked, setIsDonorChecked] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      authApi.register({
        email: data.email,
        password: data.password,
        confirm_password: data.confirm_password,
        full_name: data.full_name,
        role: selectedRole,
        phone: data.phone,
        blood_group: data.blood_group,
        is_blood_donor: isDonorChecked,
      }),
    onSuccess: (res) => {
      setSuccess(res.data?.message || 'Account created successfully! You can now sign in.')
      setError('')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    },
    onError: (e: { response?: { data?: { detail?: string; error?: string } } }) => {
      setError(e.response?.data?.detail || e.response?.data?.error || 'Registration failed. Please try again.')
      setSuccess('')
    },
  })

  const handleRoleChange = (role: 'citizen' | 'doctor') => {
    setSelectedRole(role)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0F172A', display: 'flex', color: 'white' }}>
      {/* Left Feature Showcase Panel (Desktop) */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flex: 1.1,
          background: 'linear-gradient(145deg, #064E3B 0%, #0F172A 50%, #0D9488 100%)',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 8,
          position: 'relative',
          overflow: 'hidden',
          borderRight: '1px solid rgba(20, 184, 166, 0.2)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -120,
            left: -120,
            width: 450,
            height: 450,
            borderRadius: '50%',
            bgcolor: 'rgba(16, 185, 129, 0.15)',
            filter: 'blur(100px)',
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 6 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                bgcolor: 'rgba(20, 184, 166, 0.2)',
                border: '1px solid rgba(45, 212, 191, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
              }}
            >
              <LocalHospital sx={{ color: '#2DD4BF', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 22, color: 'white', letterSpacing: '-0.02em' }}>
                Smart Health
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#2DD4BF', letterSpacing: '0.08em', fontWeight: 700 }}>
                JOIN THE HEALTHCARE NETWORK
              </Typography>
            </Box>
          </Box>

          <Box sx={{ maxWidth: 520, spaceY: 3 }}>
            <Chip
              icon={<Verified sx={{ color: '#2DD4BF !important', fontSize: 16 }} />}
              label="Instant Healthcare Enrollment"
              sx={{
                bgcolor: 'rgba(20, 184, 166, 0.15)',
                color: '#5EEAD4',
                fontWeight: 700,
                border: '1px solid rgba(45, 212, 191, 0.3)',
                mb: 2.5,
              }}
            />

            <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.15, mb: 2, color: 'white' }}>
              Your complete digital health ecosystem.
            </Typography>

            <Typography sx={{ color: '#94A3B8', fontSize: 16, lineHeight: 1.6, mb: 4 }}>
              Register once to connect with accredited hospitals, certified medical consultants, rapid emergency response, and verified life-saving blood donors.
            </Typography>
          </Box>
        </Box>

        {/* Benefits Cards */}
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'rgba(13, 148, 136, 0.2)', color: '#2DD4BF' }}>
              <Person fontSize="small" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: 'white' }}>
                For Patients & Families
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>
                Book doctor chambers, view real-time hospital beds, and track medical appointments.
              </Typography>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'rgba(2, 132, 199, 0.2)', color: '#38BDF8' }}>
              <MedicationLiquid fontSize="small" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: 'white' }}>
                For Doctors & Clinicians
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>
                Manage weekly chamber schedules, hospital affiliations, patient reviews, and leaves.
              </Typography>
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 3, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Verified Medical Credentials
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Smart Health Platform © 2026
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Right Registration Section */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2.5, sm: 4, md: 6 },
          bgcolor: '#0B1120',
          overflowY: 'auto',
        }}
      >
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Card
            sx={{
              p: { xs: 3, sm: 4.5 },
              borderRadius: 4,
              bgcolor: '#1E293B',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
              color: 'white',
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.02em', mb: 0.5 }}>
                Create Account
              </Typography>
              <Typography sx={{ color: '#94A3B8', fontSize: 14 }}>
                Join thousands of patients and healthcare professionals nationwide
              </Typography>
            </Box>

            {/* Role Switcher */}
            <Box sx={{ mb: 3 }}>
              <Tabs
                value={selectedRole}
                onChange={(_, val) => handleRoleChange(val)}
                variant="fullWidth"
                sx={{
                  bgcolor: '#0F172A',
                  p: 0.5,
                  borderRadius: 3,
                  minHeight: 44,
                  '& .MuiTabs-indicator': {
                    bgcolor: selectedRole === 'doctor' ? '#0284C7' : '#0D9488',
                    height: '100%',
                    borderRadius: 2.5,
                    zIndex: 0,
                  },
                }}
              >
                <Tab
                  value="citizen"
                  label="Patient / Citizen"
                  icon={<Person fontSize="small" />}
                  iconPosition="start"
                  sx={{
                    zIndex: 1,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: 13,
                    color: selectedRole === 'citizen' ? '#FFFFFF' : '#94A3B8',
                    '&.Mui-selected': { color: '#FFFFFF' },
                  }}
                />
                <Tab
                  value="doctor"
                  label="Medical Doctor"
                  icon={<MedicationLiquid fontSize="small" />}
                  iconPosition="start"
                  sx={{
                    zIndex: 1,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: 13,
                    color: selectedRole === 'doctor' ? '#FFFFFF' : '#94A3B8',
                    '&.Mui-selected': { color: '#FFFFFF' },
                  }}
                />
              </Tabs>
            </Box>

            {success && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} icon={<CheckCircle fontSize="inherit" />}>
                {success}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5' }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit((d) => mutation.mutate(d))}>
              <TextField
                fullWidth
                label={selectedRole === 'doctor' ? 'Full Name & Title (e.g. Dr. Sarah Jenkins)' : 'Full Name'}
                placeholder={selectedRole === 'doctor' ? 'Dr. John Doe' : 'Jane Doe'}
                {...register('full_name')}
                error={!!errors.full_name}
                helperText={errors.full_name?.message}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#0F172A',
                    borderRadius: 2.5,
                    color: 'white',
                    '& fieldset': { borderColor: '#334155' },
                    '&:hover fieldset': { borderColor: '#0D9488' },
                    '&.Mui-focused fieldset': { borderColor: '#0D9488' },
                  },
                  '& .MuiInputLabel-root': { color: '#94A3B8' },
                }}
              />

              <TextField
                fullWidth
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#0F172A',
                    borderRadius: 2.5,
                    color: 'white',
                    '& fieldset': { borderColor: '#334155' },
                    '&:hover fieldset': { borderColor: '#0D9488' },
                    '&.Mui-focused fieldset': { borderColor: '#0D9488' },
                  },
                  '& .MuiInputLabel-root': { color: '#94A3B8' },
                }}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  placeholder="+8801XXXXXXXXX"
                  {...register('phone')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#0F172A',
                      borderRadius: 2.5,
                      color: 'white',
                      '& fieldset': { borderColor: '#334155' },
                    },
                    '& .MuiInputLabel-root': { color: '#94A3B8' },
                  }}
                />

                <TextField
                  fullWidth
                  select
                  label="Blood Group"
                  defaultValue=""
                  {...register('blood_group')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#0F172A',
                      borderRadius: 2.5,
                      color: 'white',
                      '& fieldset': { borderColor: '#334155' },
                    },
                    '& .MuiInputLabel-root': { color: '#94A3B8' },
                  }}
                >
                  <MenuItem value="">Not Specified</MenuItem>
                  {BLOOD_GROUPS.map((g) => (
                    <MenuItem key={g} value={g}>
                      {g}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              {selectedRole === 'doctor' && (
                <TextField
                  fullWidth
                  label="Medical License / BMDC Registration Number"
                  placeholder="e.g. BMDC-A12345"
                  {...register('license_number')}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#0F172A',
                      borderRadius: 2.5,
                      color: 'white',
                      '& fieldset': { borderColor: '#334155' },
                    },
                    '& .MuiInputLabel-root': { color: '#94A3B8' },
                  }}
                />
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 chars"
                  {...register('password')}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#0F172A',
                      borderRadius: 2.5,
                      color: 'white',
                      '& fieldset': { borderColor: '#334155' },
                    },
                    '& .MuiInputLabel-root': { color: '#94A3B8' },
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                            sx={{ color: '#94A3B8' }}
                          >
                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Confirm Password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-type password"
                  {...register('confirm_password')}
                  error={!!errors.confirm_password}
                  helperText={errors.confirm_password?.message}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#0F172A',
                      borderRadius: 2.5,
                      color: 'white',
                      '& fieldset': { borderColor: '#334155' },
                    },
                    '& .MuiInputLabel-root': { color: '#94A3B8' },
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirm(!showConfirm)}
                            edge="end"
                            size="small"
                            sx={{ color: '#94A3B8' }}
                          >
                            {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Stack>

              {/* Voluntary Blood Donor Fast Enrollment */}
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  mb: 3,
                  borderRadius: 2.5,
                  bgcolor: isDonorChecked ? 'rgba(225, 29, 72, 0.15)' : '#0F172A',
                  border: isDonorChecked ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid #334155',
                  transition: '0.2s',
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isDonorChecked}
                      onChange={(e) => setIsDonorChecked(e.target.checked)}
                      sx={{
                        color: '#FB7185',
                        '&.Mui-checked': { color: '#F43F5E' },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VolunteerActivism sx={{ color: '#F43F5E', fontSize: 18 }} />
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                        Enroll as a Voluntary Blood Donor
                      </Typography>
                    </Box>
                  }
                />
                <Typography sx={{ fontSize: 11, color: '#94A3B8', ml: 4 }}>
                  Allow nearby patients with matching blood types to reach out during emergencies.
                </Typography>
              </Paper>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={mutation.isPending}
                sx={{
                  py: 1.5,
                  borderRadius: 2.5,
                  fontWeight: 800,
                  fontSize: 15,
                  textTransform: 'none',
                  bgcolor: selectedRole === 'doctor' ? '#0284C7' : '#0D9488',
                  boxShadow: `0 8px 24px ${selectedRole === 'doctor' ? '#0284C750' : '#0D948850'}`,
                  '&:hover': {
                    bgcolor: selectedRole === 'doctor' ? '#0369A1' : '#0F766E',
                  },
                  '&:disabled': {
                    bgcolor: '#334155',
                    color: '#64748B',
                  },
                }}
              >
                {mutation.isPending ? 'Creating Account...' : `Register as ${selectedRole === 'doctor' ? 'Medical Doctor' : 'Patient'}`}
              </Button>
            </Box>

            <Divider sx={{ my: 3, borderColor: '#334155' }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#2DD4BF', fontWeight: 700, textDecoration: 'none' }}>
                  Sign in here
                </Link>
              </Typography>
            </Box>
          </Card>

          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', alignItems: 'center', mt: 3, color: '#64748B' }}>
            <Security fontSize="small" />
            <Typography variant="caption">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}