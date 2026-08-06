from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db import models


def send_notification(user, title, body, notification_type='general', data=None):
    """Create a DB notification and push via WebSocket."""
    from .models import Notification
    notif = Notification.objects.create(
        user=user,
        title=title,
        body=body,
        notification_type=notification_type,
        data=data or {},
    )
    # Push to WebSocket
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'notifications_{user.id}',
            {
                'type': 'notification_message',
                'id': str(notif.id),
                'title': title,
                'body': body,
                'notification_type': notification_type,
                'data': data or {},
            }
        )
    except Exception:
        pass  # WebSocket push is best-effort
    return notif


def notify_admins(title, body, notification_type='system', data=None):
    """Send a notification to all admin and moderator users."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    admins = User.objects.filter(
        models.Q(is_superuser=True) | models.Q(is_staff=True) | models.Q(roles__name__in=['admin', 'moderator'])
    ).distinct()

    for admin in admins:
        send_notification(
            user=admin,
            title=title,
            body=body,
            notification_type=notification_type,
            data=data or {},
        )

