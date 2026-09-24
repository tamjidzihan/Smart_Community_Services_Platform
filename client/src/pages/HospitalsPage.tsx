import { useState, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import {
  Search,
  FilterList,
  Clear,
  LocalHospital,
  Emergency,
  AccessTime,
  Star,
} from '@mui/icons-material'
import { CircularProgress } from '@mui/material'
import { hospitalApi } from '../api/services'
import { HospitalCard } from '../components/healthcare/HospitalCard'
import type { Hospital } from '../types'

export default function HospitalsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [emergencyOnly, setEmergencyOnly] = useState(false)
  const [open24HoursOnly, setOpen24HoursOnly] = useState(false)
  const [minRating, setMinRating] = useState<number | ''>('')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['hospitals', selectedType, selectedCity, emergencyOnly, open24HoursOnly, minRating, searchTerm],
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, any> = { status: 'active', page: pageParam, page_size: 12 }
      if (selectedType) params.hospital_type = selectedType
      if (selectedCity) params.city = selectedCity
      if (emergencyOnly) params.emergency_available = true
      if (open24HoursOnly) params.open_24_hours = true
      if (minRating) params.min_rating = minRating
      if (searchTerm.trim()) params.search = searchTerm.trim()

      const res = await hospitalApi.getHospitals(params)
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

  const hospitalsList: Hospital[] = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((p: any) => p?.results || [])
  }, [data])

  const totalCount = data?.pages?.[0]?.count ?? hospitalsList.length

  const hasActiveFilters = Boolean(
    selectedType || selectedCity || emergencyOnly || open24HoursOnly || minRating || searchTerm
  )

  const clearFilters = () => {
    setSelectedType('')
    setSelectedCity('')
    setEmergencyOnly(false)
    setOpen24HoursOnly(false)
    setMinRating('')
    setSearchTerm('')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 mb-8 shadow-sm">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2">Hospitals & Medical Centres</h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
          Discover top-tier hospitals, specialized clinical institutes, 24/7 emergency departments, and diagnostic centers.
        </p>

        {/* Top Search */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search hospitals by name, area, city, or medical services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-xs"
            />
          </div>
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-teal-800 text-white text-sm font-semibold transition-colors"
          >
            <FilterList fontSize="small" />
            Filters {hasActiveFilters && '(Active)'}
          </button>
        </div>
      </div>

      {/* Grid: Filters Sidebar + Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className={`md:block ${mobileFilterOpen ? 'block' : 'hidden'} md:col-span-1`}>
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs sticky top-24 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FilterList className="text-teal-600" fontSize="small" /> Hospital Filters
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

            {/* Hospital Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Facility Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Facility Types</option>
                <option value="general">General Hospital</option>
                <option value="specialized">Specialized Hospital</option>
                <option value="tertiary">Tertiary Care Hospital</option>
                <option value="clinic">Clinic</option>
                <option value="diagnostic">Diagnostic Center</option>
                <option value="dental">Dental Clinic</option>
                <option value="eye">Eye Hospital</option>
                <option value="maternity">Maternity Hospital</option>
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                City / Region
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Cities</option>
                <option value="Dhaka">Dhaka</option>
                <option value="Chittagong">Chittagong</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Rajshahi">Rajshahi</option>
                <option value="Khulna">Khulna</option>
                <option value="Barisal">Barisal</option>
                <option value="Rangpur">Rangpur</option>
                <option value="Mymensingh">Mymensingh</option>
              </select>
            </div>

            {/* Emergency & 24/7 Toggles */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={emergencyOnly}
                  onChange={(e) => setEmergencyOnly(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                />
                <span className="flex items-center gap-1 text-red-700">
                  <Emergency fontSize="small" />
                  24/7 Emergency Available
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={open24HoursOnly}
                  onChange={(e) => setOpen24HoursOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="flex items-center gap-1 text-emerald-700">
                  <AccessTime fontSize="small" />
                  Open 24 Hours
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
              Showing <strong className="text-slate-900">{hospitalsList.length}</strong> of <strong className="text-slate-900">{totalCount}</strong> hospitals
            </p>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                  <div className="h-44 bg-slate-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-10 bg-slate-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-700 p-8 rounded-2xl border border-red-200 text-center">
              <h3 className="font-bold text-base mb-1">Failed to load hospitals</h3>
              <p className="text-xs">Please check your internet connection and try again.</p>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && hospitalsList.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LocalHospital style={{ fontSize: 32 }} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No Hospitals Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                No hospitals match your search criteria. Try adjusting your filters.
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

          {/* Grid */}
          {!isLoading && !error && hospitalsList.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {hospitalsList.map((hosp) => (
                  <HospitalCard key={hosp.id} hospital={hosp} />
                ))}
              </div>

              {/* View More Hospitals Controls (Backend Pagination) */}
              {hasNextPage && (
                <div className="mt-10 p-6 bg-slate-50 rounded-3xl border border-slate-200/80 text-center space-y-3">
                  <p className="text-xs font-medium text-slate-500">
                    Showing {hospitalsList.length} of {totalCount} hospitals & medical centres
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
                    >
                      {isFetchingNextPage && <CircularProgress size={16} color="inherit" />}
                      View More Hospitals (+12)
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
