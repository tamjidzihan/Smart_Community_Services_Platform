import React from 'react'
import { Link } from 'react-router-dom'
import {
  Star,
  LocationOn,
  LocalHospital,
  Emergency,
  AccessTime,
  Group,
  Apartment,
  Verified,
} from '@mui/icons-material'
import type { Hospital } from '../../types'

interface HospitalCardProps {
  hospital: Hospital
}

export const HospitalCard: React.FC<HospitalCardProps> = ({ hospital }) => {
  const typeLabel = {
    general: 'General Hospital',
    specialized: 'Specialized Hospital',
    clinic: 'Clinic',
    diagnostic: 'Diagnostic Centre',
    dental: 'Dental Clinic',
    eye: 'Eye Hospital',
    maternity: 'Maternity Hospital',
    tertiary: 'Tertiary Care Hospital',
  }[hospital.hospital_type] || 'Healthcare Center'

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-400/50 transition-all duration-300 overflow-hidden flex flex-col justify-between group">
      <div>
        {/* Cover / Image Header */}
        <div className="relative h-44 bg-slate-100 overflow-hidden">
          <img
            src={
              hospital.cover_image ||
              hospital.logo ||
              'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80'
            }
            alt={hospital.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

          {/* Type Badge & Verified */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-md text-slate-800 shadow-xs">
              {typeLabel}
            </span>
            {hospital.is_verified && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-teal-600 text-white flex items-center gap-1 shadow-xs">
                <Verified style={{ fontSize: 14 }} />
                <span>Verified</span>
              </span>
            )}
          </div>

          {/* Rating in image */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 text-xs font-bold text-slate-800 shadow-xs">
            <Star style={{ fontSize: 14 }} className="text-amber-400" />
            <span>{hospital.average_rating > 0 ? hospital.average_rating.toFixed(1) : 'New'}</span>
          </div>

          {/* Hospital Name & Emergency Banner */}
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <Link
              to={`/hospitals/${hospital.id}`}
              className="font-bold text-lg leading-tight hover:text-teal-200 transition-colors line-clamp-1"
            >
              {hospital.name}
            </Link>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          {/* Location */}
          <div className="flex items-start gap-1.5 text-xs text-slate-600">
            <LocationOn style={{ fontSize: 16 }} className="text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-1">
              {hospital.area ? `${hospital.area}, ` : ''}{hospital.city || hospital.address}
            </span>
            {hospital.distance_km !== null && hospital.distance_km !== undefined && (
              <span className="ml-auto shrink-0 font-semibold text-teal-600">
                ~{hospital.distance_km} km
              </span>
            )}
          </div>

          {/* Facilities / Stats Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl text-xs text-slate-700">
              <Apartment style={{ fontSize: 16 }} className="text-teal-600" />
              <span>
                <strong>{hospital.departments_count ?? 0}</strong> Departments
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl text-xs text-slate-700">
              <Group style={{ fontSize: 16 }} className="text-teal-600" />
              <span>
                <strong>{hospital.doctors_count ?? 0}</strong> Doctors
              </span>
            </div>
          </div>

          {/* Capabilities */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {hospital.emergency_available && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                <Emergency style={{ fontSize: 13 }} />
                24/7 Emergency
              </span>
            )}
            {hospital.open_24_hours && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                <AccessTime style={{ fontSize: 13 }} />
                Open 24 Hours
              </span>
            )}
            {hospital.ambulance_available && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                <LocalHospital style={{ fontSize: 13 }} />
                Ambulance
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-4 pt-0">
        <Link
          to={`/hospitals/${hospital.id}`}
          className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-slate-900 text-white hover:bg-teal-700 font-semibold text-xs transition-colors shadow-xs"
        >
          View Hospital & Departments
        </Link>
      </div>
    </div>
  )
}
