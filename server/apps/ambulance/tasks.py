from celery import shared_task
from django.utils import timezone


@shared_task(bind=True, max_retries=5, default_retry_delay=60)
def dispatch_ambulance(self, emergency_id):
    try:
        from .models import EmergencyRequest, Ambulance
        from apps.notifications.utils import send_notification
        from utils.geo import calculate_distance_km

        emergency = EmergencyRequest.objects.select_related('citizen__profile').get(id=emergency_id)
        lat = emergency.pickup_latitude
        lon = emergency.pickup_longitude

        available = Ambulance.objects.filter(is_active=True, status='available')
        nearest = None
        min_dist = float('inf')

        for amb in available:
            if amb.current_latitude and amb.current_longitude:
                dist = calculate_distance_km(lat, lon, amb.current_latitude, amb.current_longitude)
                if dist < min_dist:
                    min_dist = dist
                    nearest = amb

        if nearest:
            nearest.status = 'en_route'
            nearest.save(update_fields=['status'])

            emergency.assigned_ambulance = nearest
            emergency.status = 'dispatched'
            emergency.dispatched_at = timezone.now()
            emergency.estimated_arrival_minutes = max(1, int(min_dist / 0.5))  # ~30km/h avg
            emergency.save()

            # Send notification to citizen
            send_notification(
                user=emergency.citizen,
                title='🚑 Ambulance Dispatched!',
                body=f'Ambulance {nearest.registration_number} is on the way. ETA: {emergency.estimated_arrival_minutes} minutes.',
                notification_type='ambulance_dispatch',
                data={'emergency_id': str(emergency.id), 'ambulance_id': str(nearest.id)},
            )

            # Send notification & dispatch details to ALL ADMINS
            try:
                from apps.notifications.utils import notify_admins
                user_name = getattr(emergency.citizen, 'profile', None) and emergency.citizen.profile.full_name or emergency.citizen.email
                notify_admins(
                    title=f"✅ Ambulance Dispatched: {nearest.registration_number}",
                    body=f"Ambulance {nearest.registration_number} (Driver: {nearest.driver_name}, {nearest.driver_phone}) dispatched for {user_name}. ETA: ~{emergency.estimated_arrival_minutes} mins. Location: {emergency.pickup_address or 'GPS position'}",
                    notification_type="ambulance_dispatch",
                    data={
                        "link": "/admin/requests?tab=emergency",
                        "emergency_id": str(emergency.id),
                        "ambulance_id": str(nearest.id),
                        "registration_number": nearest.registration_number,
                        "driver_name": nearest.driver_name,
                        "driver_phone": nearest.driver_phone,
                        "eta_minutes": emergency.estimated_arrival_minutes,
                    }
                )
            except Exception:
                pass
        else:
            emergency.status = 'no_resource'
            emergency.save(update_fields=['status'])
            send_notification(
                user=emergency.citizen,
                title='⚠️ No Ambulance Available',
                body='All ambulances are currently busy. We are monitoring and will dispatch as soon as one is available.',
                notification_type='emergency_no_resource',
                data={'emergency_id': str(emergency.id)},
            )
            # Notify admins of shortage
            try:
                from apps.notifications.utils import notify_admins
                user_name = getattr(emergency.citizen, 'profile', None) and emergency.citizen.profile.full_name or emergency.citizen.email
                notify_admins(
                    title="⚠️ CRITICAL: No Ambulance Resource Available!",
                    body=f"Emergency request from {user_name} ({emergency.patient_condition}) has NO available ambulance nearby!",
                    notification_type="emergency_no_resource",
                    data={
                        "link": "/admin/requests?tab=emergency",
                        "emergency_id": str(emergency.id),
                    }
                )
            except Exception:
                pass

            # Retry after 60 seconds
            raise self.retry(countdown=60)

        return f'Dispatched ambulance {nearest.registration_number} for emergency {emergency_id}'
    except EmergencyRequest.DoesNotExist:
        return f'Emergency {emergency_id} not found'


@shared_task
def notify_emergency_status_change(emergency_id, old_status, new_status):
    try:
        from .models import EmergencyRequest
        from apps.notifications.utils import send_notification
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        emergency = EmergencyRequest.objects.select_related('citizen').get(id=emergency_id)

        status_messages = {
            'en_route': '🚑 Ambulance is now en route to your location.',
            'arrived': '✅ Ambulance has arrived at your location.',
            'resolved': '✅ Emergency request has been resolved.',
            'cancelled': 'Emergency request has been cancelled.',
        }

        msg = status_messages.get(new_status, f'Your emergency status changed to: {new_status}')
        send_notification(
            user=emergency.citizen,
            title='Emergency Update',
            body=msg,
            notification_type='emergency_update',
            data={'emergency_id': str(emergency.id), 'status': new_status},
        )

        # WebSocket push
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'emergency_{emergency_id}',
            {'type': 'status_update', 'status': new_status, 'message': msg}
        )
    except Exception as e:
        print(f'notify_emergency_status_change error: {e}')
