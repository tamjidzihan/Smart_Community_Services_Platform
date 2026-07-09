from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()


@shared_task(bind=True, max_retries=3)
def send_verification_email(self, user_id, token):
    try:
        user = User.objects.get(id=user_id)
        link = f"{settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:5173'}/verify-email?token={token}"
        send_mail(
            subject='Verify your SCSP email',
            message=f'Hi {user.profile.full_name},\n\nClick to verify your email:\n{link}\n\nThis link expires in 24 hours.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_password_reset_email(self, user_id, token):
    try:
        user = User.objects.get(id=user_id)
        link = f"{settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:5173'}/reset-password?token={token}"
        send_mail(
            subject='Reset your SCSP password',
            message=f'Hi {user.profile.full_name},\n\nClick to reset your password:\n{link}\n\nThis link expires in 1 hour.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
