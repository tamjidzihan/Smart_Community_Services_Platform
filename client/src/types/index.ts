// ─── Auth & Users ─────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  is_email_verified: boolean
  is_active?: boolean
  is_staff?: boolean
  is_superuser?: boolean
  date_joined: string
  last_login?: string | null
  full_name?: string
  phone?: string
  avatar_url?: string
  profile: UserProfile
  roles: Role[]
}

export interface UserProfile {
  full_name: string
  phone: string
  avatar_url: string
  gender: 'M' | 'F' | 'O' | ''
  date_of_birth: string | null
  address: string
  latitude: number | null
  longitude: number | null
  bio: string
}

export interface Role {
  id: number
  name: 'visitor' | 'citizen' | 'provider' | 'volunteer' | 'moderator' | 'admin'
  description: string
}

export interface AuthTokens {
  access: string
  refresh: string
  user: User
}

// ─── Services ─────────────────────────────────────────────────────────────────
export interface ServiceCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  parent: string | null
  children: ServiceCategory[]
  is_active: boolean
}

export interface ServiceListing {
  id: string
  title: string
  description: string
  address: string
  latitude: number | null
  longitude: number | null
  phone: string
  email: string
  website: string
  status: string
  is_verified: boolean
  is_featured: boolean
  average_rating: number
  review_count: number
  category: string
  category_name: string
  provider_name: string
  availability: ServiceAvailability[]
  distance_km: number | null
  created_at: string
}

export interface ServiceAvailability {
  day_of_week: number
  open_time: string
  close_time: string
  is_available: boolean
}

// ─── Healthcare ───────────────────────────────────────────────────────────────
export interface Specialist {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  image_url?: string
  status: 'active' | 'inactive'
  doctors_count?: number
}

export interface HospitalBranch {
  id: string
  hospital: string
  hospital_name?: string
  name: string
  address: string
  phone?: string
  telephones?: string
  division?: string
  district?: string
  city?: string
  area?: string
  latitude?: number | null
  longitude?: number | null
  opening_hours?: string
  status: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}

export interface Department {
  id: string
  hospital: string
  hospital_name?: string
  name: string
  slug: string
  description?: string
  icon?: string
  image_url?: string
  status: 'active' | 'inactive'
  average_rating: number
  review_count: number
  doctors_count?: number
  created_at?: string
}

export interface Hospital {
  id: string
  name: string
  slug: string
  logo?: string
  cover_image?: string
  description?: string
  hospital_type: 'general' | 'specialized' | 'clinic' | 'diagnostic' | 'dental' | 'eye' | 'maternity' | 'tertiary'
  phone?: string
  emergency_phone?: string
  email?: string
  website?: string
  address: string
  division?: string
  district?: string
  city?: string
  area?: string
  latitude?: number | null
  longitude?: number | null
  emergency_available: boolean
  open_24_hours: boolean
  ambulance_available: boolean
  bed_count: number
  available_beds: number
  established_year?: number | null
  is_verified: boolean
  status: 'active' | 'inactive' | 'pending'
  average_rating: number
  review_count: number
  branches_count?: number
  departments_count?: number
  doctors_count?: number
  distance_km?: number | null
  branches?: HospitalBranch[]
  departments?: Department[]
  created_at?: string
  updated_at?: string
}

export interface DoctorHospitalAffiliation {
  id: string
  doctor: string
  hospital: string
  hospital_name: string
  hospital_slug: string
  hospital_logo?: string
  department?: string | null
  department_name?: string | null
  department_slug?: string | null
  position?: string
  status: 'active' | 'inactive'
}

export interface DoctorBranchAffiliation {
  id: string
  doctor: string
  branch: string
  branch_name: string
  hospital_name: string
  branch_city?: string
  branch_address?: string
  room_number?: string
  status: 'active' | 'inactive'
}

export interface DoctorSchedule {
  id: string
  doctor: string
  hospital?: string | null
  hospital_name?: string | null
  branch?: string | null
  branch_name?: string | null
  department?: string | null
  department_name?: string | null
  day_of_week: number
  day_name: string
  start_time: string
  end_time: string
  appointment_type: 'general' | 'follow_up' | 'emergency' | 'specialist'
  maximum_appointments: number
  status: 'active' | 'inactive'
  is_overnight: boolean
  created_at?: string
}

export interface DoctorLeave {
  id: string
  doctor: string
  branch?: string | null
  branch_name?: string | null
  start_date: string
  end_date: string
  message: string
  status: 'active' | 'cancelled' | 'completed'
  is_active: boolean
  created_at?: string
}

export interface DoctorAvailability {
  status: 'AVAILABLE_TODAY' | 'ON_LEAVE' | 'NOT_SCHEDULED_TODAY' | 'INACTIVE'
  label: string
  is_available: boolean
  message: string
  leave_from?: string
  leave_to?: string
}

export interface Doctor {
  id: string
  full_name: string
  profile_image?: string
  gender?: 'male' | 'female' | 'other' | ''
  mobile?: string
  email?: string
  professional_summary?: string
  degree_summary: string
  experience_summary?: string
  current_position: string
  education?: string
  previous_experience?: string
  specialists: Specialist[]
  appointment_number?: string
  friday_reservation_information?: string
  additional_information?: string
  consultation_fee?: number | null
  is_active: boolean
  is_verified: boolean
  average_rating: number
  review_count: number
  hospital_affiliations: DoctorHospitalAffiliation[]
  branch_affiliations: DoctorBranchAffiliation[]
  availability: DoctorAvailability
  schedules?: DoctorSchedule[]
  leaves?: DoctorLeave[]
  created_at?: string
}

export interface Appointment {
  id: string
  citizen?: string
  citizen_name?: string
  citizen_email?: string
  doctor: string
  doctor_name: string
  doctor_degrees?: string
  doctor_specialization?: string
  hospital?: string | null
  hospital_name?: string | null
  branch?: string | null
  branch_name?: string | null
  department?: string | null
  department_name?: string | null
  scheduled_at: string
  appointment_type: 'general' | 'follow_up' | 'emergency' | 'specialist'
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  reason: string
  notes?: string
  created_at: string
  updated_at?: string
}

export interface HealthcareSearchResults {
  hospitals: Hospital[]
  doctors: Doctor[]
  departments: Department[]
  specialists: Specialist[]
}

// ─── Blood ────────────────────────────────────────────────────────────────────
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'

export interface BloodDonor {
  id: string
  full_name: string
  phone: string
  blood_group: BloodGroup
  latitude: number
  longitude: number
  is_available: boolean
  last_donated_at: string | null
  total_donations: number
  distance_km: number | null
}

export interface BloodRequest {
  id: string
  requester: string
  requester_name: string
  blood_group: BloodGroup
  units_needed: number
  units_fulfilled: number
  hospital_name: string
  patient_name: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'partially_fulfilled' | 'fulfilled' | 'cancelled'
  latitude: number | null
  longitude: number | null
  notes: string
  created_at: string
  resolved_at: string | null
}

// ─── Ambulance ────────────────────────────────────────────────────────────────
export interface Ambulance {
  id: string
  registration_number: string
  ambulance_type: string
  driver_name: string
  driver_phone: string
  current_latitude: number | null
  current_longitude: number | null
  status: string
  distance_km: number | null
}

export interface EmergencyRequest {
  id: string
  request_type: string
  patient_condition: string
  pickup_address: string
  pickup_latitude: number
  pickup_longitude: number
  status: string
  estimated_arrival_minutes: number | null
  notes: string
  ambulance: Ambulance | null
  citizen_name: string
  citizen_phone: string
  websocket_channel: string
  created_at: string
  dispatched_at: string | null
}

// ─── Notifications ────────────────────────────────────────────────────────────
export interface Notification {
  id: string
  notification_type: string
  title: string
  body: string
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
}

// ─── AI ───────────────────────────────────────────────────────────────────────
export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  intent?: string
  data?: Record<string, unknown>
  created_at: string
}

export interface AIChatResponse {
  session_id: string
  intent: string
  human_response: string
  entities: Record<string, unknown>
  confidence: number
  data: Record<string, unknown>
  total_found?: number
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  total_pages: number
  current_page: number
  results: T[]
}

// ─── Education & NGO ──────────────────────────────────────────────────────────
export interface Institution {
  id: string
  name: string
  institution_type: string
  address: string
  latitude: number | null
  longitude: number | null
  phone: string
  email: string
  website: string
  established_year: number | null
  description: string
  image_url: string
  admission_open: boolean
  admission_deadline: string | null
  admission_info_url: string
  average_rating: number
  is_verified: boolean
  distance_km: number | null
}

export interface EducationInstitution extends Institution {}

export interface GovOffice {
  id: string
  name: string
  office_type: string
  address: string
  latitude: number | null
  longitude: number | null
  phone: string
  email: string
  website: string
  description: string
  image_url: string
  is_verified: boolean
  distance_km: number | null
}

export interface NGO {
  id: string
  name: string
  description: string
  focus_areas: string[]
  address: string
  latitude: number | null
  longitude: number | null
  phone: string
  email: string
  website: string
  logo_url: string
  is_verified: boolean
  volunteer_count: number
}

export interface Review {
  id: string
  service_id: string
  service_type: string
  rating: number
  comment: string
  is_approved: boolean
  reviewer_name: string
  reviewer_avatar: string
  created_at: string
}
