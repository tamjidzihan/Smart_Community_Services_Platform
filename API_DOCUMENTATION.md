# 📡 SCSP API Documentation

**Smart Community Services Platform — REST API Reference v1.0.0**

Base URL: `https://scsp.app/api/v1`  
Interactive Docs: `https://scsp.app/api/docs/` (Swagger UI via drf-spectacular)  
OpenAPI Schema: `https://scsp.app/api/schema/`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User Profile](#2-user-profile)
3. [Services](#3-services)
4. [Healthcare](#4-healthcare)
5. [Blood Donation](#5-blood-donation)
6. [Ambulance & Emergency](#6-ambulance--emergency)
7. [Education](#7-education)
8. [NGO & Volunteers](#8-ngo--volunteers)
9. [Government Services](#9-government-services)
10. [Reviews & Ratings](#10-reviews--ratings)
11. [Notifications](#11-notifications)
12. [AI Assistant](#12-ai-assistant)
13. [Analytics](#13-analytics)
14. [WebSocket Events](#14-websocket-events)
15. [Error Reference](#15-error-reference)

---

## Global Conventions

### Request Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json
```

### Pagination

All list endpoints return paginated responses:

```json
{
  "count": 150,
  "next": "https://scsp.app/api/v1/services/listings/?page=2",
  "previous": null,
  "total_pages": 8,
  "current_page": 1,
  "results": [...]
}
```

Query params: `?page=2&page_size=10` (max `page_size=100`)

### Filtering & Search

```
?search=keyword          Full-text search (title, description)
?ordering=-created_at    Order by field (prefix - for descending)
?category=<uuid>         Filter by category
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK |
| `201` | Created |
| `204` | No Content (DELETE success) |
| `400` | Bad Request — validation errors |
| `401` | Unauthorized — missing or invalid token |
| `403` | Forbidden — insufficient permissions |
| `404` | Not Found |
| `429` | Too Many Requests — rate limit hit |
| `500` | Internal Server Error |

---

## 1. Authentication

**Base path:** `/api/v1/auth/`  
**Rate limit:** 10 requests/minute per IP for login/register

---

### 1.1 Register

```http
POST /api/v1/auth/register/
```

**Auth required:** No

**Request body:**

```json
{
  "email": "citizen@example.com",
  "password": "SecurePass123!",
  "confirm_password": "SecurePass123!",
  "full_name": "Rahim Uddin"
}
```

**Response `201 Created`:**

```json
{
  "message": "Registration successful. Please verify your email.",
  "email": "citizen@example.com"
}
```

**Errors:**

```json
{ "email": ["This email is already registered."] }
{ "confirm_password": ["Passwords do not match."] }
{ "password": ["This field must be at least 8 characters."] }
```

---

### 1.2 Login

```http
POST /api/v1/auth/login/
```

**Auth required:** No

**Request body:**

```json
{
  "email": "citizen@example.com",
  "password": "SecurePass123!"
}
```

**Response `200 OK`:**

```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "citizen@example.com",
    "is_email_verified": true,
    "date_joined": "2025-01-15T10:30:00Z",
    "profile": {
      "full_name": "Rahim Uddin",
      "phone": "+8801712345678",
      "avatar_url": "https://res.cloudinary.com/scsp/image/upload/...",
      "gender": "M",
      "date_of_birth": "1990-05-15",
      "address": "Mirpur, Dhaka",
      "latitude": 23.8103,
      "longitude": 90.4125,
      "bio": ""
    },
    "roles": [
      { "id": 2, "name": "citizen", "description": "Regular citizen user" }
    ]
  }
}
```

**Errors `401`:**

```json
{ "detail": "No active account found with the given credentials" }
```

---

### 1.3 Refresh Token

```http
POST /api/v1/auth/token/refresh/
```

**Auth required:** No

**Request body:**

```json
{ "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**Response `200 OK`:**

```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> **Note:** Refresh token rotation is enabled. The old refresh token is blacklisted on each use.

---

### 1.4 Logout

```http
POST /api/v1/auth/logout/
```

**Auth required:** Yes

**Request body:**

```json
{ "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**Response `200 OK`:**

```json
{ "message": "Logged out successfully." }
```

---

### 1.5 Verify Email

```http
POST /api/v1/auth/verify-email/
```

**Auth required:** No

**Request body:**

```json
{ "token": "3fa85f64-5717-4562-b3fc-2c963f66afa6" }
```

**Response `200 OK`:**

```json
{ "message": "Email verified successfully." }
```

---

### 1.6 Forgot Password

```http
POST /api/v1/auth/forgot-password/
```

**Auth required:** No

**Request body:**

```json
{ "email": "citizen@example.com" }
```

**Response `200 OK`:** (always 200 to prevent email enumeration)

```json
{ "message": "If this email exists, a reset link has been sent." }
```

---

### 1.7 Reset Password

```http
POST /api/v1/auth/reset-password/
```

**Auth required:** No

**Request body:**

```json
{
  "token": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "password": "NewSecurePass123!",
  "confirm_password": "NewSecurePass123!"
}
```

**Response `200 OK`:**

```json
{ "message": "Password reset successfully." }
```

---

### 1.8 Google OAuth

```http
GET /social-auth/login/google-oauth2/
```

Redirects to Google OAuth consent screen. On success, redirects to frontend with JWT tokens in URL params.

---

## 2. User Profile

**Base path:** `/api/v1/auth/`

---

### 2.1 Get Current User

```http
GET /api/v1/auth/me/
```

**Auth required:** Yes

**Response `200 OK`:** _(same User object as login response)_

---

### 2.2 Update Profile

```http
PATCH /api/v1/auth/me/
```

**Auth required:** Yes

**Request body** (all fields optional):

```json
{
  "full_name": "Rahim Uddin Ahmed",
  "phone": "+8801712345678",
  "gender": "M",
  "date_of_birth": "1990-05-15",
  "address": "Mirpur-10, Dhaka-1216",
  "latitude": 23.8103,
  "longitude": 90.4125,
  "bio": "Community health worker",
  "avatar_url": "https://res.cloudinary.com/scsp/image/upload/v1/avatars/user.jpg"
}
```

**Response `200 OK`:** Full updated User object

---

### 2.3 Change Password

```http
POST /api/v1/auth/change-password/
```

**Auth required:** Yes

**Request body:**

```json
{
  "old_password": "OldPass123!",
  "new_password": "NewPass456!",
  "confirm_password": "NewPass456!"
}
```

**Response `200 OK`:**

```json
{ "message": "Password changed successfully." }
```

---

## 3. Services

**Base path:** `/api/v1/services/`

---

### 3.1 List Categories

```http
GET /api/v1/services/categories/
```

**Auth required:** No

**Response `200 OK`:**

```json
[
  {
    "id": "cat-uuid",
    "name": "Healthcare",
    "slug": "healthcare",
    "description": "Medical and health services",
    "icon": "local_hospital",
    "parent": null,
    "children": [
      { "id": "sub-uuid", "name": "Hospitals", "slug": "hospitals", "children": [] }
    ],
    "is_active": true
  }
]
```

---

### 3.2 List Services

```http
GET /api/v1/services/listings/
```

**Auth required:** No

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search title/description/address |
| `category` | UUID | Filter by category |
| `is_verified` | boolean | Filter verified providers only |
| `is_featured` | boolean | Featured services |
| `ordering` | string | `average_rating`, `-review_count`, `-created_at` |
| `page` | int | Page number |

**Response `200 OK`:**

```json
{
  "count": 48,
  "results": [
    {
      "id": "svc-uuid",
      "title": "City General Hospital",
      "description": "Full-service hospital with 24/7 emergency care",
      "address": "123 Hospital Road, Dhaka",
      "latitude": 23.8103,
      "longitude": 90.4125,
      "phone": "+8802-1234567",
      "email": "info@cityhospital.com",
      "website": "https://cityhospital.com",
      "status": "active",
      "is_verified": true,
      "is_featured": false,
      "average_rating": 4.6,
      "review_count": 124,
      "category": "cat-uuid",
      "category_name": "Hospitals",
      "provider_name": "City Medical Group",
      "availability": [
        { "day_of_week": 0, "open_time": "08:00", "close_time": "22:00", "is_available": true }
      ],
      "distance_km": null,
      "created_at": "2025-01-10T09:00:00Z"
    }
  ]
}
```

---

### 3.3 Nearby Services (GIS)

```http
GET /api/v1/services/listings/nearby/
```

**Auth required:** No

**Query params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `lat` | float | Yes | User latitude |
| `lng` | float | Yes | User longitude |
| `radius` | float | No | Search radius in km (default: 10) |
| `category` | UUID | No | Filter by category |

**Response `200 OK`:**

```json
{
  "count": 5,
  "results": [
    {
      "id": "svc-uuid",
      "title": "City General Hospital",
      "distance_km": 1.4,
      ...
    }
  ]
}
```

---

### 3.4 Service Detail

```http
GET /api/v1/services/listings/{id}/
```

**Auth required:** No

---

### 3.5 Create Service (Provider only)

```http
POST /api/v1/services/listings/
```

**Auth required:** Yes (Provider role)

**Request body:**

```json
{
  "title": "My Dental Clinic",
  "description": "Expert dental care since 2010",
  "category": "cat-uuid",
  "address": "45 Dhanmondi Road, Dhaka",
  "latitude": 23.7461,
  "longitude": 90.3742,
  "phone": "+8801987654321",
  "email": "clinic@example.com",
  "website": "https://mydental.com"
}
```

---

### 3.6 Favorites

```http
GET  /api/v1/services/favorites/     # List my favorites
POST /api/v1/services/favorites/     # Add to favorites
```

**Auth required:** Yes

**POST Request body:**

```json
{ "service_id": "svc-uuid" }
```

---

## 4. Healthcare

**Base path:** `/api/v1/healthcare/`

---

### 4.1 List Hospitals

```http
GET /api/v1/healthcare/hospitals/
```

**Auth required:** No

**Query params:** `category`, `emergency_available`, `is_verified`, `search`, `ordering`

**Response `200 OK`:**

```json
{
  "results": [
    {
      "id": "hosp-uuid",
      "name": "Dhaka Medical College Hospital",
      "category": "general",
      "address": "Bakshibazar, Dhaka",
      "latitude": 23.7232,
      "longitude": 90.4005,
      "phone": "+8802-55165088",
      "email": "info@dmch.gov.bd",
      "website": "https://dmch.gov.bd",
      "emergency_available": true,
      "bed_count": 2600,
      "available_beds": 124,
      "description": "Largest public hospital in Bangladesh",
      "image_url": "https://res.cloudinary.com/scsp/...",
      "is_verified": true,
      "average_rating": 4.2,
      "doctors_count": 45,
      "distance_km": null
    }
  ]
}
```

---

### 4.2 Nearby Hospitals (GIS)

```http
GET /api/v1/healthcare/hospitals/nearby/
```

**Query params:** `lat`, `lng`, `radius` (default 15km), `emergency=true`

---

### 4.3 List Doctors

```http
GET /api/v1/healthcare/doctors/
```

**Query params:** `hospital`, `is_available`, `specialization`, `search`

**Response `200 OK`:**

```json
{
  "results": [
    {
      "id": "doc-uuid",
      "full_name": "Dr. Farhan Hossain",
      "specialization": "Cardiology",
      "phone": "+8801811223344",
      "email": "dr.farhan@hospital.com",
      "bio": "20+ years in interventional cardiology",
      "avatar_url": "https://res.cloudinary.com/...",
      "consultation_fee": 800.00,
      "is_available": true,
      "average_rating": 4.9,
      "hospital": "hosp-uuid",
      "hospital_name": "Dhaka Medical College Hospital",
      "schedules": [
        {
          "id": 1,
          "day_of_week": 0,
          "day_name": "Monday",
          "start_time": "09:00",
          "end_time": "13:00",
          "max_appointments": 20,
          "is_available": true
        }
      ]
    }
  ]
}
```

---

### 4.4 Book Appointment

```http
POST /api/v1/healthcare/appointments/
```

**Auth required:** Yes (Citizen role)

**Request body:**

```json
{
  "doctor": "doc-uuid",
  "scheduled_at": "2025-07-15T10:00:00Z",
  "reason": "Chest pain and shortness of breath for 3 days"
}
```

**Response `201 Created`:**

```json
{
  "id": "appt-uuid",
  "doctor": "doc-uuid",
  "doctor_name": "Dr. Farhan Hossain",
  "doctor_specialization": "Cardiology",
  "hospital": "hosp-uuid",
  "hospital_name": "Dhaka Medical College Hospital",
  "citizen_name": "Rahim Uddin",
  "scheduled_at": "2025-07-15T10:00:00Z",
  "status": "scheduled",
  "reason": "Chest pain and shortness of breath for 3 days",
  "notes": "",
  "created_at": "2025-07-10T08:30:00Z"
}
```

---

### 4.5 My Appointments

```http
GET /api/v1/healthcare/appointments/
```

**Auth required:** Yes

---

### 4.6 Cancel Appointment

```http
PATCH /api/v1/healthcare/appointments/{id}/cancel/
```

**Auth required:** Yes (owner or admin)

**Response `200 OK`:**

```json
{ "message": "Appointment cancelled." }
```

---

## 5. Blood Donation

**Base path:** `/api/v1/blood/`

---

### 5.1 Search Blood Donors

```http
GET /api/v1/blood/donors/search/
```

**Auth required:** No

**Query params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `group` | string | Yes | Blood group: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-` |
| `lat` | float | Yes | Requester latitude |
| `lng` | float | Yes | Requester longitude |
| `radius` | float | No | Search radius in km (default: 20) |

> **Compatibility:** The system automatically includes compatible donor types. E.g., `AB+` recipients can receive from all 8 blood groups.

**Response `200 OK`:**

```json
{
  "count": 3,
  "results": [
    {
      "id": "donor-uuid",
      "full_name": "Karim Ahmed",
      "phone": "+8801611223344",
      "blood_group": "O+",
      "latitude": 23.8050,
      "longitude": 90.4080,
      "is_available": true,
      "last_donated_at": "2025-03-10",
      "total_donations": 7,
      "distance_km": 2.1
    }
  ]
}
```

---

### 5.2 Register as Donor

```http
POST /api/v1/blood/donors/
```

**Auth required:** Yes

**Request body:**

```json
{
  "blood_group": "O+",
  "latitude": 23.8103,
  "longitude": 90.4125,
  "is_available": true
}
```

---

### 5.3 Create Blood Request

```http
POST /api/v1/blood/requests/
```

**Auth required:** Yes

**Request body:**

```json
{
  "blood_group": "O+",
  "units_needed": 2,
  "patient_name": "Abdul Karim",
  "hospital_name": "Dhaka Medical College Hospital",
  "urgency": "critical",
  "latitude": 23.7232,
  "longitude": 90.4005,
  "notes": "Post-surgery, needs blood within 2 hours"
}
```

**Response `201 Created`:**

```json
{
  "id": "req-uuid",
  "blood_group": "O+",
  "units_needed": 2,
  "units_fulfilled": 0,
  "hospital_name": "Dhaka Medical College Hospital",
  "patient_name": "Abdul Karim",
  "urgency": "critical",
  "status": "open",
  "latitude": 23.7232,
  "longitude": 90.4005,
  "notes": "Post-surgery, needs blood within 2 hours",
  "created_at": "2025-07-10T14:22:00Z",
  "resolved_at": null
}
```

> **Side effect:** Celery task automatically notifies all compatible available donors within 20km via WebSocket + DB notification.

---

### 5.4 My Blood Requests

```http
GET /api/v1/blood/requests/
```

**Auth required:** Yes

---

## 6. Ambulance & Emergency

**Base path:** `/api/v1/ambulance/`

---

### 6.1 Nearby Ambulances

```http
GET /api/v1/ambulance/vehicles/nearby/
```

**Auth required:** No

**Query params:** `lat`, `lng`, `radius` (default 15km)

**Response `200 OK`:**

```json
{
  "count": 2,
  "results": [
    {
      "id": "amb-uuid",
      "registration_number": "DH-3456",
      "ambulance_type": "advanced",
      "driver_name": "Karim Ahmed",
      "driver_phone": "+8801712345678",
      "current_latitude": 23.8050,
      "current_longitude": 90.4080,
      "status": "available",
      "distance_km": 1.8
    }
  ]
}
```

---

### 6.2 Request Emergency Ambulance

```http
POST /api/v1/ambulance/emergency/
```

**Auth required:** Yes

**Request body:**

```json
{
  "request_type": "cardiac",
  "patient_condition": "Cardiac arrest, patient unconscious",
  "pickup_address": "Apt 3B, 45 Mirpur Road, Dhaka",
  "pickup_latitude": 23.8103,
  "pickup_longitude": 90.4125
}
```

**Response `201 Created`:**

```json
{
  "id": "emr-uuid",
  "request_type": "cardiac",
  "patient_condition": "Cardiac arrest, patient unconscious",
  "pickup_address": "Apt 3B, 45 Mirpur Road, Dhaka",
  "pickup_latitude": 23.8103,
  "pickup_longitude": 90.4125,
  "status": "dispatched",
  "estimated_arrival_minutes": 7,
  "ambulance": {
    "id": "amb-uuid",
    "registration_number": "DH-3456",
    "ambulance_type": "advanced",
    "driver_name": "Karim Ahmed",
    "driver_phone": "+8801712345678",
    "current_latitude": 23.8050,
    "current_longitude": 90.4080,
    "status": "en_route",
    "distance_km": 1.8
  },
  "citizen_name": "Rahim Uddin",
  "citizen_phone": "+8801712345678",
  "websocket_channel": "wss://scsp.app/ws/emergency/emr-uuid/",
  "created_at": "2025-07-10T14:30:00Z",
  "dispatched_at": "2025-07-10T14:30:05Z"
}
```

> **Side effect:** Nearest available ambulance is automatically assigned. Status updates pushed in real-time via WebSocket channel `wss://scsp.app/ws/emergency/{id}/`.

---

### 6.3 Track Emergency Request

```http
GET /api/v1/ambulance/emergency/{id}/
```

**Auth required:** Yes (owner or admin)

---

### 6.4 Update Emergency Status (Admin/Provider)

```http
PATCH /api/v1/ambulance/emergency/{id}/update_status/
```

**Auth required:** Yes (Admin or Provider)

**Request body:**

```json
{ "status": "arrived" }
```

Valid status transitions: `pending → dispatched → en_route → arrived → resolved`

---

### 6.5 Emergency Contacts

```http
GET    /api/v1/ambulance/contacts/         # List my emergency contacts
POST   /api/v1/ambulance/contacts/         # Add emergency contact
DELETE /api/v1/ambulance/contacts/{id}/    # Remove contact
```

**Auth required:** Yes

**POST Request body:**

```json
{
  "name": "Fatima Khanom",
  "phone": "+8801855667788",
  "relationship": "Wife"
}
```

---

## 7. Education

**Base path:** `/api/v1/education/`

---

### 7.1 List Institutions

```http
GET /api/v1/education/institutions/
```

**Auth required:** No

**Query params:** `institution_type` (`school`, `college`, `university`, `madrasa`, `technical`, `coaching`), `admission_open`, `is_verified`, `search`

**Response `200 OK`:**

```json
{
  "results": [
    {
      "id": "inst-uuid",
      "name": "University of Dhaka",
      "institution_type": "university",
      "address": "Nilkhet, Dhaka-1000",
      "latitude": 23.7272,
      "longitude": 90.3924,
      "phone": "+8802-9661920",
      "email": "registrar@du.ac.bd",
      "website": "https://du.ac.bd",
      "established_year": 1921,
      "description": "Oldest and largest university in Bangladesh",
      "image_url": "https://res.cloudinary.com/...",
      "admission_open": true,
      "admission_deadline": "2025-08-30",
      "admission_info_url": "https://admission.eis.du.ac.bd",
      "average_rating": 4.5,
      "is_verified": true,
      "distance_km": null
    }
  ]
}
```

---

### 7.2 Nearby Institutions

```http
GET /api/v1/education/institutions/nearby/
```

**Query params:** `lat`, `lng`, `radius` (default 20km)

---

## 8. NGO & Volunteers

**Base path:** `/api/v1/ngo/`

---

### 8.1 List NGOs

```http
GET /api/v1/ngo/ngos/
```

**Auth required:** No

**Response `200 OK`:**

```json
{
  "results": [
    {
      "id": "ngo-uuid",
      "name": "BRAC",
      "description": "World's largest NGO focused on poverty alleviation",
      "focus_areas": ["education", "health", "microfinance", "disaster_relief"],
      "address": "75 Mohakhali, Dhaka",
      "latitude": 23.7808,
      "longitude": 90.4093,
      "phone": "+8802-9881265",
      "email": "info@brac.net",
      "website": "https://brac.net",
      "logo_url": "https://res.cloudinary.com/...",
      "is_verified": true,
      "volunteer_count": 234
    }
  ]
}
```

---

### 8.2 Register as Volunteer

```http
POST /api/v1/ngo/volunteers/
```

**Auth required:** Yes

**Request body:**

```json
{
  "ngo": "ngo-uuid",
  "skills": ["medical", "teaching"],
  "availability": "Weekends, 9AM-5PM",
  "is_available": true,
  "bio": "Trained nurse with 5 years experience, passionate about community health"
}
```

---

### 8.3 NGO Events

```http
GET  /api/v1/ngo/events/           # List all events
POST /api/v1/ngo/events/           # Create event (NGO admin)
GET  /api/v1/ngo/events/{id}/      # Event detail
```

---

## 9. Government Services

**Base path:** `/api/v1/government/`

---

### 9.1 List Government Offices

```http
GET /api/v1/government/offices/
```

**Auth required:** No

**Query params:** `search`, `office_type` (`municipality`, `district`, `ministry`, `court`, `police`, `tax`, `immigration`, `land`, `other`)

---

### 9.2 List Government Services

```http
GET /api/v1/government/services/
```

**Auth required:** No

**Response `200 OK`:**

```json
{
  "results": [
    {
      "id": "gsvc-uuid",
      "office": "gov-uuid",
      "office_name": "Dhaka City Corporation",
      "office_address": "Nagar Bhaban, Dhaka",
      "name": "Birth Certificate",
      "description": "Official birth registration certificate",
      "required_documents": ["NID of parents", "Hospital discharge paper", "2 passport photos"],
      "processing_time": "7-14 working days",
      "fee": "BDT 50",
      "application_url": "https://bdris.gov.bd",
      "is_online": true
    }
  ]
}
```

---

## 10. Reviews & Ratings

**Base path:** `/api/v1/reviews/`

---

### 10.1 Get Reviews for a Service

```http
GET /api/v1/reviews/?service_id={uuid}
```

**Auth required:** No

**Response `200 OK`:**

```json
{
  "results": [
    {
      "id": "rev-uuid",
      "service_id": "svc-uuid",
      "service_type": "hospital",
      "rating": 5,
      "comment": "Excellent care, very professional staff. Highly recommend.",
      "is_approved": true,
      "reviewer_name": "Rahim Uddin",
      "reviewer_avatar": "https://res.cloudinary.com/...",
      "created_at": "2025-07-05T12:00:00Z"
    }
  ]
}
```

---

### 10.2 Submit Review

```http
POST /api/v1/reviews/
```

**Auth required:** Yes

**Request body:**

```json
{
  "service_id": "svc-uuid",
  "service_type": "hospital",
  "rating": 5,
  "comment": "Excellent care, very professional staff."
}
```

> **Side effect:** `average_rating` and `review_count` are automatically updated on the target entity.

**Errors:**

```json
{ "non_field_errors": ["You have already reviewed this service."] }
{ "rating": ["Rating must be between 1 and 5."] }
```

---

## 11. Notifications

**Base path:** `/api/v1/notifications/`

---

### 11.1 List Notifications

```http
GET /api/v1/notifications/
GET /api/v1/notifications/?unread=true
```

**Auth required:** Yes

**Response `200 OK`:**

```json
[
  {
    "id": "notif-uuid",
    "notification_type": "ambulance_dispatch",
    "title": "🚑 Ambulance Dispatched!",
    "body": "Ambulance DH-3456 is on the way. ETA: 7 minutes.",
    "data": { "emergency_id": "emr-uuid", "ambulance_id": "amb-uuid" },
    "is_read": false,
    "created_at": "2025-07-10T14:30:06Z"
  }
]
```

---

### 11.2 Mark All Read

```http
POST /api/v1/notifications/mark-all-read/
```

**Auth required:** Yes

---

### 11.3 Mark One Read

```http
POST /api/v1/notifications/{id}/read/
```

**Auth required:** Yes

---

## 12. AI Assistant

**Base path:** `/api/v1/ai/`  
**Rate limit:** 30 requests/hour per user

---

### 12.1 Chat

```http
POST /api/v1/ai/chat/
```

**Auth required:** No (authenticated users get conversation history)

**Request body:**

```json
{
  "message": "I need O+ blood urgently near Mirpur, Dhaka",
  "session_id": "optional-session-uuid",
  "latitude": 23.8103,
  "longitude": 90.4125
}
```

**Response `200 OK`:**

```json
{
  "session_id": "session-uuid",
  "intent": "blood_search",
  "human_response": "🩸 I found 3 O+ blood donors within 10km of your location. I've listed them below and they're being notified about your urgent request.",
  "entities": {
    "blood_group": "O+",
    "urgency": "emergency",
    "location": "Mirpur, Dhaka",
    "radius_km": 10
  },
  "confidence": 0.97,
  "suggested_actions": ["Create blood request", "Call nearest donor"],
  "data": {
    "donors": [
      {
        "id": "donor-uuid",
        "full_name": "Karim Ahmed",
        "phone": "+8801611223344",
        "blood_group": "O+",
        "distance_km": 1.4,
        "is_available": true
      }
    ]
  }
}
```

**Supported intents:**

| Intent | Trigger Example |
|--------|----------------|
| `blood_search` | "Find O+ blood donor near me" |
| `hospital_search` | "Show hospitals open now with cardiology" |
| `ambulance_request` | "I need an ambulance urgently" |
| `appointment_book` | "Book appointment with a cardiologist" |
| `education_search` | "Best engineering college near Sylhet" |
| `ngo_search` | "Find NGOs accepting volunteers in Dhaka" |
| `government_info` | "How do I get a birth certificate?" |
| `emergency` | "Emergency! Someone collapsed" |
| `general` | "What services do you offer?" |

---

### 12.2 Chat History

```http
GET /api/v1/ai/chat/history/
GET /api/v1/ai/chat/history/?session_id={session_uuid}
```

**Auth required:** Yes

---

### 12.3 Recommendations

```http
GET /api/v1/ai/recommend/?lat=23.8103&lng=90.4125
```

**Auth required:** Yes

**Response `200 OK`:**

```json
{
  "results": [
    {
      "id": "svc-uuid",
      "title": "City General Hospital",
      "average_rating": 4.8,
      "distance_km": 0.9,
      ...
    }
  ]
}
```

---

## 13. Analytics

**Base path:** `/api/v1/analytics/`  
**Auth required:** Admin or Moderator role for all endpoints

---

### 13.1 Dashboard Summary

```http
GET /api/v1/analytics/dashboard/
```

**Response `200 OK`:**

```json
{
  "users": {
    "total": 4821,
    "new_today": 23,
    "new_this_week": 187
  },
  "appointments": {
    "total": 12450,
    "today": 84,
    "pending": 231
  },
  "blood_requests": {
    "total": 892,
    "open": 14,
    "critical": 3
  },
  "emergencies": {
    "total": 456,
    "active": 2,
    "resolved_today": 8
  }
}
```

---

### 13.2 Daily User Registrations

```http
GET /api/v1/analytics/daily-users/?days=14
```

**Response `200 OK`:**

```json
{
  "results": [
    { "date": "2025-07-01", "new_users": 34 },
    { "date": "2025-07-02", "new_users": 41 }
  ]
}
```

---

### 13.3 Appointment Trends

```http
GET /api/v1/analytics/appointment-trends/?days=14
```

---

### 13.4 Blood Stats

```http
GET /api/v1/analytics/blood-stats/
```

**Response `200 OK`:**

```json
{
  "donors_by_blood_group": [
    { "blood_group": "A+", "count": 312 },
    { "blood_group": "O+", "count": 489 }
  ],
  "requests_by_blood_group": [
    { "blood_group": "O+", "count": 156 }
  ],
  "total_donors": 2341,
  "available_donors": 1876
}
```

---

### 13.5 Emergency Stats

```http
GET /api/v1/analytics/emergency-stats/
```

---

## 14. WebSocket Events

Connect: `wss://scsp.app/ws/{path}/?token={access_token}`

---

### 14.1 Personal Notifications

**Endpoint:** `wss://scsp.app/ws/notifications/?token=<access_token>`

**On connect, server sends:**

```json
{ "type": "unread_count", "count": 5 }
```

**On new notification:**

```json
{
  "type": "notification",
  "id": "notif-uuid",
  "title": "🩸 Emergency Blood Request — O+",
  "body": "Abdul Karim needs 2 units of O+ blood at DMCH. Urgency: CRITICAL",
  "notification_type": "blood_request",
  "data": { "request_id": "req-uuid" }
}
```

**Client can send:**

```json
{ "action": "mark_read", "notification_id": "notif-uuid" }
```

---

### 14.2 Emergency Tracking

**Endpoint:** `wss://scsp.app/ws/emergency/{emergency_id}/?token=<access_token>`

**Status update event:**

```json
{
  "type": "status_update",
  "status": "arrived",
  "message": "✅ Ambulance has arrived at your location."
}
```

**Location update event:**

```json
{
  "type": "location_update",
  "latitude": 23.8095,
  "longitude": 90.4120,
  "status": "en_route"
}
```

---

### 14.3 Ambulance Location Tracking

**Endpoint:** `wss://scsp.app/ws/ambulance/{ambulance_id}/?token=<access_token>`

**Location update:**

```json
{
  "type": "location_update",
  "latitude": 23.8095,
  "longitude": 90.4120,
  "status": "en_route"
}
```

---

## 15. Error Reference

### Validation Error (400)

```json
{
  "email": ["Enter a valid email address."],
  "password": ["This field is required."]
}
```

### Authentication Error (401)

```json
{
  "detail": "Authentication credentials were not provided.",
  "code": "not_authenticated"
}
```

### Permission Error (403)

```json
{
  "detail": "You do not have permission to perform this action.",
  "code": "permission_denied"
}
```

### Not Found (404)

```json
{
  "detail": "Not found.",
  "code": "not_found"
}
```

### Rate Limit (429)

```json
{
  "detail": "Request was throttled. Expected available in 45 seconds.",
  "code": "throttled"
}
```

---

*Last updated: July 2025 · SCSP API v1.0.0*
