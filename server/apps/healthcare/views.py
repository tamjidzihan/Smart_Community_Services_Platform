import uuid
from rest_framework import viewsets, generics, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from django.db.models import Q

from .models import (
    Hospital,
    HospitalBranch,
    Department,
    Specialist,
    Doctor,
    DoctorHospital,
    DoctorBranch,
    DoctorSchedule,
    DoctorLeave,
    Appointment,
    FavoriteDoctor,
    FavoriteHospital,
    FavoriteDepartment,
)
from .serializers import (
    HospitalSerializer,
    HospitalDetailSerializer,
    HospitalBranchSerializer,
    DepartmentSerializer,
    SpecialistSerializer,
    DoctorSerializer,
    DoctorDetailSerializer,
    DoctorHospitalSerializer,
    DoctorBranchSerializer,
    DoctorScheduleSerializer,
    DoctorLeaveSerializer,
    AppointmentSerializer,
    FavoriteDoctorSerializer,
    FavoriteHospitalSerializer,
)
from utils.geo import calculate_distance_km
from utils.permissions import IsAdminRole


# ─── FilterSets ──────────────────────────────────────────────────────────────

class HospitalFilter(django_filters.FilterSet):
    hospital_type = django_filters.CharFilter(field_name='hospital_type')
    division = django_filters.CharFilter(field_name='division', lookup_expr='iexact')
    district = django_filters.CharFilter(field_name='district', lookup_expr='iexact')
    city = django_filters.CharFilter(field_name='city', lookup_expr='icontains')
    area = django_filters.CharFilter(field_name='area', lookup_expr='icontains')
    emergency_available = django_filters.BooleanFilter(field_name='emergency_available')
    open_24_hours = django_filters.BooleanFilter(field_name='open_24_hours')
    ambulance_available = django_filters.BooleanFilter(field_name='ambulance_available')
    min_rating = django_filters.NumberFilter(field_name='average_rating', lookup_expr='gte')

    class Meta:
        model = Hospital
        fields = ['hospital_type', 'division', 'district', 'city', 'area', 'emergency_available', 'open_24_hours', 'ambulance_available', 'status']


class DoctorFilter(django_filters.FilterSet):
    specialist = django_filters.UUIDFilter(field_name='specialists__id')
    specialist_slug = django_filters.CharFilter(field_name='specialists__slug')
    hospital = django_filters.UUIDFilter(field_name='hospital_affiliations__hospital__id')
    hospital_slug = django_filters.CharFilter(field_name='hospital_affiliations__hospital__slug')
    branch = django_filters.UUIDFilter(field_name='branch_affiliations__branch__id')
    department = django_filters.UUIDFilter(field_name='hospital_affiliations__department__id')
    department_name = django_filters.CharFilter(field_name='hospital_affiliations__department__name', lookup_expr='icontains')
    gender = django_filters.CharFilter(field_name='gender')
    min_rating = django_filters.NumberFilter(field_name='average_rating', lookup_expr='gte')
    city = django_filters.CharFilter(field_name='hospital_affiliations__hospital__city', lookup_expr='icontains')
    area = django_filters.CharFilter(field_name='hospital_affiliations__hospital__area', lookup_expr='icontains')

    class Meta:
        model = Doctor
        fields = ['gender', 'is_active', 'is_verified']


# ─── ViewSets ────────────────────────────────────────────────────────────────

class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.all().prefetch_related('branches', 'departments')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = HospitalFilter
    search_fields = ['name', 'address', 'city', 'area', 'description']
    ordering_fields = ['average_rating', 'name', 'created_at']
    ordering = ['-average_rating', 'name']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return HospitalDetailSerializer
        return HospitalSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'nearby', 'departments', 'doctors', 'branches', 'locations']:
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def locations(self, request):
        areas = list(Hospital.objects.filter(status='active').exclude(area='').values_list('area', flat=True).distinct())
        cities = list(Hospital.objects.filter(status='active').exclude(city='').values_list('city', flat=True).distinct())
        return Response({
            'areas': sorted(list(set(filter(None, areas)))),
            'cities': sorted(list(set(filter(None, cities)))),
        })

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def nearby(self, request):
        try:
            lat = float(request.query_params.get('lat', 0))
            lon = float(request.query_params.get('lng', 0))
            radius = float(request.query_params.get('radius', 15))
            emergency_only = request.query_params.get('emergency') in ['true', '1']
        except (TypeError, ValueError):
            return Response({'error': 'Invalid coordinates or radius'}, status=status.HTTP_400_BAD_REQUEST)

        qs = Hospital.objects.filter(status='active')
        if emergency_only:
            qs = qs.filter(emergency_available=True)

        results = []
        for h in qs:
            if h.latitude is not None and h.longitude is not None:
                dist = calculate_distance_km(lat, lon, h.latitude, h.longitude)
                if dist <= radius:
                    h._distance_km = round(dist, 2)
                    results.append(h)
        results.sort(key=lambda x: getattr(x, '_distance_km', 99999))
        return Response({'results': HospitalSerializer(results, many=True).data, 'count': len(results)})

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def departments(self, request, pk=None):
        hospital = self.get_object()
        depts = hospital.departments.filter(status='active')
        return Response(DepartmentSerializer(depts, many=True).data)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def branches(self, request, pk=None):
        hospital = self.get_object()
        branches = hospital.branches.filter(status='active')
        return Response(HospitalBranchSerializer(branches, many=True).data)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def doctors(self, request, pk=None):
        hospital = self.get_object()
        doctor_ids = DoctorHospital.objects.filter(hospital=hospital, status='active').values_list('doctor_id', flat=True)
        doctors = Doctor.objects.filter(id__in=doctor_ids, is_active=True).prefetch_related(
            'specialists', 'hospital_affiliations', 'branch_affiliations'
        )
        return Response(DoctorSerializer(doctors, many=True).data)


class HospitalBranchViewSet(viewsets.ModelViewSet):
    queryset = HospitalBranch.objects.select_related('hospital')
    serializer_class = HospitalBranchSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['hospital', 'city', 'status']
    search_fields = ['name', 'address', 'city', 'area']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.select_related('hospital')
    serializer_class = DepartmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['hospital', 'status']
    search_fields = ['name', 'description']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'doctors', 'common']:
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def common(self, request):
        dept_names = list(Department.objects.filter(status='active').exclude(name='').values_list('name', flat=True).distinct())
        return Response(sorted(list(set(filter(None, dept_names)))))

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def doctors(self, request, pk=None):
        department = self.get_object()
        doctor_ids = DoctorHospital.objects.filter(department=department, status='active').values_list('doctor_id', flat=True)
        doctors = Doctor.objects.filter(id__in=doctor_ids, is_active=True).prefetch_related(
            'specialists', 'hospital_affiliations', 'branch_affiliations'
        )
        return Response(DoctorSerializer(doctors, many=True).data)


class SpecialistViewSet(viewsets.ModelViewSet):
    queryset = Specialist.objects.filter(status='active')
    serializer_class = SpecialistSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name']
    ordering = ['name']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'doctors']:
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def doctors(self, request, pk=None):
        specialist = self.get_object()
        doctors = specialist.doctors.filter(is_active=True).prefetch_related(
            'specialists', 'hospital_affiliations', 'branch_affiliations'
        )
        return Response(DoctorSerializer(doctors, many=True).data)


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.prefetch_related(
        'specialists', 'hospital_affiliations__hospital', 'hospital_affiliations__department',
        'branch_affiliations__branch', 'schedules', 'leaves'
    ).distinct()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = DoctorFilter
    search_fields = ['full_name', 'degree_summary', 'experience_summary', 'current_position', 'specialists__name']
    ordering_fields = ['average_rating', 'full_name', 'created_at']
    ordering = ['-average_rating', 'full_name']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DoctorDetailSerializer
        return DoctorSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'schedule', 'leave']:
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def schedule(self, request, pk=None):
        doctor = self.get_object()
        schedules = doctor.schedules.filter(status='active')
        return Response(DoctorScheduleSerializer(schedules, many=True).data)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def leave(self, request, pk=None):
        doctor = self.get_object()
        leaves = doctor.leaves.filter(status='active')
        return Response(DoctorLeaveSerializer(leaves, many=True).data)


class DoctorScheduleViewSet(viewsets.ModelViewSet):
    queryset = DoctorSchedule.objects.select_related('doctor', 'hospital', 'branch', 'department')
    serializer_class = DoctorScheduleSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['doctor', 'hospital', 'branch', 'day_of_week', 'status']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]


class DoctorLeaveViewSet(viewsets.ModelViewSet):
    queryset = DoctorLeave.objects.select_related('doctor', 'branch')
    serializer_class = DoctorLeaveSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['doctor', 'branch', 'status']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'appointment_type', 'doctor', 'hospital']
    ordering = ['-scheduled_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser or user.roles.filter(name__in=['admin', 'moderator']).exists():
            return Appointment.objects.all().select_related(
                'citizen__profile', 'doctor', 'hospital', 'branch', 'department'
            )
        return Appointment.objects.filter(citizen=user).select_related(
            'doctor', 'hospital', 'branch', 'department'
        )

    def perform_create(self, serializer):
        appointment = serializer.save(citizen=self.request.user)
        try:
            from apps.notifications.utils import send_notification, notify_admins
            send_notification(
                user=self.request.user,
                title='📅 Appointment Scheduled',
                body=f'Your appointment with Dr. {appointment.doctor.full_name} is set for {appointment.scheduled_at.strftime("%d %b %Y %H:%M")}.',
                notification_type='appointment',
                data={'appointment_id': str(appointment.id)},
            )
            notify_admins(
                title='🏥 New Healthcare Appointment',
                body=f'Citizen {self.request.user.email} scheduled an appointment with Dr. {appointment.doctor.full_name}.',
                notification_type='appointment',
                data={'appointment_id': str(appointment.id)},
            )
        except Exception:
            pass


class FavoriteViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get', 'post'], url_path='doctors')
    def favorite_doctors(self, request):
        if request.method == 'POST':
            doctor_id = request.data.get('doctor_id')
            if not doctor_id:
                return Response({'error': 'doctor_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            fav, created = FavoriteDoctor.objects.get_or_create(user=request.user, doctor_id=doctor_id)
            if not created:
                fav.delete()
                return Response({'favorited': False, 'message': 'Removed from favorites'})
            return Response({'favorited': True, 'message': 'Added to favorites'}, status=status.HTTP_201_CREATED)
        
        favs = FavoriteDoctor.objects.filter(user=request.user).select_related('doctor')
        return Response(FavoriteDoctorSerializer(favs, many=True).data)

    @action(detail=False, methods=['get', 'post'], url_path='hospitals')
    def favorite_hospitals(self, request):
        if request.method == 'POST':
            hospital_id = request.data.get('hospital_id')
            if not hospital_id:
                return Response({'error': 'hospital_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            fav, created = FavoriteHospital.objects.get_or_create(user=request.user, hospital_id=hospital_id)
            if not created:
                fav.delete()
                return Response({'favorited': False, 'message': 'Removed from favorites'})
            return Response({'favorited': True, 'message': 'Added to favorites'}, status=status.HTTP_201_CREATED)
        
        favs = FavoriteHospital.objects.filter(user=request.user).select_related('hospital')
        return Response(FavoriteHospitalSerializer(favs, many=True).data)


# ─── Unified Healthcare Search ───────────────────────────────────────────────

class HealthcareSearchView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query or len(query) < 2:
            return Response({'hospitals': [], 'doctors': [], 'departments': [], 'specialists': []})

        hospitals = Hospital.objects.filter(
            Q(name__icontains=query) | Q(city__icontains=query) | Q(area__icontains=query) | Q(description__icontains=query),
            status='active'
        )[:8]

        doctors = Doctor.objects.filter(
            Q(full_name__icontains=query) | Q(degree_summary__icontains=query) |
            Q(current_position__icontains=query) | Q(specialists__name__icontains=query),
            is_active=True
        ).distinct()[:8]

        departments = Department.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query),
            status='active'
        )[:6]

        specialists = Specialist.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query),
            status='active'
        )[:6]

        return Response({
            'hospitals': HospitalSerializer(hospitals, many=True).data,
            'doctors': DoctorSerializer(doctors, many=True).data,
            'departments': DepartmentSerializer(departments, many=True).data,
            'specialists': SpecialistSerializer(specialists, many=True).data,
        })
