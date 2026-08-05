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
import ServicesPage from '../pages/ServicesPage'
import ServiceDetailPage from '../pages/ServiceDetailPage'
import HospitalsPage from '../pages/HospitalsPage'
import HospitalDetailPage from '../pages/HospitalDetailPage'
import DoctorsPage from '../pages/DoctorsPage'
import AppointmentsPage from '../pages/AppointmentsPage'
import BloodDonorsPage from '../pages/BloodDonorsPage'
import BloodRequestPage from '../pages/BloodRequestPage'
import EmergencyPage from '../pages/EmergencyPage'
import EmergencyTrackPage from '../pages/EmergencyTrackPage'
import EducationPage from '../pages/EducationPage'
import NGOPage from '../pages/NGOPage'
import GovernmentPage from '../pages/GovernmentPage'
import AIChatPage from '../pages/AIChatPage'
import ProfilePage from '../pages/ProfilePage'
import NotificationsPage from '../pages/NotificationsPage'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import AdminUsersPage from '../pages/admin/AdminUsersPage'
import AdminAnalyticsPage from '../pages/admin/AdminAnalyticsPage'
import NotFoundPage from '../pages/NotFoundPage'
import ErrorPage from '../pages/ErrorPage'

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
      { path: 'services', element: <ServicesPage /> },
      { path: 'services/:id', element: <ServiceDetailPage /> },
      { path: 'hospitals', element: <HospitalsPage /> },
      { path: 'hospitals/:id', element: <HospitalDetailPage /> },
      { path: 'doctors', element: <DoctorsPage /> },
      { path: 'blood-donors', element: <BloodDonorsPage /> },
      { path: 'education', element: <EducationPage /> },
      { path: 'ngo', element: <NGOPage /> },
      { path: 'government', element: <GovernmentPage /> },
      { path: 'ai-assistant', element: <AIChatPage /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },

      // Guest-only
      {
        element: <GuestRoute />, children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },
        ]
      },

      // Auth required
      {
        element: <ProtectedRoute />, children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'appointments', element: <AppointmentsPage /> },
          { path: 'blood-request', element: <BloodRequestPage /> },
          { path: 'emergency', element: <EmergencyPage /> },
          { path: 'emergency/:id/track', element: <EmergencyTrackPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'notifications', element: <NotificationsPage /> },
        ]
      },

      // Admin only
      {
        element: <ProtectedRoute roles={['admin', 'moderator']} />, children: [
          { path: 'admin', element: <AdminDashboardPage /> },
          { path: 'admin/users', element: <AdminUsersPage /> },
          { path: 'admin/analytics', element: <AdminAnalyticsPage /> },
        ]
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
