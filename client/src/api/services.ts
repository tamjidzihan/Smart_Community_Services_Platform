import api from './axios'
import type {
  AuthTokens, User, ServiceListing, ServiceCategory, Hospital, HospitalBranch, Department, Specialist,
  Doctor, DoctorSchedule, DoctorLeave, Appointment, BloodDonor, BloodRequest, Ambulance, EmergencyRequest,
  Notification, AIChatResponse, PaginatedResponse, Institution, NGO, Review, GovOffice, HealthcareSearchResults,
} from '../types'

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: {
    email: string
    password: string
    confirm_password?: string
    full_name: string
    role?: string
    phone?: string
    blood_group?: string
    is_blood_donor?: boolean
  }) => api.post('/auth/register/', data),
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

// ─── Healthcare: Hospital API ────────────────────────────────────────────────
export const hospitalApi = {
  getHospitals: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Hospital>>('/healthcare/hospitals/', { params }),
  getNearbyHospitals: (lat: number, lng: number, radius = 15, emergency = false) =>
    api.get<{ results: Hospital[]; count: number }>('/healthcare/hospitals/nearby/', {
      params: { lat, lng, radius, emergency: emergency ? 'true' : 'false' },
    }),
  getLocations: () => api.get<{ areas: string[]; cities: string[] }>('/healthcare/hospitals/locations/'),
  getHospital: (id: string) => api.get<Hospital>(`/healthcare/hospitals/${id}/`),
  getDepartments: (id: string) => api.get<Department[]>(`/healthcare/hospitals/${id}/departments/`),
  getBranches: (id: string) => api.get<HospitalBranch[]>(`/healthcare/hospitals/${id}/branches/`),
  getDoctors: (id: string) => api.get<Doctor[]>(`/healthcare/hospitals/${id}/doctors/`),
  createHospital: (data: Partial<Hospital>) => api.post<Hospital>('/healthcare/hospitals/', data),
  updateHospital: (id: string, data: Partial<Hospital>) => api.patch<Hospital>(`/healthcare/hospitals/${id}/`, data),
  deleteHospital: (id: string) => api.delete(`/healthcare/hospitals/${id}/`),
}

// ─── Healthcare: Branch API ──────────────────────────────────────────────────
export const branchApi = {
  getBranches: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<HospitalBranch>>('/healthcare/branches/', { params }),
  createBranch: (data: Partial<HospitalBranch>) => api.post<HospitalBranch>('/healthcare/branches/', data),
  updateBranch: (id: string, data: Partial<HospitalBranch>) => api.patch<HospitalBranch>(`/healthcare/branches/${id}/`, data),
  deleteBranch: (id: string) => api.delete(`/healthcare/branches/${id}/`),
}

// ─── Healthcare: Department API ──────────────────────────────────────────────
export const departmentApi = {
  getDepartments: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Department>>('/healthcare/departments/', { params }),
  getCommonDepartments: () => api.get<string[]>('/healthcare/departments/common/'),
  getDepartment: (id: string) => api.get<Department>(`/healthcare/departments/${id}/`),
  getDoctors: (id: string) => api.get<Doctor[]>(`/healthcare/departments/${id}/doctors/`),
  createDepartment: (data: Partial<Department>) => api.post<Department>('/healthcare/departments/', data),
  updateDepartment: (id: string, data: Partial<Department>) => api.patch<Department>(`/healthcare/departments/${id}/`, data),
  deleteDepartment: (id: string) => api.delete(`/healthcare/departments/${id}/`),
}

// ─── Healthcare: Specialist API ──────────────────────────────────────────────
export const specialistApi = {
  getSpecialists: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Specialist>>('/healthcare/specialists/', { params }),
  getSpecialist: (id: string) => api.get<Specialist>(`/healthcare/specialists/${id}/`),
  getDoctors: (id: string) => api.get<Doctor[]>(`/healthcare/specialists/${id}/doctors/`),
  createSpecialist: (data: Partial<Specialist>) => api.post<Specialist>('/healthcare/specialists/', data),
  updateSpecialist: (id: string, data: Partial<Specialist>) => api.patch<Specialist>(`/healthcare/specialists/${id}/`, data),
  deleteSpecialist: (id: string) => api.delete(`/healthcare/specialists/${id}/`),
}

// ─── Healthcare: Doctor API ──────────────────────────────────────────────────
export const doctorApi = {
  getDoctors: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Doctor>>('/healthcare/doctors/', { params }),
  getDoctor: (id: string) => api.get<Doctor>(`/healthcare/doctors/${id}/`),
  getSchedule: (id: string) => api.get<DoctorSchedule[]>(`/healthcare/doctors/${id}/schedule/`),
  getLeaves: (id: string) => api.get<DoctorLeave[]>(`/healthcare/doctors/${id}/leave/`),
  createDoctor: (data: Partial<Doctor>) => api.post<Doctor>('/healthcare/doctors/', data),
  updateDoctor: (id: string, data: Partial<Doctor>) => api.patch<Doctor>(`/healthcare/doctors/${id}/`, data),
  deleteDoctor: (id: string) => api.delete(`/healthcare/doctors/${id}/`),
}

// ─── Healthcare: Appointment API ─────────────────────────────────────────────
export const appointmentApi = {
  getAppointments: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Appointment>>('/healthcare/appointments/', { params }),
  bookAppointment: (data: {
    doctor: string
    hospital?: string | null
    branch?: string | null
    department?: string | null
    scheduled_at: string
    appointment_type?: string
    reason?: string
  }) => api.post<Appointment>('/healthcare/appointments/', data),
  cancelAppointment: (id: string) => api.patch(`/healthcare/appointments/${id}/`, { status: 'cancelled' }),
  updateStatus: (id: string, status: string) => api.patch<Appointment>(`/healthcare/appointments/${id}/`, { status }),
}

// ─── Healthcare: Unified Search API ──────────────────────────────────────────
export const searchApi = {
  healthcareSearch: (q: string) =>
    api.get<HealthcareSearchResults>('/healthcare/search/', { params: { q } }),
}

// ─── Healthcare: Favorites API ───────────────────────────────────────────────
export const favoriteApi = {
  getFavoriteDoctors: () => api.get('/healthcare/favorites/doctors/'),
  toggleDoctor: (doctor_id: string) => api.post('/healthcare/favorites/doctors/', { doctor_id }),
  getFavoriteHospitals: () => api.get('/healthcare/favorites/hospitals/'),
  toggleHospital: (hospital_id: string) => api.post('/healthcare/favorites/hospitals/', { hospital_id }),
}

// Legacy healthcareApi alias
export const healthcareApi = {
  ...hospitalApi,
  ...doctorApi,
  getAppointments: appointmentApi.getAppointments,
  bookAppointment: appointmentApi.bookAppointment,
  cancelAppointment: appointmentApi.cancelAppointment,
}

// ─── Blood ────────────────────────────────────────────────────────────────────
export const bloodApi = {
  searchDonors: (group: string, lat: number, lng: number, radius = 20, page = 1, page_size = 12) =>
    api.get<PaginatedResponse<BloodDonor>>('/blood/donors/search/', {
      params: { group, lat, lng, radius, page, page_size },
    }),
  registerDonor: (data: { blood_group: string; latitude: number; longitude: number }) =>
    api.post<BloodDonor>('/blood/donors/', data),
  updateAvailability: (id: string, is_available: boolean) =>
    api.patch(`/blood/donors/${id}/`, { is_available }),
  getMyRequests: () => api.get<PaginatedResponse<BloodRequest>>('/blood/requests/'),
  createRequest: (data: Partial<BloodRequest>) => api.post<BloodRequest>('/blood/requests/', data),
  getActiveRequests: (blood_group?: string) => 
    api.get<{ results: BloodRequest[]; count: number }>('/blood/requests/active/', {
      params: blood_group && blood_group !== 'All' ? { blood_group } : {}
    }),
  updateRequestStatus: (id: string, status: string) =>
    api.patch<{ message: string; status: string }>(`/blood/requests/${id}/update_status/`, { status }),
}

// ─── Ambulance ────────────────────────────────────────────────────────────────
export const ambulanceApi = {
  getNearbyAmbulances: (lat: number, lng: number) =>
    api.get<{ results: Ambulance[]; count: number }>('/ambulance/vehicles/nearby/', {
      params: { lat, lng },
    }),
  getAmbulances: () => api.get<PaginatedResponse<Ambulance>>('/ambulance/vehicles/'),
  createAmbulance: (data: Partial<Ambulance>) => api.post<Ambulance>('/ambulance/vehicles/', data),
  deleteAmbulance: (id: string) => api.delete(`/ambulance/vehicles/${id}/`),
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

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviewsApi = {
  getReviews: (service_id: string) =>
    api.get<PaginatedResponse<Review>>('/reviews/', { params: { service_id } }),
  addReview: (data: { service_id: string; rating: number; comment: string; service_type?: string }) =>
    api.post<Review>('/reviews/', data),
  deleteReview: (id: string) => api.delete(`/reviews/${id}/`),
}

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: () => api.get<PaginatedResponse<Notification>>('/notifications/'),
  getNotifications: () => api.get<PaginatedResponse<Notification>>('/notifications/'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/mark_all_read/'),
}

// ─── AI Assistant ─────────────────────────────────────────────────────────────
export const aiApi = {
  chat: (message: string, session_id?: string, latitude?: number, longitude?: number) =>
    api.post<AIChatResponse>('/ai/chat/', { message, session_id, latitude, longitude }),
  getServicesContext: (category?: string) =>
    api.get('/ai/context/', { params: { category } }),
  getSessions: () => api.get('/ai/sessions/'),
  getHistory: (sessionId?: string) => api.get('/ai/history/', { params: { session_id: sessionId } }),
  sendMessage: (sessionId: string, message: string, _history?: any, category?: string) =>
    api.post('/ai/chat/', { session_id: sessionId, message, category }),
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getPlatformStats: () => api.get('/analytics/overview/'),
  getUserActivity: () => api.get('/analytics/activity/'),
  getDashboard: () => api.get('/analytics/overview/'),
  getDailyUsers: (_days?: number) => api.get('/analytics/daily_users/'),
  getAppointmentTrends: (_days?: number) => api.get('/analytics/appointments/'),
  getBloodStats: () => api.get('/analytics/blood/'),
  getEmergencyStats: () => api.get('/analytics/emergency/'),
}

// ─── Admin API ────────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: (params?: Record<string, unknown>) => api.get<PaginatedResponse<User>>('/auth/users/', { params }),
  listUsers: (params?: Record<string, unknown>) => api.get<PaginatedResponse<User>>('/auth/users/', { params }),
  updateUserRole: (userId: string, roles: string[]) => api.patch(`/auth/users/${userId}/roles/`, { roles }),
  deleteUser: (userId: string) => api.delete(`/auth/users/${userId}/`),
  
  getPendingRequests: () => api.get('/admin/requests/pending/'),
  approveRequest: (type: string, id: string) => api.post(`/admin/requests/${type}/${id}/approve/`),
  rejectRequest: (type: string, id: string) => api.post(`/admin/requests/${type}/${id}/reject/`),
  
  getAmbulances: () => api.get('/ambulance/vehicles/'),
  listAmbulances: () => api.get('/ambulance/vehicles/'),
  createAmbulance: (data: any) => api.post('/ambulance/vehicles/', data),
  addAmbulance: (data: any) => api.post('/ambulance/vehicles/', data),
  updateAmbulance: (id: string, data: any) => api.patch(`/ambulance/vehicles/${id}/`, data),
  deleteAmbulance: (id: string) => api.delete(`/ambulance/vehicles/${id}/`),
  
  listAppointments: (params?: any) => api.get('/healthcare/appointments/', { params }),
  updateAppointmentStatus: (id: string, statusOrData: any) => {
    const payload = typeof statusOrData === 'string' ? { status: statusOrData } : statusOrData
    return api.patch(`/healthcare/appointments/${id}/`, payload)
  },
  
  listEmergencyRequests: (params?: any) => api.get('/ambulance/emergency/', { params }),
  updateEmergencyStatus: (id: string, statusOrData: any, assigned_ambulance?: string) => {
    const payload = typeof statusOrData === 'string' ? { status: statusOrData, assigned_ambulance } : statusOrData
    return api.patch(`/ambulance/emergency/${id}/`, payload)
  },
    
  listBloodRequests: (params?: any) => api.get('/blood/requests/', { params }),
  updateBloodRequestStatus: (id: string, statusOrData: any) => {
    const payload = typeof statusOrData === 'string' ? { status: statusOrData } : statusOrData
    return api.patch(`/blood/requests/${id}/update_status/`, payload)
  },

  createHospital: hospitalApi.createHospital,
  createDoctor: doctorApi.createDoctor,
  
  updateService: (id: string, data: any) => api.patch(`/services/listings/${id}/`, data),
  deleteService: (id: string) => api.delete(`/services/listings/${id}/`),
  
  updateEducation: (id: string, data: any) => api.patch(`/education/institutions/${id}/`, data),
  deleteEducation: (id: string) => api.delete(`/education/institutions/${id}/`),
  deleteInstitution: (id: string) => api.delete(`/education/institutions/${id}/`),
  
  updateGovOffice: (id: string, data: any) => api.patch(`/government/offices/${id}/`, data),
  deleteGovOffice: (id: string) => api.delete(`/government/offices/${id}/`),
  
  updateNGO: (id: string, data: any) => api.patch(`/ngo/organizations/${id}/`, data),
  deleteNGO: (id: string) => api.delete(`/ngo/organizations/${id}/`),
}

// ─── Legacy Services ──────────────────────────────────────────────────────────
export const servicesApi = {
  getCategories: () => api.get<ServiceCategory[]>('/services/categories/'),
  createCategory: (data: { name: string; description?: string }) => api.post<ServiceCategory>('/services/categories/', data),
  getServices: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ServiceListing>>('/services/listings/', { params }),
  getService: (id: string) => api.get<ServiceListing>(`/services/listings/${id}/`),
  createService: (data: Partial<ServiceListing>) => api.post<ServiceListing>('/services/listings/', data),
  deleteService: (id: string) => api.delete(`/services/listings/${id}/`),
  getNearby: (lat: number, lng: number, radius = 10, params?: Record<string, unknown>) =>
    api.get<{ results: ServiceListing[]; count: number }>('/services/listings/nearby/', {
      params: { lat, lng, radius, ...params },
    }),
  getFavorites: () => api.get<ServiceListing[]>('/services/favorites/'),
  addFavorite: (service_id: string) => api.post('/services/favorites/', { service_id }),
}

export const educationApi = {
  getInstitutions: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Institution>>('/education/institutions/', { params }),
  getInstitution: (id: string) => api.get<Institution>(`/education/institutions/${id}/`),
  createInstitution: (data: any) => api.post<Institution>('/education/institutions/', data),
  deleteInstitution: (id: string) => api.delete(`/education/institutions/${id}/`),
}

export const ngoApi = {
  getNGOs: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<NGO>>('/ngo/organizations/', { params }),
  getNGO: (id: string) => api.get<NGO>(`/ngo/organizations/${id}/`),
  createNGO: (data: any) => api.post<NGO>('/ngo/organizations/', data),
  registerVolunteer: (data: any) => api.post('/ngo/volunteers/', data),
  deleteNGO: (id: string) => api.delete(`/ngo/organizations/${id}/`),
}

export const govApi = {
  getOffices: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<GovOffice>>('/government/offices/', { params }),
  getOffice: (id: string) => api.get<GovOffice>(`/government/offices/${id}/`),
  createOffice: (data: any) => api.post<GovOffice>('/government/offices/', data),
  deleteOffice: (id: string) => api.delete(`/government/offices/${id}/`),
}
export const governmentApi = govApi
