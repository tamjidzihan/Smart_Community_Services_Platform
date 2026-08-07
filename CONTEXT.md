# Smart Community Services Platform — Project Context

> **Purpose**: This file provides a complete architectural and codebase overview for AI assistants and developers working on this project. Read this first to understand the full system before making changes.

---

## 1. Project Overview

**Smart Community Services Platform** is a full-stack web application that provides a unified hub for community services including:

- 🏥 Healthcare (hospitals, doctors, appointments)
- 🩸 Blood donation & request management
- 🚑 Emergency ambulance dispatch (real-time tracking)
- 📚 Education institution directory
- 🤝 NGO & volunteer management
- 🏛️ Government services & offices
- 🛠️ General community service listings & reviews
- 🤖 AI-powered assistant & recommendations
- 📊 Analytics dashboard for admins

**Repository**: https://github.com/tamjidzihan/Smart_Community_Services_Platform

**Monorepo Structure**:
```
Smart_Community_Services_Platform/
├── client/    # React + TypeScript + Vite SPA
├── server/    # Django + Django REST Framework API
├── CONTEXT.md # This file
├── API_DOCUMENTATION.md
├── ARCHITECTURE.md
├── DEPLOYMENT.md
├── PROJECT_SUMMARY.md
└── README.md
```

---

## 2. Technology Stack

### Frontend (`client/`)
| Tech | Version | Purpose |
|------|---------|---------|
| React | ^19.2 | UI framework |
| TypeScript | ~6.0 | Typed JS |
| Vite | ^8.1 | Build tool & dev server |
| MUI (Material UI) | ^9.2 | Component library |
| Tailwind CSS | ^4.3 | Utility CSS |
| React Router | ^7.18 | Routing |
| TanStack React Query | ^5.101 | Server state management |
| Zustand | ^5.0 | Client state management |
| Axios | ^1.18 | HTTP client |
| Recharts | ^3.9 | Charts (analytics) |
| React Leaflet | ^5.0 | Maps (nearby services) |
| React Hook Form + Zod | ^7.81 / ^4.4 | Forms + validation |
| Framer Motion | ^12.42 | Animations |
| Vitest | ^4.1 | Testing |

### Backend (`server/`)
| Tech | Purpose |
|------|---------|
| Django (+DRF) | Web framework + REST API |
| Celery | Async tasks (notifications, etc.) |
| WebSockets / Channels | Real-time emergency tracking |
| PostgreSQL | Main database (psql available) |
| Redis | Cache / Celery broker |
| MongoDB | Available (optional usage) |
| Docker / Kubectl | Deployment |
| drf-spectacular | Swagger/OpenAPI docs |

**API Docs**: `/api/docs/` (Swagger UI) & `/api/schema/` (OpenAPI schema)

---

## 3. Backend Architecture

### Django Apps (`server/apps/`)
| App | URL Prefix | Purpose |
|-----|-----------|---------|
| `accounts` | `/api/v1/auth/` | Users, roles, JWT auth, profile, admin user management |
| `services` | `/api/v1/services/` | Service categories, listings, favorites, nearby search |
| `healthcare` | `/api/v1/healthcare/` | Hospitals, doctors, appointments & status updates |
| `blood` | `/api/v1/blood/` | Donors, blood requests & status management |
| `ambulance` | `/api/v1/ambulance/` | Vehicles fleet, emergency requests & dispatch |
| `education` | `/api/v1/education/` | Educational institutions |
| `ngo` | `/api/v1/ngo/` | NGOs, events, volunteers |
| `government` | `/api/v1/government/` | Government offices & services |
| `reviews` | `/api/v1/reviews/` | Service reviews & ratings |
| `notifications` | `/api/v1/notifications/` | In-app notifications |
| `ai_assistant` | `/api/v1/ai/` | AI chat, intent detection, recommendations |
| `analytics` | `/api/v1/analytics/` | Dashboard KPIs, daily users, trends |

### Key Config Files
- `server/config/settings/` — Django settings (split module)
- `server/config/urls.py` — Root URL routing
- `server/config/celery.py` — Celery configuration
- `server/config/asgi.py` / `wsgi.py` — ASGI (WebSockets) / WSGI entrypoints
- `server/utils/geo.py` — Geo/distance utilities (haversine etc.)
- `server/utils/permissions.py` — Custom role-based permissions

### API URL Convention
```
/api/v1/{app_name}/...
```
Frontend axios `BASE_URL` = `import.meta.env.VITE_API_URL || '/api/v1'`

---

## 4. Frontend Architecture

### Key Directories
```
client/src/
├── api/
│   ├── axios.ts      # Axios instance + JWT refresh interceptor
│   └── services.ts   # All API endpoint wrappers (13 API groups)
├── components/
│   └── layout/       # Layout component (nav, footer)
├── pages/            # One file per route
│   └── admin/        # Admin-only pages (5 pages)
├── router/
│   └── index.tsx     # All route definitions + guards
├── store/
│   └── authStore.ts  # Zustand: auth state + notification store
└── types/
    └── index.ts      # All TypeScript interfaces
```

### Route Map

| Route | Access | Page Component |
|-------|--------|----------------|
| `/` | Public | HomePage |
| `/services` | Public | ServicesPage |
| `/services/:id` | Public | ServiceDetailPage |
| `/hospitals` | Public | HospitalsPage |
| `/hospitals/:id` | Public | HospitalDetailPage |
| `/doctors` | Public | DoctorsPage |
| `/blood-donors` | Public | BloodDonorsPage |
| `/education` | Public | EducationPage |
| `/ngo` | Public | NGOPage |
| `/government` | Public | GovernmentPage |
| `/ai-assistant` | Public | AIChatPage |
| `/verify-email` | Public | VerifyEmailPage |
| `/login` | Guest only | LoginPage |
| `/register` | Guest only | RegisterPage |
| `/forgot-password` | Guest only | ForgotPasswordPage |
| `/reset-password` | Guest only | ResetPasswordPage |
| `/dashboard` | Auth | DashboardPage |
| `/appointments` | Auth | AppointmentsPage |
| `/blood-request` | Auth | BloodRequestPage |
| `/emergency` | Auth | EmergencyPage |
| `/emergency/:id/track` | Auth | EmergencyTrackPage |
| `/profile` | Auth | ProfilePage |
| `/notifications` | Auth | NotificationsPage |
| `/admin` | admin/moderator | AdminDashboardPage |
| `/admin/users` | admin/moderator | AdminUsersPage |
| `/admin/analytics` | admin/moderator | AdminAnalyticsPage |
| `/admin/requests` | admin/moderator | AdminRequestsPage |
| `/admin/ambulances` | admin/moderator | AdminAmbulancePage |
| `*` | Public | NotFoundPage / ErrorPage |

### Route Guards (`client/src/router/index.tsx`)
- **`ProtectedRoute`** — redirects to `/login` if not authenticated; checks `roles` via `hasRole()`
- **`GuestRoute`** — redirects to `/dashboard` if already authenticated
- **Admin routes** use `ProtectedRoute roles={['admin', 'moderator']}`

### Auth Flow (`client/src/store/authStore.ts`)
- State: `user`, `accessToken`, `isAuthenticated`, `isLoading`
- `setUser()` — persists `user` to localStorage
- `setTokens(access, refresh)` — persists both tokens
- `logout()` — clears localStorage
- `hasRole(role)` — checks `user.roles[].name`, with special handling for `admin`/`moderator` when `is_staff` or `is_superuser`
- Tokens stored in localStorage: `access_token`, `refresh_token`, `user`
- **Separate** `useNotificationStore` tracks `unreadCount`

### Axios Interceptors (`client/src/api/axios.ts`)
1. **Request**: attaches `Authorization: Bearer <access_token>` header
2. **Response**: on 401, tries refresh with `refresh_token`; on failure clears storage → redirects to `/login`

---

## 5. API Services (`client/src/api/services.ts`)

All API calls are grouped into `xxxApi` objects:

| Object | Endpoints (relative to `/api/v1`) |
|--------|-----------------------------------|
| `authApi` | `/auth/register/`, `/auth/login/`, `/auth/logout/`, `/auth/me/`, email verify, password reset/change |
| `servicesApi` | `/services/categories/`, `/services/listings/`, `/services/listings/:id/`, `/services/listings/nearby/`, `/services/favorites/` |
| `healthcareApi` | `/healthcare/hospitals/`, `/healthcare/doctors/`, `/healthcare/appointments/` |
| `bloodApi` | `/blood/donors/search/`, `/blood/donors/`, `/blood/requests/` |
| `ambulanceApi` | `/ambulance/vehicles/nearby/`, `/ambulance/emergency/` |
| `notificationsApi` | `/notifications/`, `/notifications/mark-all-read/`, `/notifications/:id/read/` |
| `aiApi` | `/ai/chat/`, `/ai/chat/history/`, `/ai/recommend/` |
| `educationApi` | `/education/institutions/`, `/education/institutions/nearby/` |
| `ngoApi` | `/ngo/ngos/`, `/ngo/events/`, `/ngo/volunteers/` |
| `govApi` | `/government/offices/`, `/government/services/` |
| `reviewsApi` | `/reviews/` |
| `analyticsApi` | `/analytics/dashboard/`, `/analytics/daily-users/`, `/analytics/appointment-trends/`, `/analytics/blood-stats/`, `/analytics/emergency-stats/` |
| `adminApi` | `/auth/admin/users/`, healthcare appointments (all), ambulance emergency (all), blood requests (all), `/ambulance/vehicles/` CRUD |

### Pagination Pattern
Most list endpoints return:
```ts
interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  total_pages: number
  current_page: number
  results: T[]
}
```

---

## 6. Admin Pages Details

### AdminDashboardPage
- Location: `client/src/pages/admin/AdminDashboardPage.tsx`
- Shows platform KPIs & navigation cards to sub-pages

### AdminUsersPage
- `adminApi.listUsers({ search, role, page, page_size: 20 })`
- Columns: User (avatar + full_name, is_staff badge), Email, Phone, Roles (chips), Verified, Active, Joined, Last Login
- Filters: search (name/email/phone), role dropdown
- Pagination via MUI `<Pagination>`
- Roles: `citizen | provider | volunteer | moderator | admin` + `visitor`

### AdminRequestsPage (most complex — 3 tabs)
- **Appointments Tab**: filter by status; edit dialog to change status + notes
  - `adminApi.listAppointments({ status, page })`
  - `adminApi.updateAppointmentStatus(id, { status, notes })`
  - Appointment statuses: `scheduled | confirmed | completed | cancelled | no_show`
- **Emergency Requests Tab**: filter by status; auto-refresh every 30s; assign ambulance + set ETA
  - `adminApi.listEmergencyRequests({ status, page })`
  - `adminApi.updateEmergencyStatus(id, { status, assigned_ambulance, estimated_arrival_minutes })`
  - Emergency statuses: `pending | dispatched | en_route | arrived | resolved | cancelled | no_resource`
- **Blood Requests Tab**: filter by status/urgency/blood group; edit dialog to update units fulfilled
  - `adminApi.listBloodRequests({ status, urgency, blood_group, page })`
  - `adminApi.updateBloodRequestStatus(id, { status, units_fulfilled, notes })`
  - Blood statuses: `open | partially_fulfilled | fulfilled | cancelled`
  - Urgency: `low | medium | high | critical`

### AdminAmbulancePage
- CRUD for ambulance fleet via `adminApi.listAmbulances / createAmbulance / updateAmbulance / deleteAmbulance`
- Fields: `registration_number`, `ambulance_type`, `driver_name`, `driver_phone`, `status`
- Type choices: `basic | advanced | neonatal | air`
- Status choices: `available | en_route | at_scene | transporting | unavailable`
- Stats strip: total fleet, available now, active dispatches

### AdminAnalyticsPage
- Uses `analyticsApi` with Recharts:
  - Line chart: daily user registrations (14 days)
  - Pie chart: blood donors by group
  - Bar chart: appointment trends (14 days)
  - Horizontal bar: emergency requests by type
  - Grouped bar: donors vs requests per blood group
  - Bar: emergency status breakdown
- Dashboard summary cards: total users, appointments, blood requests, emergencies (auto-refresh 60s)

---

## 7. Key TypeScript Types (`client/src/types/index.ts`)

### User & Roles
```ts
interface User {
  id, email, is_email_verified, is_staff?, is_superuser?, date_joined,
  profile: UserProfile, roles: Role[]
}
interface Role { id, name: 'visitor'|'citizen'|'provider'|'volunteer'|'moderator'|'admin', description }
```

### Other Domain Types
- `ServiceCategory`, `ServiceListing`, `ServiceAvailability`
- `Hospital`, `Doctor`, `DoctorSchedule`, `Appointment`
- `BloodGroup` (`A+...O-`), `BloodDonor`, `BloodRequest`
- `Ambulance`, `EmergencyRequest` (includes `websocket_channel` for live tracking)
- `Notification`, `AIMessage`, `AIChatResponse`
- `Institution`, `NGO`, `Review`
- `PaginatedResponse<T>`

---

## 8. Common Patterns & Conventions

### Query Pattern (React Query)
```ts
const { data, isLoading, error } = useQuery({
  queryKey: ['admin-users', search, role, page],
  queryFn: () => adminApi.listUsers({ search, role, page, page_size: 20 }),
  placeholderData: keepPreviousData,  // smooth pagination
})
```
- **Mutation pattern**: `useMutation` + `queryClient.invalidateQueries({ queryKey: [...] })` after success
- **API responses** are wrapped: `data?.data?.results` (axios `data` → API `data`)

### MUI Styling Conventions
- Rounded corners: `borderRadius: 3` on Paper/Card, `borderRadius: 2.5` on buttons
- Page containers: `<Box sx={{ minHeight: '100vh', py: 5, bgcolor: 'grey.50' }}>` + `<Container maxWidth="xl">`
- Page headers with gradient icon boxes:
  ```tsx
  <Box sx={{ width: 52, height: 52, borderRadius: 2.5,
    background: 'linear-gradient(135deg, color1 0%, color2 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Icon sx={{ color: 'white', fontSize: 28 }} />
  </Box>
  ```
- Table headers: `<TableHead sx={{ bgcolor: 'grey.100' }}>` with `sx={{ fontWeight: 700 }}`
- Status/color maps as `Record<string, { color: 'default'|'primary'|'secondary'|'error'|'warning'|'info'|'success'; label: string }>`

### Brand Colors
| Purpose | Hex |
|---------|-----|
| Primary Blue | `#1A56DB` |
| Success Green | `#0E9F6E` / `#057A55` |
| Error Red | `#E02424` |
| Purple (Blood) | `#7C3AED` |
| Warning Amber | `#D97706` / `#F59E0B` |
| Info Indigo | `#6366F1` / `#3B82F6` |

---

## 9. Environment & Setup

### Frontend Dev Server
```bash
cd client
npm install
npm run dev       # Vite dev server
npm run build     # tsc -b && vite build
npm run lint      # ESLint
```

### Backend
```bash
cd server
pip install -r requirements.txt
python manage.py runserver
```
Requires PostgreSQL, Redis (Celery broker), and environment variables in `server/.env`.

### Environment Variables (Frontend)
- `VITE_API_URL` — overrides default `/api/v1` base URL

---

## 10. Current User-Specific Notes

The following files are actively being worked on (as of the latest session):
- `client/src/pages/admin/AdminDashboardPage.tsx`
- `client/src/pages/admin/AdminUsersPage.tsx`
- `client/src/pages/ProfilePage.tsx`
- `client/src/store/authStore.ts`
- `client/src/router/index.tsx`

---

## 11. Common Tasks Reference

### Add a new admin page
1. Create `client/src/pages/admin/AdminXxxPage.tsx`
2. Add route in `client/src/router/index.tsx` inside the admin `ProtectedRoute` block
3. Add API methods to `adminApi` in `client/src/api/services.ts` (if needed)
4. Link from `AdminDashboardPage`

### Add a new API endpoint group
1. Create/create Django app in `server/apps/` (or use existing)
2. Register URLs in `server/config/urls.py`
3. Add API wrapper in `client/src/api/services.ts`
4. Add TypeScript types in `client/src/types/index.ts`

### Add a new public page
1. Create `client/src/pages/XxxPage.tsx`
2. Add route in `client/src/router/index.tsx` (public section)
3. Add nav link in `client/src/components/layout/Layout.tsx`

### Add a new notification
- Backend: `apps/notifications/` app model
- Frontend: `notificationsApi` + `useNotificationStore` for unread count

### Debug emergency tracking
- EmergencyRequest has `websocket_channel` — used by Channels WebSocket for real-time updates
- Admin page auto-refreshes every 30s; tracking page uses WebSocket

---

## 12. Gotchas & Warnings

1. **Axios double-wrapping**: API responses are nested — `response.data` is the DRF payload, many components use `data?.data?.results`.
2. **`(data as any)` casts**: Many admin pages/analytics use `as any` casts because admin API response types are loosely defined.
3. **Tab count fetching**: `useTabCounts` in AdminRequestsPage fires 3 extra queries to show badge counts — invalidated individually on mutations.
4. **Emergency ambulance field**: `e.ambulance` is typed as `Ambulance | null` but accessed via `(e.ambulance as any).registration_number`.
5. **Client-side filtering**: AdminRequestsPage performs client-side search (on current page only) instead of server-side.
6. **`confirm()` usage**: AdminAmbulancePage uses browser `confirm()` for delete confirmation — consider MUI Dialog for consistency.
7. **Vite port**: Default Vite dev port (5173); backend CORS must allow it.
8. **LocalStorage keys**: `access_token`, `refresh_token`, `user` — never rename without updating authStore + axios.ts.