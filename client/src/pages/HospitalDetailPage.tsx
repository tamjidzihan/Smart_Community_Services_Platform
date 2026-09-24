import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Star,
  LocationOn,
  Phone,
  Email,
  Language,
  Emergency,
  AccessTime,
  Apartment,
  Group,
  Hotel,
  ArrowBack,
  Verified,
  Directions,
} from '@mui/icons-material'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { hospitalApi } from '../api/services'
import { DoctorCard } from '../components/healthcare/DoctorCard'
import { AppointmentBookingModal } from '../components/healthcare/AppointmentBookingModal'
import type { Doctor } from '../types'

// Fix default leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function HospitalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<'departments' | 'doctors' | 'branches' | 'about'>('departments')
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null)
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null)

  // Fetch Hospital details
  const { data: hospital, isLoading, error } = useQuery({
    queryKey: ['hospital', id],
    queryFn: async () => {
      const res = await hospitalApi.getHospital(id!)
      return res.data
    },
    enabled: !!id,
  })

  // Fetch Hospital Doctors
  const { data: hospitalDoctors } = useQuery({
    queryKey: ['hospital-doctors', id],
    queryFn: async () => {
      const res = await hospitalApi.getDoctors(id!)
      return res.data || []
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (error || !hospital) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 inline-block mb-6">
          <h2 className="text-xl font-bold mb-2">Hospital Not Found</h2>
          <p className="text-sm">We couldn't load the hospital you requested.</p>
        </div>
        <div>
          <Link
            to="/hospitals"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
          >
            <ArrowBack fontSize="small" /> Back to Hospitals Directory
          </Link>
        </div>
      </div>
    )
  }

  const doctorsList: Doctor[] = Array.isArray(hospitalDoctors) ? hospitalDoctors : []
  const filteredDoctors = selectedDeptId
    ? doctorsList.filter((d) =>
        d.hospital_affiliations?.some((aff) => aff.department === selectedDeptId)
      )
    : doctorsList

  const hasCoordinates = hospital.latitude && hospital.longitude

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
        <Link to="/" className="hover:text-teal-600 transition-colors">Home</Link>
        <span>/</span>
        <Link to="/hospitals" className="hover:text-teal-600 transition-colors">Hospitals</Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold truncate">{hospital.name}</span>
      </nav>

      {/* Hospital Hero Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden mb-8">
        <div className="relative h-64 sm:h-80 bg-slate-900">
          <img
            src={
              hospital.cover_image ||
              'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1200&q=80'
            }
            alt={hospital.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Hospital Header Content */}
          <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-600 text-white shadow-xs">
                  {hospital.hospital_type.replace('_', ' ')}
                </span>
                {hospital.is_verified && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white flex items-center gap-1">
                    <Verified style={{ fontSize: 15 }} /> Verified
                  </span>
                )}
                {hospital.open_24_hours && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/80 backdrop-blur-md text-white flex items-center gap-1">
                    <AccessTime style={{ fontSize: 15 }} /> Open 24/7
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold">{hospital.name}</h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 flex items-center gap-1.5">
                <LocationOn style={{ fontSize: 16 }} className="text-teal-400 shrink-0" />
                <span>{hospital.address}{hospital.city ? `, ${hospital.city}` : ''}</span>
              </p>
            </div>

            {/* Ratings & Helpline */}
            <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
              <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 text-white font-bold text-sm">
                <Star style={{ fontSize: 18 }} className="text-amber-400" />
                <span>{hospital.average_rating > 0 ? hospital.average_rating.toFixed(1) : '5.0'}</span>
                <span className="text-slate-300 text-xs font-normal">({hospital.review_count || 0})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Capabilities Strip */}
        <div className="p-4 sm:p-6 bg-slate-50/70 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Apartment />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Departments</span>
              <strong className="text-slate-800 text-sm">{hospital.departments?.length ?? 0} Departments</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Group />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Doctors</span>
              <strong className="text-slate-800 text-sm">{doctorsList.length} Specialist Doctors</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Hotel />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Beds Available</span>
              <strong className="text-slate-800 text-sm">{hospital.available_beds || hospital.bed_count || 'N/A'}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Emergency />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Emergency Hotline</span>
              <strong className="text-red-700 text-sm">{hospital.emergency_phone || hospital.phone || '999'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-8 overflow-x-auto pb-1">
        {[
          { key: 'departments', label: `Departments (${hospital.departments?.length ?? 0})` },
          { key: 'doctors', label: `Doctors Directory (${doctorsList.length})` },
          { key: 'branches', label: `Branches (${hospital.branches?.length ?? 0})` },
          { key: 'about', label: 'About & Location Map' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key as any)
              if (tab.key === 'doctors') setSelectedDeptId(null)
            }}
            className={`py-3 px-5 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Departments Grid */}
      {activeTab === 'departments' && (
        <div>
          {hospital.departments && hospital.departments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {hospital.departments.map((dept) => (
                <div
                  key={dept.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-teal-400/60 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg">
                        <Apartment />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{dept.name}</h3>
                        <p className="text-teal-700 text-xs font-semibold">
                          {dept.doctors_count ?? 0} Associated Doctors
                        </p>
                      </div>
                    </div>
                    {dept.description && (
                      <p className="text-slate-600 text-xs leading-relaxed line-clamp-3 mb-4">
                        {dept.description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDeptId(dept.id)
                      setActiveTab('doctors')
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-teal-50 text-teal-800 font-bold text-xs transition-colors border border-slate-200"
                  >
                    View Doctors in this Department →
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <p className="text-slate-500 text-sm">No departments listed for this hospital yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Doctors Directory */}
      {activeTab === 'doctors' && (
        <div>
          {selectedDeptId && (
            <div className="mb-6 flex items-center justify-between bg-teal-50 border border-teal-100 rounded-2xl p-4">
              <p className="text-xs text-teal-900 font-semibold">
                Filtering doctors for selected department
              </p>
              <button
                onClick={() => setSelectedDeptId(null)}
                className="text-xs text-teal-800 font-bold hover:underline"
              >
                Show All Doctors
              </button>
            </div>
          )}

          {filteredDoctors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDoctors.map((doc) => (
                <DoctorCard
                  key={doc.id}
                  doctor={doc}
                  onBook={(d) => setBookingDoctor(d)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <p className="text-slate-500 text-sm">No doctors found for this selection.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Branches */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          {hospital.branches && hospital.branches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {hospital.branches.map((br) => (
                <div
                  key={br.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-900 text-base">{br.name}</h3>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {br.opening_hours || '24/7 Open'}
                      </span>
                    </div>

                    <p className="text-slate-600 text-xs flex items-start gap-1.5 mb-3">
                      <LocationOn fontSize="small" className="text-slate-400 shrink-0 mt-0.5" />
                      <span>{br.address}{br.city ? `, ${br.city}` : ''}</span>
                    </p>

                    {br.phone && (
                      <p className="text-slate-700 text-xs flex items-center gap-1.5 mb-1.5 font-medium">
                        <Phone fontSize="small" className="text-teal-600 shrink-0" />
                        <a href={`tel:${br.phone}`} className="hover:underline">{br.phone}</a>
                      </p>
                    )}

                    {br.telephones && (
                      <p className="text-slate-500 text-xs mt-1">
                        <strong>Other Lines:</strong> {br.telephones}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <p className="text-slate-500 text-sm">Main facility only (no separate branches registered).</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: About & Map */}
      {activeTab === 'about' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 mb-4">About {hospital.name}</h3>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line mb-6">
              {hospital.description ||
                `${hospital.name} is a leading healthcare facility committed to delivering comprehensive patient-centered medical care, state-of-the-art diagnostic testing, and emergency services.`}
            </p>

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Contact & Online Presence</h4>
            <div className="space-y-2.5 text-xs text-slate-700">
              {hospital.phone && (
                <div className="flex items-center gap-2">
                  <Phone fontSize="small" className="text-teal-600" />
                  <a href={`tel:${hospital.phone}`} className="font-semibold hover:underline">{hospital.phone}</a>
                </div>
              )}
              {hospital.email && (
                <div className="flex items-center gap-2">
                  <Email fontSize="small" className="text-teal-600" />
                  <a href={`mailto:${hospital.email}`} className="hover:underline">{hospital.email}</a>
                </div>
              )}
              {hospital.website && (
                <div className="flex items-center gap-2">
                  <Language fontSize="small" className="text-teal-600" />
                  <a href={hospital.website} target="_blank" rel="noreferrer" className="text-teal-700 font-semibold hover:underline">
                    {hospital.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Leaflet Map Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Directions className="text-teal-600" /> Location Map
            </h3>

            {hasCoordinates ? (
              <div className="h-72 rounded-2xl overflow-hidden border border-slate-200 z-0">
                <MapContainer
                  center={[hospital.latitude!, hospital.longitude!]}
                  zoom={14}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[hospital.latitude!, hospital.longitude!]}>
                    <Popup>
                      <strong>{hospital.name}</strong>
                      <br />
                      {hospital.address}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            ) : (
              <div className="h-72 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                Coordinates not available for interactive map.
              </div>
            )}
            <p className="text-xs text-slate-500 mt-3">{hospital.address}</p>
          </div>
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
