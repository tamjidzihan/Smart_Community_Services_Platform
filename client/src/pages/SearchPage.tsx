import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  LocalHospital,
  Person,
  Apartment,
  MedicalServices,
  ArrowForward,
} from '@mui/icons-material'
import { searchApi } from '../api/services'
import { DoctorCard } from '../components/healthcare/DoctorCard'
import { HospitalCard } from '../components/healthcare/HospitalCard'
import { AppointmentBookingModal } from '../components/healthcare/AppointmentBookingModal'
import type { Doctor } from '../types'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryParam = searchParams.get('q') || ''
  const [query, setQuery] = useState(queryParam)
  const [debouncedQuery, setDebouncedQuery] = useState(queryParam)
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query)
      if (query.trim()) {
        setSearchParams({ q: query.trim() })
      } else {
        setSearchParams({})
      }
    }, 400)
    return () => clearTimeout(handler)
  }, [query, setSearchParams])

  const { data: results, isLoading } = useQuery({
    queryKey: ['healthcare-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { hospitals: [], doctors: [], departments: [], specialists: [] }
      }
      const res = await searchApi.healthcareSearch(debouncedQuery)
      return res.data
    },
    enabled: debouncedQuery.length >= 2,
  })

  const doctors = results?.doctors || []
  const hospitals = results?.hospitals || []
  const departments = results?.departments || []
  const specialists = results?.specialists || []

  const totalResults = doctors.length + hospitals.length + departments.length + specialists.length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-10 mb-8 shadow-sm">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2">Unified Healthcare Search</h1>
        <p className="text-teal-100 text-sm sm:text-base max-w-2xl">
          Search across certified doctors, hospitals, clinical departments, and medical specialties.
        </p>

        {/* Search Input Bar */}
        <div className="relative mt-6 max-w-3xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Type doctor, hospital, specialty, or condition (e.g. Cardiologist, DMCH, Neurology)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white text-slate-900 placeholder-slate-400 text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-md"
            autoFocus
          />
        </div>
      </div>

      {isLoading && (
        <div className="py-16 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Searching healthcare database...</p>
        </div>
      )}

      {!isLoading && debouncedQuery.length >= 2 && totalResults === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Results for "{debouncedQuery}"</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try checking for spelling errors or searching with broader keywords like "Medicine", "Dhaka", or "Pediatrics".
          </p>
        </div>
      )}

      {!isLoading && totalResults > 0 && (
        <div className="space-y-10">
          {/* Doctors Section */}
          {doctors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Person className="text-teal-600" /> Doctors ({doctors.length})
                </h2>
                <Link to={`/doctors?search=${encodeURIComponent(debouncedQuery)}`} className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-0.5">
                  View all <ArrowForward style={{ fontSize: 14 }} />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {doctors.map((doc) => (
                  <DoctorCard key={doc.id} doctor={doc} onBook={(d) => setBookingDoctor(d)} />
                ))}
              </div>
            </div>
          )}

          {/* Hospitals Section */}
          {hospitals.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <LocalHospital className="text-teal-600" /> Hospitals & Centres ({hospitals.length})
                </h2>
                <Link to={`/hospitals?search=${encodeURIComponent(debouncedQuery)}`} className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-0.5">
                  View all <ArrowForward style={{ fontSize: 14 }} />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {hospitals.map((hosp) => (
                  <HospitalCard key={hosp.id} hospital={hosp} />
                ))}
              </div>
            </div>
          )}

          {/* Specialties & Departments Section */}
          {(specialists.length > 0 || departments.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Specialties */}
              {specialists.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MedicalServices className="text-teal-600" /> Matching Specialties
                  </h3>
                  <div className="space-y-2.5">
                    {specialists.map((spec) => (
                      <Link
                        key={spec.id}
                        to={`/doctors?specialist=${spec.id}`}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200/60 transition-colors"
                      >
                        <span className="font-semibold text-slate-800 text-sm">{spec.name}</span>
                        <span className="text-xs text-teal-700 font-bold">Find Doctors →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Departments */}
              {departments.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Apartment className="text-teal-600" /> Hospital Departments
                  </h3>
                  <div className="space-y-2.5">
                    {departments.map((dept) => (
                      <Link
                        key={dept.id}
                        to={`/hospitals/${dept.hospital}`}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200/60 transition-colors"
                      >
                        <div>
                          <span className="font-semibold text-slate-800 text-sm block">{dept.name}</span>
                          <span className="text-slate-400 text-xs">{dept.hospital_name}</span>
                        </div>
                        <span className="text-xs text-teal-700 font-bold">View Hospital →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
