from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


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
