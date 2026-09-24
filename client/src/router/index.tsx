/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Layout from '../components/layout/Layout'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'
import VerifyEmailPage from '../pages/VerifyEmailPage'
import DashboardPage from '../pages/DashboardPage'
import HospitalsPage from '../pages/HospitalsPage'
import HospitalDetailPage from '../pages/HospitalDetailPage'
import DoctorsPage from '../pages/DoctorsPage'
import { DoctorDetailPage } from '../pages/DoctorDetailPage'
import AppointmentsPage from '../pages/AppointmentsPage'
import BloodDonorsPage from '../pages/BloodDonorsPage'
import BloodRequestPage from '../pages/BloodRequestPage'
import AIChatPage from '../pages/AIChatPage'
import ProfilePage from '../pages/ProfilePage'
import NotificationsPage from '../pages/NotificationsPage'

import NotFoundPage from '../pages/NotFoundPage'
import ErrorPage from '../pages/ErrorPage'
import AdminHealthcarePage from '../pages/admin/AdminHealthcarePage'
import AdminUsersPage from '../pages/admin/AdminUsersPage'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import AdminRequestsPage from '../pages/admin/AdminRequestsPage'
import AdminAmbulancePage from '../pages/admin/AdminAmbulancePage'
import AdminAnalyticsPage from '../pages/admin/AdminAnalyticsPage'

function ProtectedRoute({ roles }: { roles?: string[] }) {
  const { isAuthenticated, hasRole } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && !roles.some((r) => hasRole(r))) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

function GuestRoute() {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },

      // Guest-only
      {
        element: <GuestRoute />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },
        ],
      },

      // Auth required (All Platform Services)
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'doctors', element: <DoctorsPage /> },
          { path: 'doctors/:id', element: <DoctorDetailPage /> },
          { path: 'hospitals', element: <HospitalsPage /> },
          { path: 'hospitals/:id', element: <HospitalDetailPage /> },
          { path: 'blood-donors', element: <BloodDonorsPage /> },
          { path: 'blood/donors', element: <BloodDonorsPage /> },
          { path: 'blood-request', element: <BloodRequestPage /> },
          { path: 'blood-requests', element: <BloodRequestPage /> },
          { path: 'blood/request', element: <BloodRequestPage /> },
          { path: 'blood/requests', element: <BloodRequestPage /> },
          { path: 'ai-assistant', element: <AIChatPage /> },
          { path: 'appointments', element: <AppointmentsPage /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'notifications', element: <NotificationsPage /> },
        ],
      },

      // Admin & Moderator routes
      {
        element: <ProtectedRoute roles={['admin', 'moderator', 'staff']} />,
        children: [
          { path: 'admin', element: <Navigate to="/admin/healthcare" replace /> },
          { path: 'admin/healthcare', element: <AdminHealthcarePage /> },
          { path: 'admin/doctors-hospitals', element: <Navigate to="/admin/healthcare" replace /> },
          { path: 'admin/users', element: <AdminUsersPage /> },
          { path: 'admin/dashboard', element: <AdminDashboardPage /> },
          { path: 'admin/requests', element: <AdminRequestsPage /> },
          { path: 'admin/ambulance', element: <AdminAmbulancePage /> },
          { path: 'admin/analytics', element: <AdminAnalyticsPage /> },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
