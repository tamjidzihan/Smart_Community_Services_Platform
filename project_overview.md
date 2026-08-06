# 🏙️ Smart Community Services Platform (SCSP)

> **Final Year Project (FYP)** — A production-grade, AI-powered full-stack platform connecting citizens with hospitals, ambulances, blood donors, schools, NGOs, and government services.

---

## 📁 Repository Structure

```
Smart_Community_Services_Platform/
├── client/          # React 19 + TypeScript + Vite frontend
└── server/          # Django 5 + DRF backend
```

Key docs at root: `README.md`, `API_DOCUMENTATION.md`, `ARCHITECTURE.md`, `DEPLOYMENT.md`, `PROJECT_SUMMARY.md`

---

## 🛠️ Tech Stack

### Frontend (`client/`)
| Layer | Technology |
|-------|-----------|
| Framework | React 19, TypeScript, Vite 8 |
| UI | Material UI v9 + Tailwind CSS v4 |
| State | Zustand (`authStore.ts`) |
| Data Fetching | TanStack React Query |
| Forms | React Hook Form + Zod |
| Routing | React Router DOM v7 |
| Maps | Leaflet + react-leaflet |
| Charts | Recharts |
| HTTP | Axios |
| Animations | Framer Motion |

### Backend (`server/`)
| Layer | Technology |
|-------|-----------|
| Framework | Django 5.0, Python 3.12 |
| API | Django REST Framework 3.15 |
| Auth | JWT (SimpleJWT), Google OAuth (social-auth) |
| WebSockets | Django Channels 4 + Redis (channels-redis) |
| Task Queue | Celery 5 + Redis broker |
| Scheduler | django-celery-beat |
| Database | PostgreSQL 16 (psycopg2-binary) |
| Cache | Redis |
| Storage | Cloudinary CDN |
| AI | Google Gemini API (`google-genai`) + OpenAI |
| API Docs | drf-spectacular (OpenAPI/Swagger) |
| Geo | geopy, geographiclib |
| ASGI Server | Daphne |
| Prod Server | Gunicorn + Whitenoise |

---

## 🗂️ Backend Apps (`server/apps/`)

| App | Purpose |
|-----|---------|
| `accounts` | Custom User model (UUID PK, email-based), RBAC Roles, JWT auth, Google OAuth, email verification, password reset |
| `services` | Generic service listings & categories, nearby search, favorites |
| `healthcare` | Hospitals, Doctors, Appointments |
| `blood` | Blood donor registry, compatible-type search, emergency broadcast |
| `ambulance` | Ambulance vehicles, emergency dispatch, real-time GPS via WebSocket |
| `education` | Educational institutions, admissions |
| `ngo` | NGO registry, volunteers, events |
| `government` | Government offices, service catalog |
| `reviews` | Ratings & reviews for services |
| `notifications` | WebSocket notifications, push messages |
| `ai_assistant` | Gemini-powered chatbot, NLP intent, recommendations |
| `analytics` | Admin dashboards, audit logs, AuditLogMiddleware |

---

## 👤 User Roles (RBAC)

| Role | Access |
|------|--------|
| `visitor` | Public browse only |
| `citizen` | Book appointments, request ambulance, find donors |
| `provider` | Manage service listings, accept bookings |
| `volunteer` | Join NGO events |
| `moderator` | Review moderation, complaints |
| `admin` | Full platform management, analytics |

---

## 🌐 Frontend Pages (`client/src/pages/`)

**Public:**
- `HomePage.tsx` — Landing with service discovery
- `ServicesPage.tsx` / `ServiceDetailPage.tsx`
- `HospitalsPage.tsx` / `HospitalDetailPage.tsx`
- `DoctorsPage.tsx`
- `BloodDonorsPage.tsx`
- `EducationPage.tsx`
- `NGOPage.tsx`
- `GovernmentPage.tsx`
- `AIChatPage.tsx`

**Guest-only:** Login, Register, ForgotPassword, ResetPassword, VerifyEmail

**Auth-required:** Dashboard, Appointments, BloodRequest, Emergency, EmergencyTrack, Profile, Notifications

**Admin-only:** AdminDashboard, AdminUsers, AdminAnalytics, AdminRequests, AdminAmbulance

---

## 🔗 API Routing (`server/config/urls.py`)

All under `/api/v1/`:
- `/auth/` → accounts
- `/services/` → services
- `/healthcare/` → healthcare
- `/blood/` → blood
- `/ambulance/` → ambulance
- `/education/` → education
- `/ngo/` → ngo
- `/government/` → government
- `/reviews/` → reviews
- `/notifications/` → notifications
- `/ai/` → ai_assistant
- `/analytics/` → analytics
- `/social-auth/` → Google OAuth
- `/api/docs/` → Swagger UI

### WebSocket Endpoints
- `ws/notifications/` — Live notifications
- `ws/emergency/{id}/` — Live ambulance tracking

---

## 🔑 Key Settings (`server/config/settings/base.py`)

- **Custom User model:** `accounts.User` (UUID PK, email login)
- **JWT:** Access token 15min, Refresh 7 days, rotation + blacklist enabled
- **CORS:** Allows `http://localhost:5173` (Vite dev server)
- **Rate limiting:** 100/min anon, 300/min user, 10/min auth, 30/hr AI chat, 20/10min emergency
- **Environments:** `base.py`, `development.py`, `production.py`

---

## 🗃️ Key Models (`accounts`)

```python
User          # UUID PK, email-based, ManyToMany Roles, is_email_verified
UserProfile   # full_name, phone, avatar_url, gender, DOB, address, lat/lng, bio
Role          # visitor | citizen | provider | volunteer | moderator | admin
EmailVerificationToken
PasswordResetToken
```

---

## 📡 Frontend API Layer (`client/src/api/`)

- `axios.ts` — Axios instance with base URL + JWT interceptors
- `services.ts` — All API calls grouped by domain:
  - `authApi` — register, login, logout, me, verifyEmail, forgotPassword, resetPassword, changePassword
  - `servicesApi` — getCategories, getServices, getNearby, getFavorites, addFavorite
  - `healthcareApi` — getHospitals, getNearbyHospitals, getDoctors, getAppointments, bookAppointment, cancelAppointment
  - `bloodApi` — searchDonors, registerDonor, updateAvailability, getMyRequests, createRequest
  - `ambulanceApi` — getNearbyAmbulances, requestEmergency, getMyEmergencies, getEmergency
  - `notificationsApi` — getAll, markAllRead, markRead
  - `aiApi` — chat, getHistory, getRecommendations
  - `educationApi` — getInstitutions, createInstitution, getNearby
  - `ngoApi` — getNGOs, createNGO, getEvents, registerVolunteer
  - `govApi` — getOffices, createOffice, getServices
  - `reviewsApi` — getReviews, submitReview
  - `analyticsApi` — getDashboard, getDailyUsers, getAppointmentTrends, getBloodStats, getEmergencyStats
  - `adminApi` — listUsers, listAppointments, updateAppointmentStatus, listEmergencyRequests, updateEmergencyStatus, listBloodRequests, updateBloodRequestStatus, listAmbulances, createAmbulance, updateAmbulance, deleteAmbulance

---

## 🚀 Running Locally

### Frontend
```bash
cd client
npm run dev   # Starts Vite dev server at localhost:5173
```

### Backend
```bash
cd server
python manage.py runserver   # Settings via .env
```

Environment files:
- `client/.env` — Frontend env vars (e.g. API base URL)
- `server/.env` — Backend secrets (DB, Redis, Gemini, Cloudinary, etc.)

---

## 🚢 Production Stack

Docker + Docker Compose + Nginx + Daphne (ASGI) + Gunicorn + Celery workers + Let's Encrypt SSL
CI/CD via GitHub Actions → GHCR → SSH deploy
