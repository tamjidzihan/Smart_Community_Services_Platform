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
    from apps.healthcare.models import Appointment, Doctor, Hospital
    from apps.blood.models import BloodRequest, BloodDonor

    User = get_user_model()
    now = timezone.now()
    today = now.date()
    week_ago = now - timedelta(days=7)

    total_users = User.objects.count()
    total_appointments = Appointment.objects.count()
    total_blood_requests = BloodRequest.objects.count()
    total_doctors = Doctor.objects.count()
    total_hospitals = Hospital.objects.count()

    # Recent users (last 5)
    recent_users_qs = User.objects.select_related('profile').prefetch_related('roles').order_by('-date_joined')[:5]
    recent_users = []
    for u in recent_users_qs:
        profile = getattr(u, 'profile', None)
        recent_users.append({
            'id': str(u.id),
            'email': u.email,
            'full_name': profile.full_name if profile else '',
            'avatar_url': profile.avatar_url if profile else '',
            'date_joined': u.date_joined.isoformat(),
            'roles': [r.name for r in u.roles.all()],
            'is_email_verified': u.is_email_verified,
        })

    return Response({
        'total_users': total_users,
        'total_appointments': total_appointments,
        'total_blood_requests': total_blood_requests,
        'total_doctors': total_doctors,
        'total_hospitals': total_hospitals,
        'users': {
            'total': total_users,
            'new_today': User.objects.filter(date_joined__date=today).count(),
            'new_this_week': User.objects.filter(date_joined__gte=week_ago).count(),
        },
        'appointments': {
            'total': total_appointments,
            'today': Appointment.objects.filter(scheduled_at__date=today).count(),
            'pending': Appointment.objects.filter(status='scheduled').count(),
        },
        'blood_requests': {
            'total': total_blood_requests,
            'open': BloodRequest.objects.filter(status='open').count(),
            'critical': BloodRequest.objects.filter(urgency='critical').count(),
            'total_donors': BloodDonor.objects.count(),
            'available_donors': BloodDonor.objects.filter(is_available=True).count(),
        },
        'healthcare': {
            'doctors_count': total_doctors,
            'hospitals_count': total_hospitals,
        },
        'recent_users': recent_users,
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
