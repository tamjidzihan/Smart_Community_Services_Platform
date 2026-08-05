# 🚀 SCSP Deployment Guide

**Smart Community Services Platform — Production Deployment on Ubuntu VPS**

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [VPS Initial Setup](#2-vps-initial-setup)
3. [Install Docker & Docker Compose](#3-install-docker--docker-compose)
4. [Clone & Configure Project](#4-clone--configure-project)
5. [SSL Certificate Setup](#5-ssl-certificate-setup)
6. [First Deployment](#6-first-deployment)
7. [Verify Deployment](#7-verify-deployment)
8. [GitHub Actions CI/CD Setup](#8-github-actions-cicd-setup)
9. [Monitoring & Maintenance](#9-monitoring--maintenance)
10. [Backup & Restore](#10-backup--restore)
11. [Scaling](#11-scaling)
12. [Troubleshooting](#12-troubleshooting)
13. [Local Development Setup](#13-local-development-setup)

---

## 1. Prerequisites

### Server Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Disk | 40 GB SSD | 80 GB SSD |
| Bandwidth | 1 TB/month | Unmetered |

### Domain & Services Required

- [ ] A registered domain (e.g., `scsp.app`)
- [ ] DNS A record pointing to your VPS IP
- [ ] OpenAI API key (for AI features)
- [ ] Cloudinary account (free tier sufficient for development)
- [ ] Google OAuth credentials (Google Cloud Console)
- [ ] SMTP email credentials (Gmail App Password or SendGrid)

---

## 2. VPS Initial Setup

### 2.1 Connect to your VPS

```bash
ssh root@your-vps-ip
```

### 2.2 Create a non-root user

```bash
adduser scsp
usermod -aG sudo scsp
# Copy SSH keys
rsync --archive --chown=scsp:scsp ~/.ssh /home/scsp
# Switch to new user
su - scsp
```

### 2.3 Update system packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget ufw fail2ban
```

### 2.4 Configure firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### 2.5 Harden SSH

```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

### 2.6 Configure fail2ban (brute force protection)

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo fail2ban-client status
```

---

## 3. Install Docker & Docker Compose

```bash
# Remove old versions
sudo apt remove docker docker-engine docker.io containerd runc 2>/dev/null

# Install dependencies
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repo
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group (no sudo needed)
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

---

## 4. Clone & Configure Project

### 4.1 Clone the repository

```bash
sudo mkdir -p /opt/scsp
sudo chown $USER:$USER /opt/scsp
cd /opt/scsp
git clone https://github.com/yourusername/scsp.git .
```

### 4.2 Create environment file

```bash
cp .env.example .env
nano .env
```

Fill in all required values:

```bash
# ── Domain ──────────────────────────────────────────────────────
DOMAIN=scsp.app

# ── Django ──────────────────────────────────────────────────────
# Generate: python3 -c "import secrets; print(secrets.token_urlsafe(50))"
SECRET_KEY=your-generated-secret-key-here
DEBUG=False
ALLOWED_HOSTS=scsp.app,www.scsp.app

# ── Database ─────────────────────────────────────────────────────
DB_NAME=scsp_db
DB_USER=scsp_user
DB_PASSWORD=your-strong-db-password-here
DB_HOST=db
DB_PORT=5432

# ── Redis ────────────────────────────────────────────────────────
REDIS_URL=redis://:your-redis-password@redis:6379/0
REDIS_PASSWORD=your-strong-redis-password-here

# ── OpenAI ───────────────────────────────────────────────────────
OPENAI_API_KEY=sk-proj-...

# ── Cloudinary ───────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_cloudinary_secret

# ── Google OAuth ─────────────────────────────────────────────────
GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# ── Email (Gmail App Password) ───────────────────────────────────
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=yourapp@gmail.com
EMAIL_HOST_PASSWORD=xxxx-xxxx-xxxx-xxxx
DEFAULT_FROM_EMAIL=noreply@scsp.app
FRONTEND_URL=https://scsp.app

# ── CORS ─────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS=https://scsp.app,https://www.scsp.app
```

```bash
# Protect the env file
chmod 600 .env
```

### 4.3 Update Nginx config with your domain

```bash
# Update domain in nginx.conf
sed -i 's/scsp.app/yourdomain.com/g' nginx/nginx.conf
```

---

## 5. SSL Certificate Setup

### 5.1 Temporarily use HTTP-only Nginx for certificate challenge

Create a temporary Nginx config that doesn't require SSL:

```bash
cat > nginx/nginx-certbot.conf << 'EOF'
server {
    listen 80;
    server_name scsp.app www.scsp.app;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'SCSP Setup in Progress';
        add_header Content-Type text/plain;
    }
}
EOF
```

### 5.2 Start only Nginx and Certbot temporarily

```bash
# Start with temp config
docker run -d --name nginx-temp \
  -p 80:80 \
  -v $(pwd)/nginx/nginx-certbot.conf:/etc/nginx/conf.d/default.conf \
  -v certbot_www:/var/www/certbot \
  nginx:1.25-alpine

# Request SSL certificate
docker run --rm \
  -v certbot_conf:/etc/letsencrypt \
  -v certbot_www:/var/www/certbot \
  certbot/certbot certonly \
  --webroot -w /var/www/certbot \
  --email admin@scsp.app \
  --agree-tos --no-eff-email \
  -d scsp.app -d www.scsp.app

# Stop temp nginx
docker stop nginx-temp && docker rm nginx-temp
```

### 5.3 Verify certificate created

```bash
docker run --rm \
  -v certbot_conf:/etc/letsencrypt \
  certbot/certbot certificates
```

---

## 6. First Deployment

### 6.1 Build all images

```bash
cd /opt/scsp
docker compose build --no-cache
```

This will take 5-10 minutes on first build.

### 6.2 Start all services

```bash
docker compose up -d
```

### 6.3 Verify all containers are healthy

```bash
docker compose ps
```

Expected output:
```
NAME                STATUS              PORTS
scsp-nginx-1        Up (healthy)        0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
scsp-frontend-1     Up                  80/tcp
scsp-backend-1      Up (healthy)        8000/tcp
scsp-celery_worker-1 Up                 -
scsp-celery_beat-1  Up                  -
scsp-db-1           Up (healthy)        5432/tcp
scsp-redis-1        Up (healthy)        6379/tcp
```

### 6.4 Run database migrations

```bash
docker compose exec backend python manage.py migrate
```

### 6.5 Create initial data

```bash
# Create superuser
docker compose exec backend python manage.py createsuperuser

# Create default roles (run this management command)
docker compose exec backend python manage.py shell -c "
from apps.accounts.models import Role
roles = ['visitor', 'citizen', 'provider', 'volunteer', 'moderator', 'admin']
for name in roles:
    role, created = Role.objects.get_or_create(name=name)
    print(f'Role {name}: {\"created\" if created else \"exists\"}')"

# Collect static files
docker compose exec backend python manage.py collectstatic --noinput
```

### 6.6 Load sample data (optional)

```bash
docker compose exec backend python manage.py loaddata fixtures/sample_data.json
```

---

## 7. Verify Deployment

### 7.1 Check all endpoints

```bash
# API health
curl -I https://scsp.app/api/schema/

# Frontend
curl -I https://scsp.app/

# Admin
curl -I https://scsp.app/admin/
```

### 7.2 Test API

```bash
# Register a test user
curl -X POST https://scsp.app/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "confirm_password": "TestPass123!",
    "full_name": "Test User"
  }'

# Login
curl -X POST https://scsp.app/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "TestPass123!"}'
```

### 7.3 Check SSL certificate

```bash
curl -vI https://scsp.app 2>&1 | grep -E "(SSL|TLS|certificate|expire)"
```

### 7.4 Check WebSocket

```bash
# Install wscat: npm install -g wscat
wscat -c "wss://scsp.app/ws/notifications/?token=YOUR_ACCESS_TOKEN"
```

---

## 8. GitHub Actions CI/CD Setup

### 8.1 Add repository secrets

In GitHub → Repository → Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `VPS_HOST` | Your VPS IP address |
| `VPS_USER` | `scsp` (or your deploy user) |
| `VPS_SSH_KEY` | Contents of `~/.ssh/id_rsa` (private key) |

### 8.2 Generate SSH key for deploy (on VPS)

```bash
# On VPS
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
# Copy private key to GitHub secret:
cat ~/.ssh/github_deploy
```

### 8.3 Configure deployment path in CI/CD

In `.github/workflows/ci-cd.yml`, the deploy step runs:

```bash
cd /opt/scsp
git pull origin main
docker compose pull
docker compose up -d --remove-orphans
docker compose exec -T backend python manage.py migrate --noinput
```

Make sure `/opt/scsp` is owned by your deploy user and has the `.env` file in place.

### 8.4 Test the pipeline

```bash
# Push to main branch to trigger deploy
git add .
git commit -m "chore: test CI/CD pipeline"
git push origin main

# Watch the pipeline at:
# https://github.com/yourusername/scsp/actions
```

---

## 9. Monitoring & Maintenance

### 9.1 View logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f celery_worker
docker compose logs -f nginx

# Last 100 lines
docker compose logs --tail=100 backend
```

### 9.2 Monitor resource usage

```bash
# Container stats
docker stats

# Disk usage
df -h
docker system df
```

### 9.3 Django management commands

```bash
# Open Django shell
docker compose exec backend python manage.py shell

# Check celery workers
docker compose exec celery_worker celery -A config inspect active

# Check celery beat schedule
docker compose exec backend python manage.py shell -c "
from django_celery_beat.models import PeriodicTask
print(list(PeriodicTask.objects.values('name', 'enabled')))"
```

### 9.4 SSL auto-renewal

Certbot runs inside Docker and renews certificates automatically every 12 hours. The Certbot container in `docker-compose.yml`:

```yaml
certbot:
  entrypoint: >
    sh -c "trap exit TERM; while :; do
      certbot renew --webroot -w /var/www/certbot --quiet;
      sleep 12h & wait; done"
```

Manual renewal:

```bash
docker compose run --rm certbot renew
docker compose exec nginx nginx -s reload
```

### 9.5 Apply system updates

```bash
# Update packages monthly
sudo apt update && sudo apt upgrade -y

# Update Docker images quarterly
docker compose pull
docker compose up -d
```

---

## 10. Backup & Restore

### 10.1 Automated database backup

```bash
# Create backup script
cat > /opt/scsp/scripts/backup.sh << 'EOF'
#!/bin/bash
set -e
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/scsp/backups
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker compose -f /opt/scsp/docker-compose.yml exec -T db \
  pg_dump -U scsp_user scsp_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_$DATE.sql.gz"
EOF

chmod +x /opt/scsp/scripts/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/scsp/scripts/backup.sh >> /var/log/scsp_backup.log 2>&1
```

### 10.2 Restore from backup

```bash
# Stop backend to prevent writes
docker compose stop backend celery_worker

# Restore
gunzip -c /opt/scsp/backups/db_20250710_020000.sql.gz | \
  docker compose exec -T db psql -U scsp_user -d scsp_db

# Restart
docker compose start backend celery_worker
```

### 10.3 Backup media files

```bash
# Since media files are on Cloudinary, only backup the DB
# For local media (development):
tar -czf /opt/scsp/backups/media_$(date +%Y%m%d).tar.gz \
  -C /var/lib/docker/volumes/scsp_media_files/_data .
```

---

## 11. Scaling

### 11.1 Scale Celery workers

```bash
# Scale to 3 celery worker containers
docker compose up -d --scale celery_worker=3
```

### 11.2 Scale backend (multiple Daphne instances)

```bash
# Nginx already load-balances across backend instances
docker compose up -d --scale backend=3
```

Update Nginx upstream to use multiple backends:

```nginx
upstream backend {
    least_conn;
    server backend_1:8000;
    server backend_2:8000;
    server backend_3:8000;
    keepalive 32;
}
```

### 11.3 PostgreSQL connection pooling

For high traffic, add PgBouncer:

```yaml
# Add to docker-compose.yml
pgbouncer:
  image: pgbouncer/pgbouncer
  environment:
    DATABASES_HOST: db
    DATABASES_PORT: 5432
    DATABASES_USER: scsp_user
    DATABASES_PASSWORD: ${DB_PASSWORD}
    DATABASES_DBNAME: scsp_db
    POOL_MODE: transaction
    MAX_CLIENT_CONN: 200
    DEFAULT_POOL_SIZE: 25
  networks:
    - scsp_network
```

---

## 12. Troubleshooting

### Container won't start

```bash
# Check detailed logs
docker compose logs backend --tail=50

# Check container exit code
docker compose ps -a

# Inspect container
docker inspect scsp-backend-1
```

### Database connection error

```bash
# Verify DB is healthy
docker compose exec db pg_isready -U scsp_user -d scsp_db

# Test connection from backend
docker compose exec backend python manage.py dbshell
```

### Static files 404

```bash
# Recollect static files
docker compose exec backend python manage.py collectstatic --noinput --clear

# Check volume mount
docker compose exec nginx ls /app/staticfiles/
```

### WebSocket 502/503

```bash
# Check Daphne is running (not gunicorn)
docker compose exec backend ps aux | grep daphne

# Verify ASGI config
docker compose exec backend python -c "import config.asgi; print('ASGI OK')"

# Check channels Redis connection
docker compose exec backend python manage.py shell -c "
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
cl = get_channel_layer()
async_to_sync(cl.flush)()"
```

### Celery tasks not executing

```bash
# Check worker is connected
docker compose exec celery_worker celery -A config inspect ping

# Check queued tasks
docker compose exec celery_worker celery -A config inspect reserved

# Check task failures
docker compose exec backend python manage.py shell -c "
from django_celery_results.models import TaskResult
for t in TaskResult.objects.filter(status='FAILURE')[:5]:
    print(t.task_name, t.result)"
```

### AI chat not working

```bash
# Test OpenAI API key
docker compose exec backend python manage.py shell -c "
from openai import OpenAI
import django.conf
client = OpenAI(api_key=django.conf.settings.OPENAI_API_KEY)
r = client.chat.completions.create(model='gpt-4o', max_tokens=10, messages=[{'role':'user','content':'test'}])
print('OpenAI OK:', r.choices[0].message.content)"
```

### SSL certificate issues

```bash
# Check certificate status
docker compose run --rm certbot certificates

# Force renewal
docker compose run --rm certbot renew --force-renewal

# Reload nginx after renewal
docker compose exec nginx nginx -s reload
```

---

## 13. Local Development Setup

### 13.1 Without Docker

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements/base.txt
pip install debug-toolbar

# Set environment
cp .env.example .env
# Edit .env: set DB_HOST=localhost, REDIS_URL=redis://localhost:6379/0

# Start local PostgreSQL and Redis
# (via Homebrew, apt, or run just db+redis with Docker)
docker compose up -d db redis

# Migrate and run
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Celery (separate terminal)
celery -A config worker -l info

# Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### 13.2 With Docker (development mode)

```bash
# Use development override
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Create `docker-compose.dev.yml`:

```yaml
version: '3.9'
services:
  backend:
    environment:
      DJANGO_SETTINGS_MODULE: config.settings.development
    volumes:
      - ./backend:/app   # Hot reload
    command: python manage.py runserver 0.0.0.0:8000

  frontend:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - ./frontend:/app
    command: sh -c "npm install && npm run dev -- --host 0.0.0.0"
    ports:
      - "5173:5173"
```

### 13.3 Environment setup checklist

- [ ] PostgreSQL running and accessible
- [ ] Redis running
- [ ] `.env` file configured with all required variables
- [ ] Database migrations applied (`python manage.py migrate`)
- [ ] Default roles created (via shell command above)
- [ ] Superuser created
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Cloudinary configured (or use default file storage for local dev)

---

## Quick Reference

### Most-used commands

```bash
# Start everything
docker compose up -d

# Stop everything
docker compose down

# Restart one service
docker compose restart backend

# View logs
docker compose logs -f backend

# Django shell
docker compose exec backend python manage.py shell

# Run migrations
docker compose exec backend python manage.py migrate

# Create superuser
docker compose exec backend python manage.py createsuperuser

# Database backup
./scripts/backup.sh

# Check health
docker compose ps
curl https://scsp.app/api/schema/
```

---

*Last updated: July 2025 · SCSP Deployment Guide v1.0.0*
