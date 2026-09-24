import { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Box, Alert, CircularProgress, FormControlLabel, Checkbox, Tabs, Tab
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { servicesApi, healthcareApi, ngoApi, educationApi, govApi } from '../../api/services'

interface AdminAddEntityModalProps {
  open: boolean
  onClose: () => void
  initialTab?: number
}

export default function AdminAddEntityModal({ open, onClose, initialTab = 0 }: AdminAddEntityModalProps) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState(initialTab)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (open) {
      setTab(initialTab)
      setSuccessMsg('')
      setErrorMsg('')
    }
  }, [open, initialTab])

  // Service state
  const [serviceTitle, setServiceTitle] = useState('')
  const [serviceCategory, setServiceCategory] = useState('')
  const [serviceDesc, setServiceDesc] = useState('')
  const [serviceAddr, setServiceAddr] = useState('')
  const [servicePhone, setServicePhone] = useState('')

  // Hospital state
  const [hospName, setHospName] = useState('')
  const [hospType, setHospType] = useState('general')
  const [hospAddr, setHospAddr] = useState('')
  const [hospPhone, setHospPhone] = useState('')
  const [hospBeds, setHospBeds] = useState(50)
  const [hospEmerg, setHospEmerg] = useState(true)

  // Doctor state
  const [docName, setDocName] = useState('')
  const [docSpecialty, setDocSpecialty] = useState('')
  const [docHospital, setDocHospital] = useState('')
  const [docPhone, setDocPhone] = useState('')
  const [docFee, setDocFee] = useState(500)

  // Education state
  const [eduName, setEduName] = useState('')
  const [eduType, setEduType] = useState('school')
  const [eduAddr, setEduAddr] = useState('')
  const [eduPhone, setEduPhone] = useState('')
  const [eduEst, setEduEst] = useState(2010)

  // NGO state
  const [ngoName, setNgoName] = useState('')
  const [ngoSector, setNgosector] = useState('Community Development')
  const [ngoDesc, setNgoDesc] = useState('')
  const [ngoAddr, setNgoAddr] = useState('')

  // Govt Office state
  const [govName, setGovName] = useState('')
  const [govType, setGovType] = useState('municipality')
  const [govAddr, setGovAddr] = useState('')
  const [govPhone, setGovPhone] = useState('')

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await servicesApi.getCategories()).data,
  })

  const { data: hospitals } = useQuery({
    queryKey: ['hospitals-list'],
    queryFn: async () => (await healthcareApi.getHospitals()).data,
  })

  const categoriesList = Array.isArray(categories) ? categories : (categories as any)?.results || []
  const hospitalsList = Array.isArray(hospitals) ? hospitals : (hospitals as any)?.results || []

  // Mutations
  const createServiceMutation = useMutation({
    mutationFn: servicesApi.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      setSuccessMsg('Service created and activated successfully!')
      resetForms()
    },
    onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Failed to create service.'),
  })

  const createHospitalMutation = useMutation({
    mutationFn: healthcareApi.createHospital,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] })
      setSuccessMsg('Hospital created successfully!')
      resetForms()
    },
    onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Failed to create hospital.'),
  })

  const createDoctorMutation = useMutation({
    mutationFn: healthcareApi.createDoctor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      setSuccessMsg('Doctor profile created successfully!')
      resetForms()
    },
    onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Failed to create doctor profile.'),
  })

  const createEducationMutation = useMutation({
    mutationFn: educationApi.createInstitution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] })
      setSuccessMsg('Educational Institution created successfully!')
      resetForms()
    },
    onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Failed to create institution.'),
  })

  const createNgoMutation = useMutation({
    mutationFn: ngoApi.createNGO,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngo'] })
      setSuccessMsg('NGO registered successfully!')
      resetForms()
    },
    onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Failed to create NGO.'),
  })

  const createGovtMutation = useMutation({
    mutationFn: govApi.createOffice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gov-offices'] })
      setSuccessMsg('Government Office created successfully!')
      resetForms()
    },
    onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Failed to create Government Office.'),
  })

  const resetForms = () => {
    setServiceTitle(''); setServiceDesc(''); setServiceAddr(''); setServicePhone('')
    setHospName(''); setHospAddr(''); setHospPhone('')
    setDocName(''); setDocSpecialty(''); setDocPhone('')
    setEduName(''); setEduAddr(''); setEduPhone('')
    setNgoName(''); setNgoDesc(''); setNgoAddr('')
    setGovName(''); setGovAddr(''); setGovPhone('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg(''); setErrorMsg('')

    if (tab === 0) {
      if (!serviceTitle || !serviceCategory) return setErrorMsg('Title and category are required.')
      createServiceMutation.mutate({
        title: serviceTitle,
        category: serviceCategory,
        description: serviceDesc,
        address: serviceAddr,
        phone: servicePhone,
        status: 'active',
        is_verified: true,
      })
    } else if (tab === 1) {
      if (!hospName || !hospAddr) return setErrorMsg('Hospital name and address are required.')
      createHospitalMutation.mutate({
        name: hospName,
        hospital_type: (hospType as any) || 'general',
        address: hospAddr,
        phone: hospPhone,
        bed_count: hospBeds,
        available_beds: hospBeds,
        emergency_available: hospEmerg,
        is_verified: true,
      })
    } else if (tab === 2) {
      if (!docName || !docSpecialty) return setErrorMsg('Doctor name and specialty are required.')
      createDoctorMutation.mutate({
        full_name: docName,
        degree_summary: docSpecialty,
        current_position: docSpecialty,
        mobile: docPhone,
        consultation_fee: docFee,
      })
    } else if (tab === 3) {
      if (!eduName || !eduAddr) return setErrorMsg('Institution name and address are required.')
      createEducationMutation.mutate({
        name: eduName,
        institution_type: eduType,
        address: eduAddr,
        phone: eduPhone,
        established_year: eduEst,
        is_verified: true,
      })
    } else if (tab === 4) {
      if (!ngoName || !ngoAddr) return setErrorMsg('NGO name and address are required.')
      createNgoMutation.mutate({
        name: ngoName,
        focus_areas: [ngoSector],
        description: ngoDesc,
        address: ngoAddr,
        is_verified: true,
      })
    } else if (tab === 5) {
      if (!govName || !govAddr) return setErrorMsg('Office name and address are required.')
      createGovtMutation.mutate({
        name: govName,
        office_type: govType,
        address: govAddr,
        phone: govPhone,
      })
    }
  }

  const isPending = createServiceMutation.isPending || createHospitalMutation.isPending || createDoctorMutation.isPending || createEducationMutation.isPending || createNgoMutation.isPending || createGovtMutation.isPending

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        Admin Resource Creation
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setSuccessMsg(''); setErrorMsg('') }} variant="scrollable" scrollButtons="auto">
          <Tab label="Add Service" />
          <Tab label="Add Hospital" />
          <Tab label="Add Doctor" />
          <Tab label="Add Education" />
          <Tab label="Add NGO" />
          <Tab label="Add Govt Office" />
        </Tabs>
      </Box>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ p: 3 }}>
          {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}
          {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

          {/* TAB 0: Service */}
          {tab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Service Title" fullWidth value={serviceTitle} onChange={(e) => setServiceTitle(e.target.value)} required />
              <TextField select label="Category" fullWidth value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)} required>
                {categoriesList.map((cat: any) => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </TextField>
              <TextField label="Address / Location" fullWidth value={serviceAddr} onChange={(e) => setServiceAddr(e.target.value)} />
              <TextField label="Phone Number" fullWidth value={servicePhone} onChange={(e) => setServicePhone(e.target.value)} />
              <TextField multiline rows={3} label="Service Description" fullWidth value={serviceDesc} onChange={(e) => setServiceDesc(e.target.value)} />
            </Box>
          )}

          {/* TAB 1: Hospital */}
          {tab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Hospital Name" fullWidth value={hospName} onChange={(e) => setHospName(e.target.value)} required />
              <TextField select label="Hospital Type" fullWidth value={hospType} onChange={(e) => setHospType(e.target.value)}>
                <MenuItem value="general">General Hospital</MenuItem>
                <MenuItem value="specialized">Specialized Center</MenuItem>
                <MenuItem value="clinic">Medical Clinic</MenuItem>
              </TextField>
              <TextField label="Full Address" fullWidth value={hospAddr} onChange={(e) => setHospAddr(e.target.value)} required />
              <TextField label="Helpline Phone" fullWidth value={hospPhone} onChange={(e) => setHospPhone(e.target.value)} />
              <TextField type="number" label="Total Bed Capacity" fullWidth value={hospBeds} onChange={(e) => setHospBeds(Number(e.target.value))} />
              <FormControlLabel control={<Checkbox checked={hospEmerg} onChange={(e) => setHospEmerg(e.target.checked)} />} label="24/7 Emergency Services Available" />
            </Box>
          )}

          {/* TAB 2: Doctor */}
          {tab === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Doctor Full Name" fullWidth value={docName} onChange={(e) => setDocName(e.target.value)} required />
              <TextField label="Specialty (e.g. Cardiologist, Neurologist)" fullWidth value={docSpecialty} onChange={(e) => setDocSpecialty(e.target.value)} required />
              <TextField select label="Affiliated Hospital (Optional)" fullWidth value={docHospital} onChange={(e) => setDocHospital(e.target.value)}>
                <MenuItem value="">Independent Practice</MenuItem>
                {hospitalsList.map((h: any) => (
                  <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                ))}
              </TextField>
              <TextField label="Contact Phone" fullWidth value={docPhone} onChange={(e) => setDocPhone(e.target.value)} />
              <TextField type="number" label="Consultation Fee (BDT)" fullWidth value={docFee} onChange={(e) => setDocFee(Number(e.target.value))} />
            </Box>
          )}

          {/* TAB 3: Education */}
          {tab === 3 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Institution Name" fullWidth value={eduName} onChange={(e) => setEduName(e.target.value)} required />
              <TextField select label="Institution Type" fullWidth value={eduType} onChange={(e) => setEduType(e.target.value)}>
                <MenuItem value="school">School</MenuItem>
                <MenuItem value="college">College</MenuItem>
                <MenuItem value="university">University</MenuItem>
                <MenuItem value="madrasa">Madrasa</MenuItem>
                <MenuItem value="technical">Technical Institute</MenuItem>
                <MenuItem value="coaching">Coaching Center</MenuItem>
              </TextField>
              <TextField label="Full Address" fullWidth value={eduAddr} onChange={(e) => setEduAddr(e.target.value)} required />
              <TextField label="Phone Number" fullWidth value={eduPhone} onChange={(e) => setEduPhone(e.target.value)} />
              <TextField type="number" label="Established Year" fullWidth value={eduEst} onChange={(e) => setEduEst(Number(e.target.value))} />
            </Box>
          )}

          {/* TAB 4: NGO */}
          {tab === 4 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="NGO Name" fullWidth value={ngoName} onChange={(e) => setNgoName(e.target.value)} required />
              <TextField label="Sector / Cause" fullWidth value={ngoSector} onChange={(e) => setNgosector(e.target.value)} />
              <TextField label="Office Address" fullWidth value={ngoAddr} onChange={(e) => setNgoAddr(e.target.value)} required />
              <TextField multiline rows={3} label="NGO Description & Mission" fullWidth value={ngoDesc} onChange={(e) => setNgoDesc(e.target.value)} />
            </Box>
          )}

          {/* TAB 5: Govt Office */}
          {tab === 5 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Government Office Name" fullWidth value={govName} onChange={(e) => setGovName(e.target.value)} required />
              <TextField select label="Office Type" fullWidth value={govType} onChange={(e) => setGovType(e.target.value)}>
                <MenuItem value="municipality">Municipality</MenuItem>
                <MenuItem value="district">District Office</MenuItem>
                <MenuItem value="ministry">Ministry</MenuItem>
                <MenuItem value="police">Police Station</MenuItem>
                <MenuItem value="tax">Tax Office</MenuItem>
                <MenuItem value="land">Land Registry</MenuItem>
              </TextField>
              <TextField label="Address" fullWidth value={govAddr} onChange={(e) => setGovAddr(e.target.value)} required />
              <TextField label="Contact Phone" fullWidth value={govPhone} onChange={(e) => setGovPhone(e.target.value)} />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={isPending} sx={{ fontWeight: 700, px: 3 }}>
            {isPending ? <CircularProgress size={24} color="inherit" /> : 'Insert Resource'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
