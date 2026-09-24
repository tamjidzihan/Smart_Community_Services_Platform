/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Favorite,
  Psychology,
  AccessibilityNew,
  ChildCare,
  PregnantWoman,
  Face,
  Visibility,
  Biotech,
  MedicalServices,
  WaterDrop,
  SmartToy,
  Verified,
  ArrowForward,
  LocationOn,
  LocalHospital,
  Category,
  Clear,
  Person,
  FilterAlt,
} from '@mui/icons-material'
import { Autocomplete, TextField } from '@mui/material'
import { doctorApi, hospitalApi, departmentApi } from '../api/services'
import { DoctorCard } from '../components/healthcare/DoctorCard'
import { HospitalCard } from '../components/healthcare/HospitalCard'
import { AppointmentBookingModal } from '../components/healthcare/AppointmentBookingModal'
import type { Doctor, Hospital } from '../types'

export default function HomePage() {
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null)

  // ─── Fast Side-by-Side Filter States ──────────────────────────────
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [areaInput, setAreaInput] = useState('')
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)
  const [hospitalInput, setHospitalInput] = useState('')
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [deptInput, setDeptInput] = useState('')

  // 1. Load Area options early (lightweight list of strings)
  const { data: locationsData, isLoading: isLoadingAreas } = useQuery({
    queryKey: ['hospital-locations-early'],
    queryFn: async () => {
      const res = await hospitalApi.getLocations()
      const areas = res.data?.areas || []
      const cities = res.data?.cities || []
      // Combine areas and cities uniquely
      return Array.from(new Set([...areas, ...cities])).filter(Boolean)
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  })

  // 2. Load Common Departments early (lightweight list of strings)
  const { data: commonDeptsData, isLoading: isLoadingDepts } = useQuery({
    queryKey: ['common-departments-early'],
    queryFn: async () => {
      const res = await departmentApi.getCommonDepartments()
      return res.data || []
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  })

  // 3. Load Hospitals dynamically when area or hospital name is typed/selected
  const { data: hospitalsListData, isLoading: isLoadingHospitals } = useQuery({
    queryKey: ['hospitals-dropdown', selectedArea, hospitalInput],
    queryFn: async () => {
      const params: Record<string, any> = { status: 'active', page_size: 50 }
      if (selectedArea) params.area = selectedArea
      if (hospitalInput.trim()) params.search = hospitalInput.trim()
      const res = await hospitalApi.getHospitals(params)
      return res.data?.results || []
    },
    enabled: Boolean(selectedArea || hospitalInput.length >= 2),
    staleTime: 1000 * 60 * 5,
  })

  // 4. Load matching Doctors based on Area, Hospital, and Department
  const hasSelectedFilters = Boolean(selectedArea || selectedHospital || selectedDept)

  const { data: filteredDoctorsData, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['home-doctors-filter', selectedArea, selectedHospital?.id, selectedDept],
    queryFn: async () => {
      const params: Record<string, any> = { page_size: 12 }
      if (selectedArea) params.area = selectedArea
      if (selectedHospital?.id) params.hospital = selectedHospital.id
      if (selectedDept) params.department_name = selectedDept
      const res = await doctorApi.getDoctors(params)
      return res.data?.results || []
    },
    staleTime: 1000 * 60 * 2,
  })

  const clearDropdownFilters = () => {
    setSelectedArea(null)
    setAreaInput('')
    setSelectedHospital(null)
    setHospitalInput('')
    setSelectedDept(null)
    setDeptInput('')
  }

  // Fetch Featured Doctors
  const { data: featuredDoctors } = useQuery({
    queryKey: ['featured-doctors'],
    queryFn: async () => {
      const res = await doctorApi.getDoctors()
      const list = res.data?.results || res.data || []
      return list.slice(0, 4)
    },
  })

  // Fetch Top Hospitals
  const { data: topHospitals } = useQuery({
    queryKey: ['top-hospitals'],
    queryFn: async () => {
      const res = await hospitalApi.getHospitals({ status: 'active' })
      const list = res.data?.results || res.data || []
      return list.slice(0, 3)
    },
  })

  const healthcareCategories = [
    {
      name: 'Heart & Cardiology',
      icon: <Favorite className="text-rose-500" />,
      bg: 'bg-rose-50',
      query: 'Cardiology',
      desc: 'Hypertension, ECG, Angiogram',
    },
    {
      name: 'Brain & Neurology',
      icon: <Psychology className="text-indigo-500" />,
      bg: 'bg-indigo-50',
      query: 'Neurology',
      desc: 'Stroke, Headaches, Nerve care',
    },
    {
      name: 'Orthopedics & Joints',
      icon: <AccessibilityNew className="text-blue-500" />,
      bg: 'bg-blue-50',
      query: 'Orthopedics',
      desc: 'Fractures, Spine & Arthritis',
    },
    {
      name: 'Child Health (Pediatrics)',
      icon: <ChildCare className="text-amber-500" />,
      bg: 'bg-amber-50',
      query: 'Pediatrics',
      desc: 'Newborn care, Vaccinations',
    },
    {
      name: 'Women & Gynecology',
      icon: <PregnantWoman className="text-pink-500" />,
      bg: 'bg-pink-50',
      query: 'Gynecology',
      desc: 'Maternity, Prenatal, Ultrasound',
    },
    {
      name: 'Skin & Dermatology',
      icon: <Face className="text-teal-500" />,
      bg: 'bg-teal-50',
      query: 'Dermatology',
      desc: 'Skin care, Allergies, Hair',
    },
    {
      name: 'Eye Care (Ophthalmology)',
      icon: <Visibility className="text-cyan-500" />,
      bg: 'bg-cyan-50',
      query: 'Ophthalmology',
      desc: 'Vision test, Cataract, Lasik',
    },
    {
      name: 'Chest & Respiratory',
      icon: <Biotech className="text-emerald-500" />,
      bg: 'bg-emerald-50',
      query: 'Medicine & Chest Medicine',
      desc: 'Asthma, Lung care, Pulmonology',
    },
    {
      name: 'General Internal Medicine',
      icon: <MedicalServices className="text-violet-500" />,
      bg: 'bg-violet-50',
      query: 'Medicine',
      desc: 'Fever, Diabetes, Thyroid, Gastro',
    },
  ]

  return (
    <div className="space-y-16 pb-16">
      {/* ─── Hero Section with Background Doctor Image & Integrated Filter ─── */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Background Image with Ambient Glow & Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-luminosity scale-105 filter pointer-events-none"
          style={{ backgroundImage: `url('/images/doctor_hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto space-y-10">
          {/* Hero Headline & Intro */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-bold tracking-wide backdrop-blur-md">
              <Verified style={{ fontSize: 16 }} />
              <span>Smart Health Care Network • 225+ Hospitals • 1,000+ Verified Doctors</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Compassionate Care.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-100 to-emerald-400">
                Connected by Smart Tech.
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Instantly discover top-tier specialists, accredited hospital clinical chambers, emergency care, and voluntary blood donors in your area.
            </p>
          </div>

          {/* ─── Integrated Side-by-Side Filter Card inside Hero ─── */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl p-6 sm:p-8 text-slate-900 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/80">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold mb-1">
                  <FilterAlt style={{ fontSize: 16 }} /> Instant Specialist & Hospital Matcher
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Find Doctors by Area, Hospital & Department
                </h2>
                <p className="text-xs text-slate-500">
                  Select your area, facility, and specialty to immediately view verified consultants.
                </p>
              </div>

              {hasSelectedFilters && (
                <button
                  onClick={clearDropdownFilters}
                  className="self-start md:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
                >
                  <Clear style={{ fontSize: 14 }} />
                  Reset Filters
                </button>
              )}
            </div>

            {/* 3 Side-by-Side Searchable Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              {/* 1. Area Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <LocationOn className="text-teal-600" style={{ fontSize: 18 }} />
                  1. Select / Search Area
                </label>
                <Autocomplete
                  options={locationsData || []}
                  loading={isLoadingAreas}
                  value={selectedArea}
                  onChange={(_, newValue) => {
                    setSelectedArea(newValue)
                    setSelectedHospital(null)
                  }}
                  inputValue={areaInput}
                  onInputChange={(_, newInputValue) => setAreaInput(newInputValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Type Area (e.g. Dhanmondi, Uttara)..."
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '16px',
                          backgroundColor: '#F8FAFC',
                          fontSize: '13px',
                        },
                      }}
                    />
                  )}
                />
              </div>

              {/* 2. Hospital Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <LocalHospital className="text-emerald-600" style={{ fontSize: 18 }} />
                  2. Select / Search Hospital
                </label>
                <Autocomplete
                  options={hospitalsListData || []}
                  loading={isLoadingHospitals}
                  getOptionLabel={(option) => (typeof option === 'string' ? option : option.name || '')}
                  value={selectedHospital}
                  onChange={(_, newValue) => setSelectedHospital(newValue)}
                  inputValue={hospitalInput}
                  onInputChange={(_, newInputValue) => setHospitalInput(newInputValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={
                        selectedArea
                          ? `Hospitals in ${selectedArea}...`
                          : 'Type hospital name (e.g. Square)...'
                      }
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '16px',
                          backgroundColor: '#F8FAFC',
                          fontSize: '13px',
                        },
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id} className="p-2 text-xs hover:bg-slate-50 cursor-pointer">
                      <div className="font-bold text-slate-900">{option.name}</div>
                      <div className="text-[11px] text-slate-500">{option.area ? `${option.area}, ` : ''}{option.city || ''}</div>
                    </li>
                  )}
                />
              </div>

              {/* 3. Department Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Category className="text-indigo-600" style={{ fontSize: 18 }} />
                  3. Select / Search Department
                </label>
                <Autocomplete
                  options={commonDeptsData || []}
                  loading={isLoadingDepts}
                  value={selectedDept}
                  onChange={(_, newValue) => setSelectedDept(newValue)}
                  inputValue={deptInput}
                  onInputChange={(_, newInputValue) => setDeptInput(newInputValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Type Department (e.g. Cardiology)..."
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '16px',
                          backgroundColor: '#F8FAFC',
                          fontSize: '13px',
                        },
                      }}
                    />
                  )}
                />
              </div>
            </div>

            {/* Active Filter Summary Badges */}
            {hasSelectedFilters && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-500">Active Criteria:</span>
                {selectedArea && (
                  <span className="px-3 py-1 bg-teal-50 text-teal-800 rounded-full font-semibold flex items-center gap-1">
                    <LocationOn style={{ fontSize: 14 }} /> Area: {selectedArea}
                  </span>
                )}
                {selectedHospital && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full font-semibold flex items-center gap-1">
                    <LocalHospital style={{ fontSize: 14 }} /> Hospital: {selectedHospital.name}
                  </span>
                )}
                {selectedDept && (
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-800 rounded-full font-semibold flex items-center gap-1">
                    <Category style={{ fontSize: 14 }} /> Dept: {selectedDept}
                  </span>
                )}
              </div>
            )}

            {/* Filtered Doctor Results inside Card */}
            {hasSelectedFilters && (
              <div className="mt-8 pt-6 border-t border-slate-200/80">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Matching Doctors ({filteredDoctorsData?.length || 0})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Verified physicians matching your chosen criteria
                    </p>
                  </div>

                  <Link
                    to={`/doctors?${selectedArea ? `area=${encodeURIComponent(selectedArea)}&` : ''}${selectedHospital ? `hospital=${encodeURIComponent(selectedHospital.id)}&` : ''}${selectedDept ? `department=${encodeURIComponent(selectedDept)}` : ''}`}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline"
                  >
                    View in Full Directory <ArrowForward style={{ fontSize: 14 }} />
                  </Link>
                </div>

                {isLoadingDoctors && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-slate-50 rounded-2xl p-4 animate-pulse space-y-3">
                        <div className="w-14 h-14 bg-slate-200 rounded-2xl" />
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                )}

                {!isLoadingDoctors && filteredDoctorsData && filteredDoctorsData.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {filteredDoctorsData.map((doc: Doctor) => (
                      <DoctorCard key={doc.id} doctor={doc} onBook={(d) => setBookingDoctor(d)} />
                    ))}
                  </div>
                )}

                {!isLoadingDoctors && (!filteredDoctorsData || filteredDoctorsData.length === 0) && (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <Person className="text-slate-400 mx-auto mb-2" style={{ fontSize: 32 }} />
                    <div className="text-sm font-bold text-slate-800 mb-1">No doctors found for this combination</div>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                      Try clearing one of the filters or searching across nearby hospital branches.
                    </p>
                    <button
                      onClick={clearDropdownFilters}
                      className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors"
                    >
                      Clear Filter Criteria
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Stats Ribbon */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-slate-800/80 text-center">
            <div>
              <div className="text-2xl font-bold text-white">1,000+</div>
              <div className="text-xs text-slate-400">Verified Doctors</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">225+</div>
              <div className="text-xs text-slate-400">Hospitals & Centers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-teal-300">24/7</div>
              <div className="text-xs text-slate-400">Emergency Care</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rose-400">1,000+</div>
              <div className="text-xs text-slate-400">Blood Donors</div>
            </div>
          </div>
        </div>
      </section>

      {/* Discovery by Healthcare Needs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">What healthcare do you need?</h2>
          <p className="text-slate-500 text-sm mt-1.5">
            Select a specialty to explore top departments, consultants, and clinical chambers.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
          {healthcareCategories.map((cat, idx) => (
            <Link
              key={idx}
              to={`/doctors?search=${encodeURIComponent(cat.query)}`}
              className="group bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:border-teal-500/50 hover:shadow-md transition-all flex items-start gap-4"
            >
              <div className={`w-12 h-12 rounded-2xl ${cat.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-teal-600 transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Top Doctors Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Consult Top Doctors</h2>
            <p className="text-slate-500 text-sm mt-1">Verified specialist doctors and faculty professors</p>
          </div>
          <Link
            to="/doctors"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 hover:text-teal-800"
          >
            <span>View All Doctors</span>
            <ArrowForward fontSize="small" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredDoctors && featuredDoctors.length > 0 ? (
            featuredDoctors.map((doc: Doctor) => (
              <DoctorCard key={doc.id} doctor={doc} onBook={(d) => setBookingDoctor(d)} />
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-slate-400 text-sm">
              Loading top doctors...
            </div>
          )}
        </div>
      </section>

      {/* Top Hospitals & Medical Centers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Top Hospitals & Branches</h2>
            <p className="text-slate-500 text-sm mt-1">Equipped with 24/7 emergency, ICU, and modern diagnostics</p>
          </div>
          <Link
            to="/hospitals"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 hover:text-teal-800"
          >
            <span>Explore Hospitals</span>
            <ArrowForward fontSize="small" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topHospitals && topHospitals.length > 0 ? (
            topHospitals.map((hosp: Hospital) => (
              <HospitalCard key={hosp.id} hospital={hosp} />
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-slate-400 text-sm">
              Loading hospitals...
            </div>
          )}
        </div>
      </section>

      {/* Blood Donation Network Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-10 shadow-md border border-rose-900/30 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold mb-3 border border-rose-500/30">
              <WaterDrop fontSize="small" /> Voluntary Blood Donation Network
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-2">Need Blood or Want to Save Lives?</h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Connect directly with verified compatible voluntary blood donors in your area or broadcast an emergency blood transfusion request in seconds.
            </p>
          </div>
          <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/blood-request"
              className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-colors shadow-md"
            >
              Post Blood Request
            </Link>
            <Link
              to="/blood-donors"
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-colors"
            >
              Explore Donors Network
            </Link>
          </div>
        </div>
      </section>

      {/* AI Assistant Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0">
              <SmartToy style={{ fontSize: 36 }} />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold">Smart Health AI Assistant</h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
                Describe your health symptoms or care requirements in plain language. Our AI assistant will guide you to the right department, specialist, and hospital.
              </p>
            </div>
          </div>
          <Link
            to="/ai-assistant"
            className="px-6 py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors shrink-0 shadow-md"
          >
            Chat with Health Assistant
          </Link>
        </div>
      </section>

      {/* Booking Modal */}
      {bookingDoctor && (
        <AppointmentBookingModal
          doctor={bookingDoctor}
          open={!!bookingDoctor}
          onClose={() => setBookingDoctor(null)}
        />
      )}
    </div>
  )
}
