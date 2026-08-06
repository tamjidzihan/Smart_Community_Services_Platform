import api from './axios'
import type {
  AuthTokens, User, ServiceListing, ServiceCategory, Hospital, Doctor,
  Appointment, BloodDonor, BloodRequest, Ambulance, EmergencyRequest,
  Notification, AIChatResponse, PaginatedResponse, Institution, NGO, Review,
} from '../types'

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; confirm_password: string; full_name: string }) =>
    api.post('/auth/register/', data),
  login: (email: string, password: string) =>
    api.post<AuthTokens>('/auth/login/', { email, password }),
  logout: (refresh: string) => api.post('/auth/logout/', { refresh }),
  me: () => api.get<User>('/auth/me/'),
  updateProfile: (data: Partial<User['profile']>) => api.patch('/auth/me/', data),
  verifyEmail: (token: string) => api.post('/auth/verify-email/', { token }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password/', { email }),
  resetPassword: (token: string, password: string, confirm_password: string) =>
    api.post('/auth/reset-password/', { token, password, confirm_password }),
  changePassword: (old_password: string, new_password: string, confirm_password: string) =>
    api.post('/auth/change-password/', { old_password, new_password, confirm_password }),
}

// ─── Services ─────────────────────────────────────────────────────────────────
export const servicesApi = {
  getCategories: () => api.get<ServiceCategory[]>('/services/categories/'),
  getServices: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ServiceListing>>('/services/listings/', { params }),
  getService: (id: string) => api.get<ServiceListing>(`/services/listings/${id}/`),
  createService: (data: Partial<ServiceListing>) => api.post<ServiceListing>('/services/listings/', data),
  getNearby: (lat: number, lng: number, radius = 10, params?: Record<string, unknown>) =>
    api.get<{ results: ServiceListing[]; count: number }>('/services/listings/nearby/', {
      params: { lat, lng, radius, ...params },
    }),
  getFavorites: () => api.get<ServiceListing[]>('/services/favorites/'),
  addFavorite: (service_id: string) => api.post('/services/favorites/', { service_id }),
}

// ─── Healthcare ───────────────────────────────────────────────────────────────
export const healthcareApi = {
  getHospitals: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Hospital>>('/healthcare/hospitals/', { params }),
  getNearbyHospitals: (lat: number, lng: number, radius = 15, emergency = false) =>
    api.get<{ results: Hospital[]; count: number }>('/healthcare/hospitals/nearby/', {
      params: { lat, lng, radius, emergency: emergency ? 'true' : 'false' },
    }),
  getHospital: (id: string) => api.get<Hospital>(`/healthcare/hospitals/${id}/`),
  createHospital: (data: Partial<Hospital>) => api.post<Hospital>('/healthcare/hospitals/', data),
  getDoctors: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Doctor>>('/healthcare/doctors/', { params }),
  getDoctor: (id: string) => api.get<Doctor>(`/healthcare/doctors/${id}/`),
  createDoctor: (data: Partial<Doctor>) => api.post<Doctor>('/healthcare/doctors/', data),
  getAppointments: () => api.get<PaginatedResponse<Appointment>>('/healthcare/appointments/'),
  bookAppointment: (data: { doctor: string; scheduled_at: string; reason: string }) =>
    api.post<Appointment>('/healthcare/appointments/', data),
  cancelAppointment: (id: string) => api.patch(`/healthcare/appointments/${id}/cancel/`),
}

// ─── Blood ────────────────────────────────────────────────────────────────────
export const bloodApi = {
  searchDonors: (group: string, lat: number, lng: number, radius = 20) =>
    api.get<{ results: BloodDonor[]; count: number }>('/blood/donors/search/', {
      params: { group, lat, lng, radius },
    }),
  registerDonor: (data: { blood_group: string; latitude: number; longitude: number }) =>
    api.post<BloodDonor>('/blood/donors/', data),
  updateAvailability: (id: string, is_available: boolean) =>
    api.patch(`/blood/donors/${id}/`, { is_available }),
  getMyRequests: () => api.get<PaginatedResponse<BloodRequest>>('/blood/requests/'),
  createRequest: (data: Partial<BloodRequest>) => api.post<BloodRequest>('/blood/requests/', data),
}

// ─── Ambulance ────────────────────────────────────────────────────────────────
export const ambulanceApi = {
  getNearbyAmbulances: (lat: number, lng: number) =>
    api.get<{ results: Ambulance[]; count: number }>('/ambulance/vehicles/nearby/', {
      params: { lat, lng },
    }),
  requestEmergency: (data: {
    request_type: string
    patient_condition: string
    pickup_address: string
    pickup_latitude: number
    pickup_longitude: number
  }) => api.post<EmergencyRequest>('/ambulance/emergency/', data),
  getMyEmergencies: () =>
    api.get<PaginatedResponse<EmergencyRequest>>('/ambulance/emergency/'),
  getEmergency: (id: string) =>
    api.get<EmergencyRequest>(`/ambulance/emergency/${id}/`),
}

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (unread = false) =>
    api.get<Notification[]>('/notifications/', { params: unread ? { unread: 'true' } : {} }),
  markAllRead: () => api.post('/notifications/mark-all-read/'),
  markRead: (id: string) => api.post(`/notifications/${id}/read/`),
}

// ─── AI ───────────────────────────────────────────────────────────────────────
export const aiApi = {
  chat: (message: string, session_id?: string, lat?: number, lng?: number) =>
    api.post<AIChatResponse>('/ai/chat/', { message, session_id, latitude: lat, longitude: lng }),
  getHistory: (session_id?: string) =>
    api.get('/ai/chat/history/', { params: session_id ? { session_id } : {} }),
  getRecommendations: (lat: number, lng: number) =>
    api.get<{ results: ServiceListing[] }>('/ai/recommend/', { params: { lat, lng } }),
}

// ─── Education ────────────────────────────────────────────────────────────────
export const educationApi = {
  getInstitutions: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Institution>>('/education/institutions/', { params }),
  createInstitution: (data: Partial<Institution>) =>
    api.post<Institution>('/education/institutions/', data),
  getNearby: (lat: number, lng: number, radius = 20) =>
    api.get<{ results: Institution[]; count: number }>('/education/institutions/nearby/', {
      params: { lat, lng, radius },
    }),
}

// ─── NGO ──────────────────────────────────────────────────────────────────────
export const ngoApi = {
  getNGOs: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<NGO>>('/ngo/ngos/', { params }),
  createNGO: (data: Partial<NGO>) => api.post<NGO>('/ngo/ngos/', data),
  getEvents: () => api.get('/ngo/events/'),
  registerVolunteer: (data: Record<string, unknown>) => api.post('/ngo/volunteers/', data),
}

// ─── Government ───────────────────────────────────────────────────────────────
export const govApi = {
  getOffices: (params?: Record<string, unknown>) =>
    api.get('/government/offices/', { params }),
  createOffice: (data: Record<string, unknown>) => api.post('/government/offices/', data),
  getServices: (params?: Record<string, unknown>) =>
    api.get('/government/services/', { params }),
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviewsApi = {
  getReviews: (service_id: string) =>
    api.get<PaginatedResponse<Review>>('/reviews/', { params: { service_id } }),
  submitReview: (data: { service_id: string; service_type: string; rating: number; comment: string }) =>
    api.post<Review>('/reviews/', data),
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard/'),
  getDailyUsers: (days = 7) => api.get('/analytics/daily-users/', { params: { days } }),
  getAppointmentTrends: (days = 7) => api.get('/analytics/appointment-trends/', { params: { days } }),
  getBloodStats: () => api.get('/analytics/blood-stats/'),
  getEmergencyStats: () => api.get('/analytics/emergency-stats/'),
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  listUsers: (params?: { search?: string; role?: string; page?: number; page_size?: number }) =>
    api.get<{
      count: number
      total_pages: number
      current_page: number
      results: {
        id: string
        email: string
        full_name: string
        phone: string
        avatar_url: string
        address: string
        is_active: boolean
        is_email_verified: boolean
        is_staff: boolean
        date_joined: string
        last_login: string | null
        roles: string[]
      }[]
    }>('/auth/admin/users/', { params }),

  // Appointments — /healthcare/appointments/ (admins get all)
  listAppointments: (params?: { status?: string; page?: number }) =>
    api.get<PaginatedResponse<Appointment>>('/healthcare/appointments/', { params }),

  // Emergency requests — /ambulance/emergency/ (admins get all)
  listEmergencyRequests: (params?: { status?: string; page?: number }) =>
    api.get<PaginatedResponse<EmergencyRequest>>('/ambulance/emergency/', { params }),

  // Blood requests — /blood/requests/ (admins get all)
  listBloodRequests: (params?: { status?: string; urgency?: string; blood_group?: string; page?: number }) =>
    api.get<PaginatedResponse<BloodRequest>>('/blood/requests/', { params }),
}
