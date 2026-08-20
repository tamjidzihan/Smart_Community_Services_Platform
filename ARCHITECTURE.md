# 🏗️ SCSP Architecture Documentation

**Smart Community Services Platform — System Architecture v1.0.0**

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Low-Level Architecture](#3-low-level-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Database Architecture](#6-database-architecture)
7. [Real-Time Architecture](#7-real-time-architecture)
8. [AI Architecture](#8-ai-architecture)
9. [Security Architecture](#9-security-architecture)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Data Flow Diagrams](#11-data-flow-diagrams)
12. [Design Decisions & Trade-offs](#12-design-decisions--trade-offs)

---

## 1. Architecture Overview

SCSP follows a **layered monolith with async extensions** pattern. Rather than a premature microservices split, the system uses a well-structured Django monolith with:

- **Synchronous REST API** for standard CRUD operations
- **Asynchronous WebSocket layer** via Django Channels for real-time features
- **Distributed task queue** via Celery for background jobs
- **Redis** as the central nervous system (cache, pub-sub, Celery broker, channel layer)

This provides microservice-level isolation within a single deployable unit — reducing operational complexity while maintaining a clear path to service extraction as traffic grows.

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT TIER                                 │
│   Browser (React SPA)  ·  Mobile Browser  ·  API Consumers      │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / WSS
┌──────────────────────────────▼──────────────────────────────────┐
│                    EDGE / GATEWAY TIER                           │
│           Nginx  ·  SSL Termination  ·  Rate Limiting           │
│           Static Files  ·  WebSocket Upgrade  ·  Gzip           │
└───────────┬──────────────────────────────────┬──────────────────┘
            │ HTTP /api/                        │ WS /ws/
┌───────────▼───────────┐          ┌───────────▼───────────────┐
│   APPLICATION TIER     │          │    REALTIME TIER           │
│  Django REST Framework │          │  Django Channels + Daphne  │
│  REST API · Auth · ORM │          │  WebSocket Consumers       │
│  Business Logic        │          │  Channel Layer (Redis)     │
└───────────┬────────────┘          └───────────┬───────────────┘
            │                                   │
┌───────────▼───────────────────────────────────▼───────────────┐
│                     ASYNC WORKER TIER                          │
│         Celery Workers  ·  Celery Beat (Scheduler)            │
│  Email  ·  SMS  ·  Blood Alerts  ·  Ambulance Dispatch        │
└───────────────────────────────────────────────────────────────┘
            │                        │
┌───────────▼────────────┐ ┌────────▼──────────────────────────┐
│     DATA TIER           │ │         AI TIER                   │
│  PostgreSQL 16          │ │  OpenAI GPT-4o                   │
│  Redis 7.2              │ │  Intent Parser                   │
│  Cloudinary CDN         │ │  Recommendation Engine           │
└────────────────────────┘ └──────────────────────────────────┘
```

---

## 2. High-Level Architecture

### System Components

| Component | Technology | Role |
|-----------|-----------|------|
| **Web Frontend** | React 19 + Vite | SPA delivered to browsers |
| **API Gateway** | Nginx 1.25 | Reverse proxy, SSL, rate limiting |
| **REST API** | Django 5 + DRF | Business logic, data access |
| **WebSocket Server** | Daphne (ASGI) | Persistent real-time connections |
| **Task Queue** | Celery 5 | Async background jobs |
| **Message Broker** | Redis 7 | Celery broker + WS channel layer |
| **Cache** | Redis 7 | Query cache, session data |
| **Primary DB** | PostgreSQL 16 | Relational data store |
| **File Storage** | Cloudinary CDN | User uploads, media files |
| **AI Engine** | OpenAI GPT-4o | Natural language processing |

### Communication Patterns

```
React → Axios → Nginx → Django DRF             (REST, request/response)
React → WebSocket → Nginx → Daphne → Channels  (real-time, persistent)
Django View → Celery.delay() → Redis → Worker  (async jobs, fire-and-forget)
Worker → channel_layer.group_send() → Daphne   (push to WebSocket clients)
Django View → OpenAI SDK → GPT-4o API          (AI inference, synchronous)
```

---

## 3. Low-Level Architecture

### Request Lifecycle (REST API)

```
1. Browser sends:  POST /api/v1/ambulance/emergency/
                   Authorization: Bearer eyJ...

2. Nginx:          Rate check (limit_req zone=api)
                   Proxy pass → backend:8000

3. Daphne:         Receives HTTP request, routes to Django WSGI handler

4. Django Middleware Stack (in order):
   a. SecurityMiddleware        → HSTS, XSS protection headers
   b. WhiteNoiseMiddleware      → Skip (not a static file)
   c. CorsMiddleware            → Add CORS headers
   d. SessionMiddleware         → Load session
   e. AuthenticationMiddleware  → Load user
   f. AuditLogMiddleware        → Log to audit_logs (async-safe)

5. URL Router:     config/urls.py → apps/ambulance/urls.py
                   → EmergencyRequestViewSet.create()

6. DRF Permission: JWTAuthentication.authenticate() → verify token sig + expiry
                   IsAuthenticated.has_permission() → user.is_authenticated

7. DRF Throttle:   UserRateThrottle → Redis.incr(key) → 300/min check

8. Serializer:     EmergencyRequestSerializer.is_valid()
                   → Field validation + Zod-equivalent checks

9. View Logic:     emergency = serializer.save(citizen=request.user)
                   dispatch_ambulance.delay(str(emergency.id))  ← Celery async

10. DB Query:      INSERT INTO emergency_requests ...
                   (PostgreSQL via psycopg2)

11. Response:      201 Created + serialized EmergencyRequest JSON

12. Celery Worker: (in parallel)
    a. Query nearest available ambulance (SELECT + distance calc)
    b. UPDATE ambulances SET status='en_route'
    c. UPDATE emergency_requests SET assigned_ambulance=..., status='dispatched'
    d. send_notification(user, ...) → INSERT notification + channel_layer.group_send()
    e. Daphne pushes to citizen's open WebSocket connection
```

---

## 4. Backend Architecture

### App Module Structure

```
server/
├── config/
│   ├── settings/
│   │   ├── base.py          # Shared: DB, auth, DRF, Celery, Channels
│   │   ├── development.py   # Debug toolbar, console email
│   │   └── production.py    # Security headers, HTTPS enforcement
│   ├── urls.py              # Root URL dispatcher (12 app routers)
│   ├── asgi.py              # ProtocolTypeRouter: HTTP + WebSocket
│   └── celery.py            # Celery app, autodiscover_tasks
│
├── apps/
│   ├── accounts/            # USER DOMAIN
│   │   ├── models.py        # User, UserProfile, Role, EmailVerificationToken, PasswordResetToken
│   │   ├── serializers.py   # RegisterSerializer, TokenObtainPairSerializer, UpdateProfileSerializer
│   │   ├── views.py         # RegisterView, LoginView, LogoutView, MeView, ForgotPasswordView
│   │   ├── tasks.py         # send_verification_email, send_password_reset_email
│   │   ├── pipeline.py      # social-auth: save_user_profile (Google OAuth)
│   │   └── admin.py         # UserAdmin with inline UserProfile
│   │
│   ├── services/            # SERVICE MARKETPLACE DOMAIN
│   │   ├── models.py        # ServiceCategory, ProviderProfile, ServiceListing, ServiceAvailability, Favorite
│   │   ├── serializers.py   # ServiceListingSerializer (with distance_km), CategorySerializer (tree)
│   │   └── views.py         # ServiceListingViewSet (with /nearby/ action), FavoriteListView
│   │
│   ├── healthcare/          # HEALTHCARE DOMAIN
│   │   ├── models.py        # Hospital, Doctor, DoctorSchedule, Appointment
│   │   └── views.py         # HospitalViewSet (/nearby/), DoctorViewSet, AppointmentViewSet (/cancel/)
│   │
│   ├── blood/               # BLOOD DONATION DOMAIN
│   │   ├── models.py        # BloodDonor, BloodRequest, DonationHistory, COMPATIBLE_DONORS map
│   │   ├── views.py         # BloodDonorViewSet (/search/ with compatibility), BloodRequestViewSet
│   │   └── tasks.py         # notify_nearby_donors (broadcast to compatible donors within 20km)
│   │
│   ├── ambulance/           # EMERGENCY DOMAIN
│   │   ├── models.py        # Ambulance, EmergencyRequest, EmergencyContact
│   │   ├── serializers.py   # AmbulanceSerializer, EmergencyRequestSerializer (with websocket_channel)
│   │   ├── views.py         # AmbulanceViewSet (/nearby/, /update_location/), EmergencyRequestViewSet
│   │   ├── consumers.py     # EmergencyTrackingConsumer, AmbulanceTrackingConsumer (WebSocket)
│   │   ├── routing.py       # WebSocket URL patterns
│   │   └── tasks.py         # dispatch_ambulance (nearest-first), notify_emergency_status_change
│   │
│   ├── notifications/       # NOTIFICATION DOMAIN
│   │   ├── models.py        # Notification (typed, with JSON data field)
│   │   ├── consumers.py     # NotificationConsumer (authenticated WebSocket, mark_read action)
│   │   ├── middleware.py    # JWTAuthMiddleware (extracts token from WS query param)
│   │   ├── routing.py       # /ws/notifications/ WebSocket route
│   │   └── utils.py         # send_notification() helper (DB + WebSocket push)
│   │
│   ├── ai_assistant/        # AI DOMAIN
│   │   ├── models.py        # AIConversation (session-based, role, intent stored)
│   │   └── views.py         # chat() with GPT-4o, _resolve_intent() DB query, recommendations()
│   │
│   ├── analytics/           # ANALYTICS DOMAIN
│   │   ├── models.py        # AuditLog
│   │   ├── middleware.py    # AuditLogMiddleware (logs POST/PUT/PATCH/DELETE on critical paths)
│   │   └── views.py         # dashboard_summary, daily_users, blood_stats, emergency_stats
│   │
│   ├── education/           # EDUCATION DOMAIN
│   │   └── models.py        # Institution (with nearby action)
│   │
│   ├── ngo/                 # NGO DOMAIN
│   │   └── models.py        # NGO, Volunteer, NGOEvent
│   │
│   ├── government/          # GOVERNMENT DOMAIN
│   │   └── models.py        # GovernmentOffice, GovernmentService
│   │
│   └── reviews/             # REVIEW DOMAIN
│       └── models.py        # Review (with auto avg-rating update on save)
│
└── utils/
    ├── permissions.py       # IsAdminRole, IsModeratorOrAdmin, IsServiceProvider, IsOwnerOrAdmin
    ├── pagination.py        # StandardPagination (count, next, previous, total_pages, current_page)
    └── geo.py               # calculate_distance_km (geopy), build_geo_filter (Python-side radius)
```

### Django Settings Architecture

```python
# Three-tier settings inheritance:
base.py          # All environments: installed apps, DRF, JWT, Channels, Celery, Cloudinary
  └── development.py  # DEBUG=True, console email, debug toolbar
  └── production.py   # HTTPS enforcement, HSTS, secure cookies, error logging
```

### DRF Configuration

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework_simplejwt.authentication.JWTAuthentication'],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
    'DEFAULT_FILTER_BACKENDS': [DjangoFilterBackend, SearchFilter, OrderingFilter],
    'DEFAULT_PAGINATION_CLASS': 'utils.pagination.StandardPagination',
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',   # Auto OpenAPI docs
    'DEFAULT_THROTTLE_CLASSES': [AnonRateThrottle, UserRateThrottle],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/minute',
        'user': '300/minute',
        'auth': '10/minute',       # Login/register
        'ai_chat': '30/hour',      # AI usage
        'emergency': '20/10min',   # Emergency requests
    }
}
```

---

## 5. Frontend Architecture

### Component Hierarchy

```
<App>  (main.tsx — QueryClientProvider, ThemeProvider, AppInitializer)
└── <RouterProvider>
    └── <Layout>  (Navbar + Footer + AnimatePresence wrapper)
        ├── <HomePage>
        │   ├── Hero with Search
        │   ├── CategoryGrid
        │   ├── AI Demo Preview
        │   └── CTA Section
        │
        ├── <EmergencyPage>
        │   ├── useGeolocation hook
        │   ├── ConditionSelector
        │   ├── NearbyHospitalsCard
        │   ├── NearbyAmbulancesCard
        │   └── EmergencyHotlines
        │
        ├── <AIChatPage>
        │   ├── QuickPrompts
        │   ├── MessageList (AnimatePresence)
        │   ├── DataResultCards (donors/hospitals/ambulances)
        │   └── MessageInput + Send
        │
        ├── <AdminAnalyticsPage>
        │   ├── KPI Cards (4x)
        │   ├── LineChart (daily users — Recharts)
        │   ├── PieChart (blood groups — Recharts)
        │   ├── BarChart (appointments — Recharts)
        │   └── BarChart horizontal (emergency types — Recharts)
        │
        └── [22 other pages]
```

### State Management Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    STATE LAYERS                          │
├──────────────────┬──────────────────────────────────────┤
│ Server State     │ TanStack Query                       │
│ (API data)       │ - Automatic caching (5 min stale)   │
│                  │ - Background refetch                 │
│                  │ - Optimistic updates                 │
│                  │ - Retry on failure (1 retry)         │
├──────────────────┼──────────────────────────────────────┤
│ Global Client    │ Zustand                              │
│ State            │ - useAuthStore (user, tokens, roles) │
│                  │ - useNotificationStore (unread count)│
├──────────────────┼──────────────────────────────────────┤
│ Form State       │ React Hook Form + Zod               │
│                  │ - Schema validation                  │
│                  │ - Controlled/uncontrolled fields     │
├──────────────────┼──────────────────────────────────────┤
│ URL State        │ React Router searchParams            │
│                  │ - Filters, search terms, pagination  │
├──────────────────┼──────────────────────────────────────┤
│ Local UI State   │ useState / useReducer               │
│                  │ - Modal open/close, selected tabs   │
└──────────────────┴──────────────────────────────────────┘
```

### Custom Hooks

```typescript
useGeolocation()         // Browser GPS, cached, with refresh
useWebSocket(path, opts) // Reconnectable WS with JWT auth query param
useNotificationWS()      // Global notifications WebSocket consumer
useDebounce(value, ms)   // Search input debouncing
useLocalStorage(key)     // Persistent preferences
```

### Routing Architecture

```typescript
// Three route guard types:
<Layout>                        // Public (all visitors)
  <GuestRoute>                  // Unauthenticated only (login, register)
  <ProtectedRoute>              // Auth required (appointments, emergency)
  <ProtectedRoute roles={[...]}>// Role-gated (admin panel)
```

### API Layer Architecture

```typescript
// src/api/axios.ts — Single axios instance with:
//   1. Base URL from VITE_API_URL env var
//   2. Request interceptor: inject Authorization header from localStorage
//   3. Response interceptor: on 401 → refresh token → retry original request
//                            on refresh failure → logout + redirect /login

// src/api/services.ts — Typed service modules:
//   authApi, servicesApi, healthcareApi, bloodApi, ambulanceApi
//   notificationsApi, aiApi, educationApi, ngoApi, govApi
//   reviewsApi, analyticsApi
```

---

## 6. Database Architecture

### Entity Relationship Summary

```
users (1) ──────────────── (1) user_profiles
users (M) ──────────────── (M) roles  [via user_roles junction]
users (1) ──────────────── (M) appointments
users (1) ──────────────── (1) blood_donors
users (1) ──────────────── (M) blood_requests
users (1) ──────────────── (1) provider_profiles
users (1) ──────────────── (1) volunteer_profile
users (1) ──────────────── (M) notifications
users (1) ──────────────── (M) ai_conversations
users (1) ──────────────── (M) reviews
users (1) ──────────────── (M) favorites
users (1) ──────────────── (M) emergency_requests
users (1) ──────────────── (M) ambulances [as provider]
users (1) ──────────────── (M) audit_logs

provider_profiles (1) ─── (M) service_listings
service_listings (M) ──── (M) service_availability
service_listings (1) ──── (M) reviews [via service_id]

hospitals (1) ──────────── (M) doctors
doctors (1) ─────────────── (M) doctor_schedules
doctors (1) ─────────────── (M) appointments
hospitals (1) ──────────── (M) appointments

ambulances (1) ─────────── (M) emergency_requests
blood_donors (M) ────────── (M) blood_requests [via donation_history]

ngos (1) ───────────────── (M) volunteers
ngos (1) ───────────────── (M) ngo_events

government_offices (1) ─── (M) government_services
```

### Key Database Tables

```sql
-- Core user table (UUID primary key)
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(254) UNIQUE NOT NULL,
    password    VARCHAR(128) NOT NULL,
    is_active   BOOLEAN DEFAULT TRUE,
    is_staff    BOOLEAN DEFAULT FALSE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    date_joined TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial data stored as separate lat/lon floats
-- (Compatible without PostGIS, upgradeable to POINT type)
CREATE TABLE blood_donors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    blood_group     VARCHAR(3) NOT NULL,
    latitude        FLOAT NOT NULL,
    longitude       FLOAT NOT NULL,
    is_available    BOOLEAN DEFAULT TRUE,
    last_donated_at DATE,
    total_donations INT DEFAULT 0
);

-- Composite indexes for frequent query patterns
CREATE INDEX idx_blood_donors_group_available ON blood_donors(blood_group, is_available);
CREATE INDEX idx_appointments_citizen_status ON appointments(citizen_id, status);
CREATE INDEX idx_ambulances_status_active ON ambulances(status, is_active);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_user_time ON audit_logs(user_id, timestamp);

-- Full-text search index (GIN) for service discovery
CREATE INDEX idx_service_listings_fts ON service_listings
    USING gin(to_tsvector('english', title || ' ' || description));
```

### Query Patterns & Optimization

```python
# Pattern 1: Nearby search (Python-side, no PostGIS required)
# For each entity with lat/lon, calculate geodesic distance client-side
# and sort results. Acceptable for < 100k records.

# Pattern 2: Efficient blood donor search with composite filter
BloodDonor.objects.filter(
    blood_group__in=compatible_groups,  # Uses composite index
    is_available=True
).select_related('user__profile')       # Avoids N+1 on name/phone

# Pattern 3: Dashboard aggregation with single query
User.objects.filter(date_joined__gte=week_ago).count()  # Uses date index

# Pattern 4: Review average update (triggered on new review)
Review.objects.filter(service_id=service_id, is_approved=True)
    .aggregate(avg=Avg('rating'), count=Count('id'))
# Then single UPDATE on target table (hospital/doctor/service)
```

---

## 7. Real-Time Architecture

### WebSocket Connection Flow

```
Browser                    Nginx                Daphne/Channels          Redis
   │                          │                        │                    │
   │──── WSS /ws/notifications/ ──────────────────────►│                    │
   │     ?token=eyJ...         │                        │                    │
   │                           │──── WS upgrade ───────►│                    │
   │                           │                        │── JWTAuthMiddleware│
   │                           │                        │   verify token      │
   │                           │                        │                    │
   │                           │                        │── group_add() ─────►│
   │                           │                        │   'notifications_   │
   │                           │                        │    {user_id}'       │
   │◄─── {"type":"unread_count","count":3} ────────────│                    │
   │                           │                        │                    │
   │     [later — Celery task] │                        │                    │
   │                           │      Celery Worker ────┼──── group_send() ──►│
   │                           │                        │                    │
   │                           │                        │◄─── consume ───────│
   │◄─── {"type":"notification","title":"🚑 Dispatched"} ──────────────────│
```

### Channel Groups

| Group Name | Members | Events |
|-----------|---------|--------|
| `notifications_{user_id}` | User's browser tabs | notification_message |
| `emergency_{emergency_id}` | Citizen tracking page | status_update, location_update |
| `ambulance_{ambulance_id}` | All tracking that ambulance | location_update |

### Celery Task Architecture

```
TASK QUEUES:
  default       → General tasks (email, profile updates)
  blood         → notify_nearby_donors (high priority)
  ambulance     → dispatch_ambulance (high priority, max_retries=5)
  notifications → Status change notifications

BEAT SCHEDULE (Periodic Tasks):
  Every 5 min   → Check unresolved emergency requests (alert admin if > 10 min)
  Every 1 hour  → Recalculate recommendation scores for active users
  Every 24 hrs  → Generate daily analytics snapshot
  Every 12 hrs  → Certbot SSL renewal check
```

---

## 8. AI Architecture

### GPT-4o Integration Pattern

```
User Input: "Find O+ blood donor near Mirpur urgently"
     │
     ▼
POST /api/v1/ai/chat/
     │
     ▼
┌─────────────────────────────────────────────────────┐
│                 System Prompt                        │
│  Role: Community Services Assistant                  │
│  Output: JSON only (intent + entities + response)   │
│  Model: gpt-4o                                      │
│  response_format: {"type": "json_object"}           │
└─────────────────────────────────────────────────────┘
     │
     ▼
GPT-4o Response:
{
  "intent": "blood_search",
  "entities": {
    "blood_group": "O+",
    "urgency": "emergency",
    "location": "Mirpur",
    "radius_km": 10
  },
  "human_response": "🩸 Found 3 O+ donors nearby...",
  "confidence": 0.97
}
     │
     ▼
_resolve_intent() — Django DB query execution:
  ├── blood_search     → BloodDonor.filter(blood_group__in=compatible).geo_filter()
  ├── hospital_search  → Hospital.filter(specialization).geo_filter()
  ├── ambulance_request→ Ambulance.filter(status='available').geo_filter()
  └── general          → No DB query, return AI text only
     │
     ▼
Response: { intent, human_response, entities, confidence, data: {donors: [...]} }
     │
     ▼
Frontend renders:
  - AI message bubble with human_response text
  - Donor/hospital/ambulance cards below the message
  - Intent badge (blue chip)
```

### Conversation Context Management

```python
# On each chat request, retrieve last 10 messages for context
history = AIConversation.objects.filter(
    user=request.user, session_id=session_id
).order_by('created_at')[:10]

# Build OpenAI messages array
messages = [{'role': 'system', 'content': SYSTEM_PROMPT}]
for msg in history:
    messages.append({'role': msg.role, 'content': msg.content})
messages.append({'role': 'user', 'content': user_message})
```

---

## 9. Security Architecture

### Authentication Flow

```
Register → Hash password (Django PBKDF2-SHA256) → Store
Login    → Verify password → Issue JWT pair:
           access_token  (HS256, 15-min expiry, stateless)
           refresh_token (HS256, 7-day expiry, stored as SHA256 hash in DB)

API Request:
  1. Extract Bearer token from Authorization header
  2. Verify HS256 signature
  3. Check expiry (exp claim)
  4. Check token not in blacklist (Redis O(1) lookup)
  5. Extract user_id → fetch user from DB (cached 5 min)

Refresh:
  1. Receive refresh token
  2. Verify signature + expiry
  3. Hash token → check DB (not revoked)
  4. Issue NEW access + NEW refresh token
  5. Mark old refresh token is_revoked=True
  6. Store new refresh token hash in DB
```

### RBAC Permission Matrix

```
Endpoint Class               visitor  citizen  provider  volunteer  moderator  admin
─────────────────────────────────────────────────────────────────────────────────────
GET  /api/v1/services/         ✅       ✅        ✅         ✅         ✅        ✅
POST /api/v1/services/         ❌       ❌        ✅         ❌         ❌        ✅
GET  /api/v1/healthcare/       ✅       ✅        ✅         ✅         ✅        ✅
POST /api/v1/healthcare/appts/ ❌       ✅        ❌         ❌         ❌        ✅
POST /api/v1/ambulance/emerg/  ❌       ✅        ❌         ❌         ❌        ✅
PATCH /api/v1/ambulance/*/status ❌     ❌        ✅         ❌         ✅        ✅
GET  /api/v1/analytics/        ❌       ❌        ❌         ❌         ✅        ✅
DELETE /api/v1/reviews/*/      ❌       ❌        ❌         ❌         ✅        ✅
```

### Defense-in-Depth Layers

```
Layer 1 — Network:     Nginx blocks non-HTTPS, rate limiting per IP
Layer 2 — Transport:   TLS 1.3, HSTS, no downgrade
Layer 3 — Application: CORS whitelist, CSRF middleware, security headers
Layer 4 — Auth:        JWT + blacklist, refresh rotation, session audit
Layer 5 — Business:    RBAC permissions, object-level ownership checks
Layer 6 — Data:        ORM parameterized queries, no raw string interpolation
Layer 7 — Files:       Cloudinary MIME validation, extension whitelist, size limit
Layer 8 — Monitoring:  Audit log on all sensitive actions, error alerting
```

---

## 10. Deployment Architecture

### Container Topology

```
Host: Ubuntu 22.04 LTS VPS
├── Docker Engine 26+
└── Docker Compose v2
    ├── nginx          (port 80, 443)       → Reverse proxy, SSL, static
    ├── frontend       (internal :80)        → React SPA (pre-built)
    ├── backend        (internal :8000)      → Django + Daphne ASGI
    ├── celery_worker  (no port)             → Async task processor
    ├── celery_beat    (no port)             → Periodic task scheduler
    ├── db             (internal :5432)      → PostgreSQL 16
    └── redis          (internal :6379)      → Cache + broker + channels
```

### Volume Strategy

```
postgres_data  → /var/lib/postgresql/data  (persistent DB)
redis_data     → /data                     (optional RDB persistence)
static_files   → /app/staticfiles          (shared: backend → nginx)
media_files    → /app/media                (user uploads cache)
certbot_conf   → /etc/letsencrypt          (SSL certificates)
certbot_www    → /var/www/certbot          (ACME challenge files)
```

### Network Isolation

```
All containers on private bridge: scsp_network
Only nginx exposes ports 80 + 443 to host
DB port 5432 never exposed externally
Redis port 6379 never exposed externally
Backend port 8000 only reachable from nginx + workers
```

---

## 11. Data Flow Diagrams

### Emergency Request Flow (Critical Path)

```
[Citizen App]                [Backend]              [Celery]          [Driver App]
     │                           │                      │                   │
     │── POST /ambulance/emerg/─►│                      │                   │
     │                           │── INSERT emergency_req                   │
     │                           │── dispatch_ambulance.delay() ───────────►│
     │◄── 201 + emergency obj ───│                      │                   │
     │                           │                      │                   │
     │   [WebSocket open]        │                      │                   │
     │──── WS /ws/emergency/id/ ─►                      │                   │
     │                           │                      │                   │
     │                           │             ┌────────▼──────────┐        │
     │                           │             │ Query nearest amb  │        │
     │                           │             │ UPDATE amb status  │        │
     │                           │             │ UPDATE emerg status│        │
     │                           │             └────────┬──────────┘        │
     │                           │                      │                   │
     │                           │             ┌────────▼──────────┐        │
     │                           │             │ send_notification()│        │
     │                           │             │ channel_layer.     │        │
     │                           │             │ group_send()       │        │
     │                           │             └────────┬──────────┘        │
     │                           │                      │                   │
     │◄── WS: status_update ─────────────────────────────────────────       │
     │    "Ambulance dispatched"  │                      │                   │
     │    ETA: 7 minutes          │                      │                   │
     │                           │                      │                   │
     │   [Map shows ambulance]   │                      │                   │
     │                           │      Driver updates GPS every 30s        │
     │                           │◄── PATCH /ambulance/{id}/update_location/│
     │                           │── channel_layer.group_send() ────────────│
     │◄── WS: location_update ───│                      │                   │
     │    lat, lng               │                      │                   │
```

---

## 12. Design Decisions & Trade-offs

### Decision 1: Monolith vs Microservices

**Chosen:** Structured monolith with Django apps as module boundaries  
**Rationale:** For an FYP/startup context, microservices add DevOps overhead without benefit at this scale. Each Django app is independently testable and can be extracted to a separate service when needed.  
**Trade-off:** Single deployment unit; horizontal scaling requires sticky sessions or shared Redis (already in place).

### Decision 2: WebSocket via Django Channels vs Socket.IO

**Chosen:** Django Channels + Redis channel layer  
**Rationale:** Native Django integration, same codebase, ORM access in consumers. No additional Node.js server needed.  
**Trade-off:** Daphne is single-threaded per worker; for very high WS concurrency, multiple Daphne instances with shared Redis channel layer are needed.

### Decision 3: Geospatial Queries (PostGIS vs Python-side)

**Chosen:** Python-side distance calculation using geopy  
**Rationale:** Removes PostGIS/GDAL system dependency, simpler VPS setup, no Django GIS extension needed. Acceptable for < 100k entities.  
**Trade-off:** Full table scans for large datasets. Migration path: add PostGIS, change `latitude/longitude` Float fields to `location = PointField()`, use `ST_DWithin` index.

### Decision 4: File Storage (Local vs Cloudinary)

**Chosen:** Cloudinary CDN  
**Rationale:** No disk management on VPS, built-in CDN, image transformations API, malware scanning. Zero storage cost risk on small deployments.  
**Trade-off:** External dependency; files not accessible without internet. Mitigation: local storage fallback in development.

### Decision 5: JWT vs Session Auth

**Chosen:** JWT with refresh token rotation  
**Rationale:** Stateless API enables horizontal scaling. Supports React SPA + future mobile app with same auth system.  
**Trade-off:** Token revocation requires Redis blacklist (adds one Redis lookup per request). Mitigated by short (15-min) access token lifetime.

---

*Last updated: July 2025 · SCSP Architecture v1.0.0*
