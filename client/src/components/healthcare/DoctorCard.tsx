import React from 'react'
import { Link } from 'react-router-dom'
import {
  Star,
  LocationOn,
  LocalHospital,
  EventAvailable,
  EventBusy,
  Verified,
  School,
} from '@mui/icons-material'
import type { Doctor } from '../../types'

interface DoctorCardProps {
  doctor: Doctor
  onBook?: (doctor: Doctor) => void
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onBook }) => {
  const primaryHospital = doctor.hospital_affiliations?.[0]
  const primaryBranch = doctor.branch_affiliations?.[0]
  const availability = doctor.availability || {
    status: doctor.is_active ? 'AVAILABLE_TODAY' : 'INACTIVE',
    label: doctor.is_active ? 'Available' : 'Inactive',
    is_available: doctor.is_active,
    message: '',
  }

  const isAvailable = availability.status === 'AVAILABLE_TODAY'
  const isOnLeave = availability.status === 'ON_LEAVE'

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-400/50 transition-all duration-300 p-5 flex flex-col justify-between group">
      <div>
        {/* Top Header: Image & Basic Info */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative shrink-0">
            <img
              src={
                doctor.profile_image ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  doctor.full_name
                )}&background=0d9488&color=fff&size=128`
              }
              alt={doctor.full_name}
              className="w-18 h-18 rounded-2xl object-cover border-2 border-slate-100 shadow-xs group-hover:scale-105 transition-transform"
            />
            {doctor.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-teal-600 text-white rounded-full p-0.5 shadow-xs" title="Verified Doctor">
                <Verified style={{ fontSize: 16 }} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/doctors/${doctor.id}`}
                className="font-bold text-lg text-slate-900 hover:text-teal-600 transition-colors line-clamp-1"
              >
                {doctor.full_name}
              </Link>
            </div>

            {doctor.specialists && doctor.specialists.length > 0 && (
              <p className="text-teal-700 font-medium text-sm mt-0.5 line-clamp-1">
                {doctor.specialists.map((s) => s.name).join(', ')}
              </p>
            )}

            {doctor.current_position && (
              <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">
                {doctor.current_position}
              </p>
            )}

            {/* Ratings */}
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex items-center text-amber-500 text-xs font-bold">
                <Star style={{ fontSize: 16 }} className="text-amber-400" />
                <span className="ml-0.5 text-slate-800">{doctor.average_rating > 0 ? doctor.average_rating.toFixed(1) : 'New'}</span>
              </div>
              {doctor.review_count > 0 && (
                <span className="text-slate-400 text-xs">({doctor.review_count} reviews)</span>
              )}
            </div>
          </div>
        </div>

        {/* Degrees / Qualification Summary */}
        {doctor.degree_summary && (
          <div className="flex items-start gap-1.5 bg-slate-50 rounded-xl p-2.5 mb-3 text-xs text-slate-600">
            <School style={{ fontSize: 16 }} className="text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-relaxed">{doctor.degree_summary}</span>
          </div>
        )}

        {/* Affiliations */}
        <div className="space-y-1 mb-4 text-xs text-slate-600">
          {primaryHospital && (
            <div className="flex items-center gap-1.5 truncate">
              <LocalHospital style={{ fontSize: 15 }} className="text-teal-600 shrink-0" />
              <span className="truncate font-medium text-slate-700">{primaryHospital.hospital_name}</span>
            </div>
          )}
          {primaryBranch && (
            <div className="flex items-center gap-1.5 truncate">
              <LocationOn style={{ fontSize: 15 }} className="text-slate-400 shrink-0" />
              <span className="truncate">{primaryBranch.branch_name}{primaryBranch.branch_city ? ` (${primaryBranch.branch_city})` : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Availability & Action Buttons */}
      <div className="border-t border-slate-100 pt-3.5 mt-auto">
        <div className="flex items-center justify-between gap-2 mb-3">
          {isAvailable ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <EventAvailable style={{ fontSize: 15 }} />
              <span>Available Today</span>
            </div>
          ) : isOnLeave ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200" title={availability.message}>
              <EventBusy style={{ fontSize: 15 }} />
              <span className="truncate max-w-[170px]">{availability.message || 'On Leave'}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              <EventBusy style={{ fontSize: 15 }} />
              <span>{availability.label || 'Not Available Today'}</span>
            </div>
          )}

          {doctor.consultation_fee && (
            <span className="text-xs font-bold text-slate-800">
              ৳{Number(doctor.consultation_fee).toLocaleString()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            to={`/doctors/${doctor.id}`}
            className="w-full text-center py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            View Profile
          </Link>
          <button
            onClick={() => onBook?.(doctor)}
            disabled={!doctor.is_active || isOnLeave}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              doctor.is_active && !isOnLeave
                ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-xs hover:shadow'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            Book Appointment
          </button>
        </div>
      </div>
    </div>
  )
}
