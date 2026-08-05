import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Container, Card, Typography, TextField, Button, Alert, Box } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/services'
import { useState } from 'react'

const schema = z.object({
  full_name: z.string().min(2, 'Full name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] })
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const [success, setSuccess] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (res) => setSuccess(res.data.message),
    onError: (e: any) => console.error(e),
  })
  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Card sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Create Account</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>Join the SCSP community</Typography>
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box component="form" onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <TextField fullWidth label="Full Name" {...register('full_name')} error={!!errors.full_name} helperText={errors.full_name?.message} sx={{ mb: 2 }} />
          <TextField fullWidth label="Email" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} sx={{ mb: 2 }} />
          <TextField fullWidth label="Password" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} sx={{ mb: 2 }} />
          <TextField fullWidth label="Confirm Password" type="password" {...register('confirm_password')} error={!!errors.confirm_password} helperText={errors.confirm_password?.message} sx={{ mb: 3 }} />
          <Button fullWidth type="submit" variant="contained" size="large" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating account...' : 'Create Account'}
          </Button>
        </Box>
        <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
          Already have an account? <Link to="/login" style={{ color: '#1A56DB' }}>Sign in</Link>
        </Typography>
      </Card>
    </Container>
  )
}
