import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  AccessTime,
  Close,
} from '@mui/icons-material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentApi } from '../../api/services'
import { useAuthStore } from '../../store/authStore'
import type { Doctor } from '../../types'

interface AppointmentBookingModalProps {
  doctor: Doctor | null
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  doctor,
  open,
  onClose,
  onSuccess,
}) => {
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()

  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [appointmentType, setAppointmentType] = useState('general')
  const [selectedHospital, setSelectedHospital] = useState(
    doctor?.hospital_affiliations?.[0]?.hospital || ''
  )
  const [reason, setReason] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      if (!doctor || !date || !time) {
        throw new Error('Please fill in all required fields.')
      }
      const scheduled_at = `${date}T${time}:00`
      return appointmentApi.bookAppointment({
        doctor: doctor.id,
        hospital: selectedHospital || null,
        scheduled_at,
        appointment_type: appointmentType,
        reason,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      onSuccess?.()
      onClose()
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.scheduled_at?.[0] ||
        err?.response?.data?.doctor?.[0] ||
        err?.response?.data?.non_field_errors?.[0] ||
        err?.message ||
        'Failed to book appointment.'
      setErrorMessage(msg)
    },
  })

  if (!doctor) return null

  const isOnLeave = doctor.availability?.status === 'ON_LEAVE'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 4, p: 1 } } }}
    >
      <div className="flex items-center justify-between p-4 pb-0">
        <DialogTitle sx={{ p: 0, fontWeight: 700, fontSize: '1.25rem' }}>
          Book Appointment
        </DialogTitle>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Close fontSize="small" />
        </button>
      </div>

      <DialogContent sx={{ pt: 2 }}>
        {/* Doctor Summary Header */}
        <div className="flex items-center gap-3.5 bg-teal-50/70 border border-teal-100 rounded-2xl p-3.5 mb-4">
          <img
            src={
              doctor.profile_image ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                doctor.full_name
              )}&background=0d9488&color=fff&size=128`
            }
            alt={doctor.full_name}
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
          <div>
            <h4 className="font-bold text-slate-900">{doctor.full_name}</h4>
            <p className="text-teal-800 text-xs font-medium">
              {doctor.specialists?.map((s) => s.name).join(', ') || doctor.current_position}
            </p>
            {doctor.consultation_fee && (
              <p className="text-slate-600 text-xs mt-0.5 font-semibold">
                Fee: ৳{Number(doctor.consultation_fee).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {isOnLeave && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
            <strong>Doctor is currently on leave:</strong> {doctor.availability.message}
          </Alert>
        )}

        {!isAuthenticated && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
            You need to be logged in to book an appointment. You will be prompted to log in upon confirmation.
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
            {errorMessage}
          </Alert>
        )}

        {/* Doctor Practice Schedules Info */}
        {doctor.schedules && doctor.schedules.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Doctor Schedule Hours
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {doctor.schedules.map((sch) => (
                <div key={sch.id} className="bg-slate-50 border border-slate-200/70 rounded-xl p-2 flex items-center gap-2">
                  <AccessTime style={{ fontSize: 15 }} className="text-teal-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">{sch.day_name}: </span>
                    <span className="text-slate-600">{sch.start_time.slice(0, 5)} - {sch.end_time.slice(0, 5)}</span>
                    {sch.is_overnight && (
                      <span className="ml-1 text-[10px] bg-amber-100 text-amber-800 px-1 rounded font-bold">Overnight</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField
              label="Appointment Date"
              type="date"
              fullWidth
              size="small"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { min: new Date().toISOString().split('T')[0] },
              }}
              required
            />
            <TextField
              label="Preferred Time"
              type="time"
              fullWidth
              size="small"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField
              select
              label="Appointment Type"
              fullWidth
              size="small"
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
            >
              <MenuItem value="general">General Consultation</MenuItem>
              <MenuItem value="follow_up">Follow-up Consultation</MenuItem>
              <MenuItem value="specialist">Specialist Consultation</MenuItem>
              <MenuItem value="emergency">Emergency Consultation</MenuItem>
            </TextField>

            {doctor.hospital_affiliations && doctor.hospital_affiliations.length > 0 && (
              <TextField
                select
                label="Hospital Location"
                fullWidth
                size="small"
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
              >
                {doctor.hospital_affiliations.map((aff) => (
                  <MenuItem key={aff.id} value={aff.hospital}>
                    {aff.hospital_name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </div>

          <TextField
            label="Reason for Visit / Symptoms (Optional)"
            multiline
            rows={3}
            fullWidth
            size="small"
            placeholder="Briefly describe your health concern or symptoms..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => mutation.mutate()}
          disabled={!date || mutation.isPending || isOnLeave}
          sx={{
            bgcolor: 'teal.600',
            fontWeight: 700,
            borderRadius: 3,
            px: 3,
            '&:hover': { bgcolor: 'teal.700' },
          }}
        >
          {mutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Confirm Booking'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
