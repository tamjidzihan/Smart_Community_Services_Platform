import { useState, useMemo } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import {
  Search,
  FilterList,
  Clear,
  Person,
  Star,
  EventAvailable,
} from '@mui/icons-material'
import { CircularProgress } from '@mui/material'
import { doctorApi, specialistApi, hospitalApi } from '../api/services'
import { DoctorCard } from '../components/healthcare/DoctorCard'
import { AppointmentBookingModal } from '../components/healthcare/AppointmentBookingModal'
import type { Doctor } from '../types'

export default function DoctorsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialist, setSelectedSpecialist] = useState('')
  const [selectedHospital, setSelectedHospital] = useState('')
  const [selectedGender, setSelectedGender] = useState('')
  const [availableTodayOnly, setAvailableTodayOnly] = useState(false)
  const [minRating, setMinRating] = useState<number | ''>('')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null)

  // Fetch Specialists for dropdown
  const { data: specialistsData } = useQuery({
    queryKey: ['specialists'],
    queryFn: async () => {
      const res = await specialistApi.getSpecialists({ page_size: 100 })
      return res.data?.results || res.data || []
    },
  })

  // Fetch Hospitals for filtering
  const { data: hospitalsData } = useQuery({
    queryKey: ['hospitals-list'],
    queryFn: async () => {
      const res = await hospitalApi.getHospitals({ status: 'active', page_size: 100 })
      return res.data?.results || res.data || []
    },
  })

  // Paginated Doctors Query (12 per page from backend)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['doctors', selectedSpecialist, selectedHospital, selectedGender, minRating, searchTerm],
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, any> = { page: pageParam, page_size: 12 }
      if (selectedSpecialist) params.specialist = selectedSpecialist
      if (selectedHospital) params.hospital = selectedHospital
      if (selectedGender) params.gender = selectedGender
      if (minRating) params.min_rating = minRating
      if (searchTerm.trim()) params.search = searchTerm.trim()

      const res = await doctorApi.getDoctors(params)
      return res.data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      if (lastPage?.next && lastPage.current_page < lastPage.total_pages) {
        return lastPage.current_page + 1
      }
      return undefined
    },
  })

  const allDoctors = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((p: any) => p?.results || [])
  }, [data])

  const totalCount = data?.pages?.[0]?.count ?? allDoctors.length

  const doctorsList: Doctor[] = useMemo(() => {
    if (availableTodayOnly) {
      return allDoctors.filter((d: Doctor) => d.availability?.status === 'AVAILABLE_TODAY')
    }
    return allDoctors
  }, [allDoctors, availableTodayOnly])

  const hasActiveFilters = Boolean(
    selectedSpecialist || selectedHospital || selectedGender || minRating || availableTodayOnly || searchTerm
  )

  const clearFilters = () => {
    setSelectedSpecialist('')
    setSelectedHospital('')
    setSelectedGender('')
    setMinRating('')
    setAvailableTodayOnly(false)
    setSearchTerm('')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white rounded-3xl p-6 sm:p-10 mb-8 shadow-sm">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2">Find Qualified Doctors & Specialists</h1>
        <p className="text-teal-100/90 text-sm sm:text-base max-w-2xl">
          Browse verified physicians, check schedules, leaves, and book your healthcare consultations.
        </p>

        {/* Top Search Input */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by doctor name, qualification, specialty, or hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-xs"
            />
          </div>
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-teal-700/80 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"
          >
            <FilterList fontSize="small" />
            Filters {hasActiveFilters && '(Active)'}
          </button>
        </div>
      </div>

      {/* Layout: Sidebar Filters + Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <div className={`md:block ${mobileFilterOpen ? 'block' : 'hidden'} md:col-span-1`}>
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs sticky top-24 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FilterList className="text-teal-600" fontSize="small" /> Filters
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-0.5"
                >
                  <Clear style={{ fontSize: 14 }} /> Reset
                </button>
              )}
            </div>

            {/* Specialist Dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Specialty
              </label>
              <select
                value={selectedSpecialist}
                onChange={(e) => setSelectedSpecialist(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Specialties</option>
                {Array.isArray(specialistsData) &&
                  specialistsData.map((spec: any) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Hospital Dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Hospital
              </label>
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Hospitals</option>
                {Array.isArray(hospitalsData) &&
                  hospitalsData.map((hosp: any) => (
                    <option key={hosp.id} value={hosp.id}>
                      {hosp.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Gender Filter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Doctor Gender
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { value: '', label: 'All' },
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ].map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setSelectedGender(g.value)}
                    className={`py-2 px-1 rounded-xl text-center font-medium border transition-all ${
                      selectedGender === g.value
                        ? 'bg-teal-600 text-white border-teal-600 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Filter Toggle */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={availableTodayOnly}
                  onChange={(e) => setAvailableTodayOnly(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                <span className="flex items-center gap-1">
                  <EventAvailable fontSize="small" className="text-emerald-600" />
                  Available Today Only
                </span>
              </label>
            </div>

            {/* Minimum Rating */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Minimum Rating
              </label>
              <div className="flex items-center gap-2">
                {[4, 4.5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setMinRating(minRating === rate ? '' : rate)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1 transition-all ${
                      minRating === rate
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Star style={{ fontSize: 14 }} className="text-amber-400" />
                    {rate}+ Stars
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="md:col-span-3">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-slate-600 font-medium">
              Showing <strong className="text-slate-900">{doctorsList.length}</strong> of <strong className="text-slate-900">{totalCount}</strong> verified doctors
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse space-y-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-slate-200 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-10 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 text-red-700 p-8 rounded-2xl border border-red-200 text-center">
              <h3 className="font-bold text-base mb-1">Failed to load doctors</h3>
              <p className="text-xs">Please check your network connection and try again.</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && doctorsList.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Person style={{ fontSize: 32 }} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No Doctors Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                We couldn't find any doctors matching your search or filters. Try clearing some filters.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}

          {/* Doctors Grid */}
          {!isLoading && !error && doctorsList.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {doctorsList.map((doc) => (
                  <DoctorCard
                    key={doc.id}
                    doctor={doc}
                    onBook={(d) => setBookingDoctor(d)}
                  />
                ))}
              </div>

              {/* View More Doctors Controls (Backend Pagination) */}
              {hasNextPage && (
                <div className="mt-10 p-6 bg-slate-50 rounded-3xl border border-slate-200/80 text-center space-y-3">
                  <p className="text-xs font-medium text-slate-500">
                    Showing {doctorsList.length} of {totalCount} verified doctors
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
                    >
                      {isFetchingNextPage && <CircularProgress size={16} color="inherit" />}
                      View More Doctors (+12)
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Appointment Booking Modal */}
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
