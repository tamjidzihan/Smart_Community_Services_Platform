from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Avg
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.urls import path
from utils.permissions import IsAdminRole


@api_view(['GET'])
@permission_classes([IsAdminRole])
def dashboard_summary(request):
    from django.contrib.auth import get_user_model
    from apps.healthcare.models import Appointment
    from apps.blood.models import BloodRequest
    from apps.ambulance.models import EmergencyRequest
    from apps.reviews.models import Review

    User = get_user_model()
    now = timezone.now()
    today = now.date()
    week_ago = now - timedelta(days=7)

    return Response({
        'users': {
            'total': User.objects.count(),
            'new_today': User.objects.filter(date_joined__date=today).count(),
            'new_this_week': User.objects.filter(date_joined__gte=week_ago).count(),
        },
        'appointments': {
            'total': Appointment.objects.count(),
            'today': Appointment.objects.filter(scheduled_at__date=today).count(),
            'pending': Appointment.objects.filter(status='scheduled').count(),
        },
        'blood_requests': {
            'total': BloodRequest.objects.count(),
            'open': BloodRequest.objects.filter(status='open').count(),
            'critical': BloodRequest.objects.filter(urgency='critical').count(),
        },
        'emergencies': {
            'total': EmergencyRequest.objects.count(),
            'active': EmergencyRequest.objects.filter(status__in=['pending', 'dispatched', 'en_route']).count(),
            'resolved_today': EmergencyRequest.objects.filter(resolved_at__date=today).count(),
        },
    })


@api_view(['GET'])
@permission_classes([IsAdminRole])
def daily_users(request):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    days = int(request.query_params.get('days', 7))
    now = timezone.now()
    results = []
    for i in range(days - 1, -1, -1):
        date = (now - timedelta(days=i)).date()
        count = User.objects.filter(date_joined__date=date).count()
        results.append({'date': str(date), 'new_users': count})
    return Response({'results': results})


@api_view(['GET'])
@permission_classes([IsAdminRole])
def appointment_trends(request):
    from apps.healthcare.models import Appointment
    days = int(request.query_params.get('days', 7))
    now = timezone.now()
    results = []
    for i in range(days - 1, -1, -1):
        date = (now - timedelta(days=i)).date()
        count = Appointment.objects.filter(scheduled_at__date=date).count()
        results.append({'date': str(date), 'appointments': count})
    return Response({'results': results})


@api_view(['GET'])
@permission_classes([IsAdminRole])
def blood_stats(request):
    from apps.blood.models import BloodDonor, BloodRequest
    from django.db.models import Count

    donors_by_group = list(
        BloodDonor.objects.values('blood_group').annotate(count=Count('id')).order_by('blood_group')
    )
    requests_by_group = list(
        BloodRequest.objects.values('blood_group').annotate(count=Count('id')).order_by('blood_group')
    )
    return Response({
        'donors_by_blood_group': donors_by_group,
        'requests_by_blood_group': requests_by_group,
        'total_donors': BloodDonor.objects.count(),
        'available_donors': BloodDonor.objects.filter(is_available=True).count(),
    })


@api_view(['GET'])
@permission_classes([IsAdminRole])
def emergency_stats(request):
    from apps.ambulance.models import EmergencyRequest
    from django.db.models import Count
    by_type = list(EmergencyRequest.objects.values('request_type').annotate(count=Count('id')))
    by_status = list(EmergencyRequest.objects.values('status').annotate(count=Count('id')))
    return Response({'by_type': by_type, 'by_status': by_status})

