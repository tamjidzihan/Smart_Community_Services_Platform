import dj_database_url
from .base import *

# Security Settings
DEBUG = False
SECRET_KEY = env('SECRET_KEY')

# ✅ UPDATE: Add your actual Render backend URL
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=[
    'smart-community-services-platform.onrender.com',  # Your Render backend
    'scspbd.netlify.app',  # Your Netlify frontend
    'localhost',
    '127.0.0.1',
])

# Database - Using Neon PostgreSQL
DATABASES = {
    'default': dj_database_url.config(
        default=f"postgresql://{env('DB_USER')}:{env('DB_PASSWORD')}@{env('DB_HOST')}:{env('DB_PORT')}/{env('DB_NAME')}",
        conn_max_age=600,
        ssl_require=True,
        test_options={'charset': 'utf8'}
    )
}

# ... (keep all your Redis, Celery, Cloudinary configs the same) ...

# ✅ UPDATE: CORS Settings - Add your Netlify frontend
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[
    'https://scspbd.netlify.app',  # Your frontend
    'https://smart-community-services-platform.onrender.com',  # Your backend
    'http://localhost:5173',
    'http://127.0.0.1:5173',
])

# ✅ ADD: CSRF Trusted Origins
CSRF_TRUSTED_ORIGINS = [
    'https://scspbd.netlify.app',
    'https://smart-community-services-platform.onrender.com',
]

CORS_ALLOW_CREDENTIALS = True
CORS_EXPOSE_HEADERS = ['Content-Type', 'X-CSRFToken']
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# ✅ UPDATE: Frontend URL
FRONTEND_URL = env('FRONTEND_URL', default='https://scspbd.netlify.app')

# API Keys
GEMINI_API_KEY = env('GEMINI_API_KEY')

# Google OAuth
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = env('GOOGLE_CLIENT_ID')
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = env('GOOGLE_CLIENT_SECRET')

# Logging Configuration
LOG_DIR = BASE_DIR / 'logs'
LOG_DIR.mkdir(exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': LOG_DIR / 'error.log',
            'formatter': 'verbose',
        },
        'access_file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': LOG_DIR / 'access.log',
            'formatter': 'verbose',
        },
        'mail_admins': {
            'level': 'ERROR',
            'class': 'django.utils.log.AdminEmailHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'django.request': {
            'handlers': ['file', 'mail_admins'],
            'level': 'ERROR',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['file', 'mail_admins'],
            'level': 'ERROR',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'WARNING',
    },
}