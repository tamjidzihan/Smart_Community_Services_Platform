from celery import shared_task
from django.contrib.auth import get_user_model

User = get_user_model()


@shared_task(bind=True, max_retries=3)
def notify_nearby_donors(self, request_id):
    try:
        from .models import BloodRequest, BloodDonor, COMPATIBLE_DONORS
        from apps.notifications.utils import send_notification

        req = BloodRequest.objects.select_related('requester__profile').get(id=request_id)
        compatible = COMPATIBLE_DONORS.get(req.blood_group, [req.blood_group])
        donors = BloodDonor.objects.filter(is_available=True, blood_group__in=compatible).select_related('user')

        notified = 0
        for donor in donors:
            send_notification(
                user=donor.user,
                title=f'🩸 Emergency Blood Request — {req.blood_group}',
                body=f'{req.patient_name} needs {req.units_needed} unit(s) of {req.blood_group} blood at {req.hospital_name or "nearby hospital"}. Urgency: {req.urgency.upper()}',
                notification_type='blood_request',
                data={'request_id': str(req.id)},
            )
            notified += 1

        return f'Notified {notified} donors for request {request_id}'
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)
