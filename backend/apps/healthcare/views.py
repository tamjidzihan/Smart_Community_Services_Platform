import uuid
from rest_framework import serializers, viewsets, generics, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .models import Hospital, Doctor, DoctorSchedule, Appointment
from utils.geo import calculate_distance_km
from utils.permissions import IsAdminRole


# ─── Serializers ─────────────────────────────────────────────────────────────

class DoctorScheduleSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = DoctorSchedule
        fields = ['id', 'day_of_week', 'day_name', 'start_time', 'end_time', 'max_appointments', 'is_available']


class DoctorSerializer(serializers.ModelSerializer):
    schedules = DoctorScheduleSerializer(many=True, read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)

    class Meta:
        model = Doctor
        fields = [
            'id', 'full_name', 'specialization', 'phone', 'email', 'bio',
            'avatar_url', 'consultation_fee', 'is_available', 'average_rating',
            'hospital', 'hospital_name', 'schedules',
        ]


class HospitalSerializer(serializers.ModelSerializer):
    doctors_count = serializers.SerializerMethodField()
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = Hospital
        fields = [
            'id', 'name', 'category', 'address', 'latitude', 'longitude',
            'phone', 'email', 'website', 'emergency_available', 'bed_count',
            'available_beds', 'description', 'image_url', 'is_verified',
            'average_rating', 'doctors_count', 'distance_km',
        ]

    def get_doctors_count(self, obj):
        return obj.doctors.filter(is_available=True).count()

    def get_distance_km(self, obj):
        return getattr(obj, '_distance_km', None)


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    doctor_specialization = serializers.CharField(source='doctor.specialization', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    citizen_name = serializers.CharField(source='citizen.profile.full_name', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'doctor', 'doctor_name', 'doctor_specialization',
            'hospital', 'hospital_name', 'citizen_name',
            'scheduled_at', 'status', 'reason', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'status', 'notes', 'created_at', 'citizen_name']


# ─── Views ───────────────────────────────────────────────────────────────────

class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'emergency_available', 'is_verified']
    search_fields = ['name', 'address', 'description']
    ordering_fields = ['average_rating', 'name']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'nearby']:
            return [permissions.AllowAny()]
        return [IsAdminRole()]

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def nearby(self, request):
        try:
            lat = float(request.query_params.get('lat', 0))
            lon = float(request.query_params.get('lng', 0))
            radius = float(request.query_params.get('radius', 15))
            emergency_only = request.query_params.get('emergency') == 'true'
        except (TypeError, ValueError):
            return Response({'error': 'Invalid coordinates'}, status=400)

        qs = Hospital.objects.all()
        if emergency_only:
            qs = qs.filter(emergency_available=True)

        results = []
        for h in qs:
            if h.latitude and h.longitude:
                dist = calculate_distance_km(lat, lon, h.latitude, h.longitude)
                if dist <= radius:
                    h._distance_km = round(dist, 2)
                    results.append(h)
        results.sort(key=lambda x: x._distance_km)
        return Response({'results': HospitalSerializer(results, many=True).data, 'count': len(results)})


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.select_related('hospital').prefetch_related('schedules')
    serializer_class = DoctorSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['hospital', 'is_available', 'specialization']
    search_fields = ['full_name', 'specialization', 'bio']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdminRole()]


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.has_role('admin') or user.has_role('moderator'):
            return Appointment.objects.all().select_related('citizen__profile', 'doctor', 'hospital')
        return Appointment.objects.filter(citizen=user).select_related('doctor', 'hospital')

    def perform_create(self, serializer):
        appointment = serializer.save(citizen=self.request.user, hospital=serializer.validated_data['doctor'].hospital)
        from apps.notifications.utils import send_notification
        send_notification(
            user=self.request.user,
            title='📅 Appointment Booked',
            body=f'Your appointment with Dr. {appointment.doctor.full_name} is confirmed for {appointment.scheduled_at.strftime("%d %b %Y %H:%M")}.',
            notification_type='appointment',
            data={'appointment_id': str(appointment.id)},
        )

    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        if appointment.citizen != request.user and not request.user.has_role('admin'):
            return Response({'error': 'Not authorized.'}, status=403)
        appointment.status = 'cancelled'
        appointment.save(update_fields=['status'])
        return Response({'message': 'Appointment cancelled.'})


