// ─── Auth & Users ─────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  is_email_verified: boolean
  date_joined: string
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
export interface Hospital {
  id: string
  name: string
  category: string
  address: string
  latitude: number | null
  longitude: number | null
  phone: string
  email: string
  website: string
  emergency_available: boolean
  bed_count: number
  available_beds: number
  description: string
  image_url: string
  is_verified: boolean
  average_rating: number
  doctors_count: number
  distance_km: number | null
}

export interface Doctor {
  id: string
  full_name: string
  specialization: string
  phone: string
  email: string
  bio: string
  avatar_url: string
  consultation_fee: number | null
  is_available: boolean
  average_rating: number
  hospital: string
  hospital_name: string
  schedules: DoctorSchedule[]
}

export interface DoctorSchedule {
  id: number
  day_of_week: number
  day_name: string
  start_time: string
  end_time: string
  max_appointments: number
  is_available: boolean
}

export interface Appointment {
  id: string
  doctor: string
  doctor_name: string
  doctor_specialization: string
  hospital: string
  hospital_name: string
  citizen_name: string
  scheduled_at: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  reason: string
  notes: string
  created_at: string
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
  suggested_actions: string[]
  data: Record<string, unknown>
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
