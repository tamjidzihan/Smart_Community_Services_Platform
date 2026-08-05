from .base import *

DEBUG = True
ALLOWED_HOSTS = ['*']

INTERNAL_IPS = ['127.0.0.1']

# Inherit EMAIL_BACKEND from base.py / .env
CELERY_TASK_ALWAYS_EAGER = True
