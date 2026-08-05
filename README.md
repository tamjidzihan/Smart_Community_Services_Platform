# 🏙️ Smart Community Services Platform (SCSP)

> A production-grade, AI-powered platform connecting citizens with hospitals, ambulances, blood donors, schools, NGOs, and government services — all in one application.

[![CI/CD](https://github.com/yourusername/scsp/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/yourusername/scsp/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)
[![Django](https://img.shields.io/badge/Django-5.0-092E20)](https://djangoproject.com)

---

## ✨ Features

| Module | Features |
|--------|----------|
| 🔐 **Auth** | JWT + Refresh tokens, Google OAuth, Email verification, RBAC |
| 🏥 **Healthcare** | Hospital search, doctor booking, appointment management |
| 🩸 **Blood Donation** | Donor registry, compatible-type matching, emergency broadcast |
| 🚑 **Ambulance** | One-tap dispatch, real-time GPS tracking via WebSocket |
| 🎓 **Education** | Institution directory, admission info, location search |
| 🤝 **NGO/Volunteer** | NGO registry, volunteer management, event coordination |
| 🏛️ **Government** | Office directory, service catalog, application links |
| 🤖 **AI Assistant** | GPT-4o chatbot, NLP intent parsing, smart recommendations |
| 📊 **Analytics** | Admin dashboard with Recharts visualizations |
| 🔔 **Real-time** | WebSocket notifications, live ambulance tracking |
| 🗺️ **Maps** | Leaflet + OpenStreetMap, proximity search, route display |

---

## 🛠️ Tech Stack

**Frontend:** React 19, TypeScript, Vite, Material UI, Tailwind CSS, Framer Motion, TanStack Query, React Hook Form + Zod, Recharts, Leaflet

**Backend:** Python 3.12, Django 5, Django REST Framework, Django Channels (WebSockets), Celery, Redis

**Database:** PostgreSQL 16

**AI:** OpenAI GPT-4o

**Storage:** Cloudinary CDN

**Deployment:** Docker, Docker Compose, Nginx, Ubuntu VPS, Let's Encrypt SSL

**CI/CD:** GitHub Actions → GHCR → SSH deploy

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose v2+
- Git

### 1. Clone & configure
```bash
git clone https://github.com/yourusername/scsp.git
cd scsp
cp .env.example .env
# Edit .env with your credentials
```

### 2. Start services
```bash
make build
make up
make migrate
make createsuperuser
```

### 3. Access
| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| API | http://localhost/api/v1/ |
| API Docs | http://localhost/api/docs/ |
| Django Admin | http://localhost/admin/ |

---

## 📁 Project Structure

```
scsp/
├── backend/                  # Django project
│   ├── config/               # Settings, URLs, ASGI, Celery
│   ├── apps/
│   │   ├── accounts/         # Auth, users, roles
│   │   ├── services/         # Service listings, providers
│   │   ├── healthcare/       # Hospitals, doctors, appointments
│   │   ├── blood/            # Donors, requests, matching
│   │   ├── ambulance/        # Dispatch, tracking, WebSockets
│   │   ├── education/        # Institutions, admissions
│   │   ├── ngo/              # NGOs, volunteers, events
│   │   ├── government/       # Offices, services
│   │   ├── reviews/          # Ratings & reviews
│   │   ├── notifications/    # WS notifications, push
│   │   ├── ai_assistant/     # GPT-4o chatbot, NLP
│   │   └── analytics/        # Dashboards, audit logs
│   └── utils/                # Permissions, pagination, geo
│
├── frontend/                 # React 19 SPA
│   └── src/
│       ├── api/              # Axios instance + service modules
│       ├── components/       # Layout, common, maps
│       ├── features/         # Feature-specific components
│       ├── hooks/            # useGeolocation, useWebSocket, etc.
│       ├── pages/            # Route page components
│       ├── router/           # React Router config + guards
│       ├── store/            # Zustand state stores
│       └── types/            # TypeScript interfaces
│
├── nginx/                    # Nginx production config
├── .github/workflows/        # GitHub Actions CI/CD
├── docker-compose.yml        # Full stack orchestration
├── Makefile                  # Developer commands
└── .env.example              # Environment template
```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key (generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`) |
| `DB_PASSWORD` | PostgreSQL password |
| `REDIS_PASSWORD` | Redis password |
| `OPENAI_API_KEY` | OpenAI API key for AI features |
| `CLOUDINARY_*` | Cloudinary credentials for file storage |
| `GOOGLE_CLIENT_*` | Google OAuth credentials |
| `EMAIL_*` | SMTP settings for emails |

---

## 📡 API Reference

Full OpenAPI docs at `/api/docs/`

Key endpoints:

```
POST   /api/v1/auth/register/           Register new user
POST   /api/v1/auth/login/              Login (returns JWT)
POST   /api/v1/auth/token/refresh/      Refresh access token

GET    /api/v1/healthcare/hospitals/nearby/?lat=&lng=  Nearby hospitals
POST   /api/v1/ambulance/emergency/     Request ambulance (auto-dispatch)
GET    /api/v1/blood/donors/search/?group=O%2B&lat=&lng=  Blood donors
POST   /api/v1/ai/chat/                 AI Community Assistant

WS     /ws/notifications/              Live notifications
WS     /ws/emergency/{id}/             Live ambulance tracking
```

---

## 🧪 Testing

```bash
make test           # Backend tests with coverage
make test-frontend  # Frontend tests
make lint           # All linters
```

Backend coverage target: **>80%**

---

## 🚢 Production Deployment

```bash
# 1. Set up VPS (Ubuntu 22.04)
# 2. Install Docker & Docker Compose
# 3. Clone repo and configure .env
# 4. Initialize SSL
make ssl-init

# 5. Deploy
make build && make up && make migrate

# Subsequent deploys via GitHub Actions (auto on push to main)
```

---

## 👤 User Roles

| Role | Access |
|------|--------|
| **Visitor** | Browse public services (no login) |
| **Citizen** | Book appointments, request ambulance, find donors |
| **Provider** | Manage service listings, accept bookings |
| **Volunteer** | Join NGO events, community support |
| **Moderator** | Review moderation, complaint handling |
| **Admin** | Full platform management, analytics |

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

## 🎓 Academic Context

This project was built as a Final Year Project (FYP) for a Software Engineering degree, demonstrating:
- Full-stack web development with modern frameworks
- RESTful API design with Django REST Framework
- Real-time features with Django Channels & WebSockets
- AI integration with OpenAI GPT-4o
- Production deployment with Docker & Nginx
- Security best practices (JWT, RBAC, rate limiting)
- CI/CD with GitHub Actions
