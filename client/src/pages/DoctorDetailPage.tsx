import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Star,
  LocationOn,
  LocalHospital,
  School,
  EventAvailable,
  EventBusy,
  Phone,
  CalendarToday,
  Verified,
  AccessTime,
  Bookmark,
  BookmarkBorder,
  ArrowBack,
} from '@mui/icons-material'
import { doctorApi, favoriteApi } from '../api/services'
import { AppointmentBookingModal } from '../components/healthcare/AppointmentBookingModal'
import { useAuthStore } from '../store/authStore'

export const DoctorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuthStore()
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)

  const { data: doctor, isLoading, error } = useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      const res = await doctorApi.getDoctor(id!)
      return res.data
    },
    enabled: !!id,
  })

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated || !doctor) return
    try {
      await favoriteApi.toggleDoctor(doctor.id)
      setIsFavorited((prev) => !prev)
    } catch {
      // ignore
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (error || !doctor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 inline-block mb-6">
          <h2 className="text-xl font-bold mb-2">Doctor Not Found</h2>
          <p className="text-sm">We couldn't load the doctor profile you requested.</p>
        </div>
        <div>
          <Link
            to="/doctors"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
          >
            <ArrowBack fontSize="small" /> Back to Doctors Directory
          </Link>
        </div>
      </div>
    )
  }

  const availability = doctor.availability || {
    status: doctor.is_active ? 'AVAILABLE_TODAY' : 'INACTIVE',
    label: doctor.is_active ? 'Available' : 'Inactive',
    is_available: doctor.is_active,
    message: '',
  }
  const isAvailable = availability.status === 'AVAILABLE_TODAY'
  const isOnLeave = availability.status === 'ON_LEAVE'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
        <Link to="/" className="hover:text-teal-600 transition-colors">Home</Link>
        <span>/</span>
        <Link to="/doctors" className="hover:text-teal-600 transition-colors">Doctors</Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold truncate">{doctor.full_name}</span>
      </nav>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start gap-6 lg:gap-8">
          {/* Doctor Image */}
          <div className="relative shrink-0 mx-auto md:mx-0">
            <img
              src={
                doctor.profile_image ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  doctor.full_name
                )}&background=0d9488&color=fff&size=256`
              }
              alt={doctor.full_name}
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl object-cover border-4 border-slate-50 shadow-md"
            />
            {doctor.is_verified && (
              <div
                className="absolute -bottom-2 -right-2 bg-teal-600 text-white rounded-full p-1.5 shadow-md flex items-center justify-center"
                title="Verified Specialist"
              >
                <Verified fontSize="small" />
              </div>
            )}
          </div>

          {/* Doctor Details */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                  {doctor.full_name}
                </h1>
                <p className="text-teal-700 font-semibold text-base mt-1">
                  {doctor.specialists?.map((s) => s.name).join(' & ') || 'Healthcare Specialist'}
                </p>
                {doctor.current_position && (
                  <p className="text-slate-600 text-sm mt-0.5">{doctor.current_position}</p>
                )}
              </div>

              {/* Top Quick Actions */}
              <div className="flex items-center justify-center md:justify-end gap-2 shrink-0">
                <button
                  onClick={handleFavoriteToggle}
                  className={`p-2.5 rounded-2xl border transition-all ${
                    isFavorited
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Save to Favorites"
                >
                  {isFavorited ? <Bookmark fontSize="small" /> : <BookmarkBorder fontSize="small" />}
                </button>
              </div>
            </div>

            {/* Ratings & Qualifications summary */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center text-amber-500 font-bold">
                  <Star style={{ fontSize: 20 }} className="text-amber-400" />
                  <span className="ml-1 text-slate-900 text-base">
                    {doctor.average_rating > 0 ? doctor.average_rating.toFixed(1) : '5.0'}
                  </span>
                </div>
                <span className="text-slate-400 text-xs">({doctor.review_count || 0} reviews)</span>
              </div>

              {doctor.consultation_fee && (
                <div className="text-xs bg-slate-100 text-slate-800 font-bold px-3 py-1.5 rounded-full">
                  Consultation Fee: ৳{Number(doctor.consultation_fee).toLocaleString()}
                </div>
              )}

              {/* Live Availability Badge */}
              {isAvailable ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <EventAvailable style={{ fontSize: 16 }} />
                  <span>Available Today</span>
                </div>
              ) : isOnLeave ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <EventBusy style={{ fontSize: 16 }} />
                  <span>{availability.message || 'Currently on Leave'}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  <EventBusy style={{ fontSize: 16 }} />
                  <span>{availability.label || 'Not Available Today'}</span>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
              <button
                onClick={() => setBookingModalOpen(true)}
                disabled={!doctor.is_active || isOnLeave}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                  doctor.is_active && !isOnLeave
                    ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-700/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CalendarToday style={{ fontSize: 18 }} />
                Book Appointment
              </button>

              {doctor.mobile && (
                <a
                  href={`tel:${doctor.mobile}`}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Phone style={{ fontSize: 18 }} />
                  Contact Doctor
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leave Alert Banner */}
      {isOnLeave && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex items-start gap-3.5 text-amber-900">
          <EventBusy className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-base">Doctor is Currently on Leave</h3>
            <p className="text-sm mt-1 text-amber-800 leading-relaxed">
              {availability.message || 'Doctor is temporarily away. Direct appointments are disabled until return date.'}
            </p>
          </div>
        </div>
      )}

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* Professional Info */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <School className="text-teal-600" />
              Degrees & Qualifications
            </h2>
            {doctor.degree_summary && (
              <div className="bg-slate-50 rounded-2xl p-4 mb-4 text-sm text-slate-800 font-medium leading-relaxed">
                {doctor.degree_summary}
              </div>
            )}
            {doctor.professional_summary && (
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                {doctor.professional_summary}
              </p>
            )}
            {doctor.education && (
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Education & Academic Credentials</h4>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{doctor.education}</p>
              </div>
            )}
          </div>

          {/* Hospital Affiliations */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <LocalHospital className="text-teal-600" />
              Hospital Affiliations & Practicing Branches
            </h2>

            {doctor.hospital_affiliations && doctor.hospital_affiliations.length > 0 ? (
              <div className="space-y-4">
                {doctor.hospital_affiliations.map((aff) => (
                  <div
                    key={aff.id}
                    className="flex items-start justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <Link
                        to={`/hospitals/${aff.hospital}`}
                        className="font-bold text-slate-900 hover:text-teal-600 text-base"
                      >
                        {aff.hospital_name}
                      </Link>
                      {aff.department_name && (
                        <p className="text-teal-700 text-xs font-medium mt-0.5">
                          Department: {aff.department_name}
                        </p>
                      )}
                      {aff.position && (
                        <p className="text-slate-500 text-xs mt-0.5">{aff.position}</p>
                      )}
                    </div>
                    <Link
                      to={`/hospitals/${aff.hospital}`}
                      className="text-xs font-semibold text-teal-600 hover:underline shrink-0"
                    >
                      View Hospital
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No active hospital affiliations registered.</p>
            )}

            {/* Practicing Branches */}
            {doctor.branch_affiliations && doctor.branch_affiliations.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Chambers & Branches</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {doctor.branch_affiliations.map((br) => (
                    <div key={br.id} className="p-3.5 rounded-2xl border border-slate-200/80 bg-white text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <LocationOn fontSize="small" className="text-teal-600" />
                        <span>{br.branch_name}</span>
                      </div>
                      <p className="text-slate-500 mt-1">{br.branch_address || br.branch_city}</p>
                      {br.room_number && (
                        <p className="text-teal-800 font-semibold mt-1">Room / Chamber: {br.room_number}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Weekly Practice Schedules */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <AccessTime className="text-teal-600" />
              Practice Schedule & Timings
            </h2>

            {doctor.schedules && doctor.schedules.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctor.schedules.map((sch) => (
                  <div
                    key={sch.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-sm">{sch.day_name}</span>
                        {sch.is_overnight && (
                          <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                            Overnight
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-teal-700 font-semibold text-sm">
                        <AccessTime style={{ fontSize: 16 }} />
                        <span>{sch.start_time.slice(0, 5)} – {sch.end_time.slice(0, 5)}</span>
                      </div>
                      {sch.hospital_name && (
                        <p className="text-slate-500 text-xs mt-1.5 line-clamp-1">{sch.hospital_name}</p>
                      )}
                      {sch.branch_name && (
                        <p className="text-slate-400 text-xs line-clamp-1">{sch.branch_name}</p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{sch.appointment_type.replace('_', ' ').toUpperCase()}</span>
                      <span>Max {sch.maximum_appointments} slots</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Schedule information is currently being updated.</p>
            )}

            {doctor.friday_reservation_information && (
              <div className="mt-4 bg-teal-50/60 border border-teal-100 rounded-2xl p-4 text-xs text-teal-900">
                <strong>Friday / Weekend Special Notice:</strong> {doctor.friday_reservation_information}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-3xl p-6 shadow-md">
            <h3 className="text-lg font-bold mb-4">Book Consultation</h3>
            <p className="text-slate-300 text-xs leading-relaxed mb-6">
              Schedule an in-person or specialist consultation with Dr. {doctor.full_name}.
            </p>

            <button
              onClick={() => setBookingModalOpen(true)}
              disabled={!doctor.is_active || isOnLeave}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mb-4 ${
                doctor.is_active && !isOnLeave
                  ? 'bg-teal-500 text-slate-950 hover:bg-teal-400'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CalendarToday style={{ fontSize: 18 }} />
              Book Appointment
            </button>

            {doctor.appointment_number && (
              <div className="bg-white/10 rounded-2xl p-3.5 text-xs text-slate-200 flex items-center gap-2">
                <Phone fontSize="small" className="text-teal-400" />
                <div>
                  <span className="text-[11px] text-slate-400 block">Appointment Helpline</span>
                  <span className="font-bold text-white text-sm">{doctor.appointment_number}</span>
                </div>
              </div>
            )}
          </div>

          {doctor.additional_information && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-3">Additional Instructions</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {doctor.additional_information}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Booking Modal */}
      <AppointmentBookingModal
        doctor={doctor}
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
      />
    </div>
  )
}
