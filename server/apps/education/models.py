import uuid
from django.db import models
from rest_framework import serializers, viewsets, permissions, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from utils.geo import calculate_distance_km


class Institution(models.Model):
    INSTITUTION_TYPES = [
        ('school', 'School'),
        ('college', 'College'),
        ('university', 'University'),
        ('madrasa', 'Madrasa'),
        ('technical', 'Technical Institute'),
        ('coaching', 'Coaching Center'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    institution_type = models.CharField(max_length=20, choices=INSTITUTION_TYPES)
    address = models.TextField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    established_year = models.IntegerField(null=True, blank=True)
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    admission_open = models.BooleanField(default=False)
    admission_deadline = models.DateField(null=True, blank=True)
    admission_info_url = models.URLField(blank=True)
    average_rating = models.FloatField(default=0.0)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'institutions'
        ordering = ['-average_rating']


class InstitutionSerializer(serializers.ModelSerializer):
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = Institution
        fields = [
            'id', 'name', 'institution_type', 'address', 'latitude', 'longitude',
            'phone', 'email', 'website', 'established_year', 'description',
            'image_url', 'admission_open', 'admission_deadline', 'admission_info_url',
            'average_rating', 'is_verified', 'distance_km',
        ]

    def get_distance_km(self, obj):
        return getattr(obj, '_distance_km', None)


class InstitutionViewSet(viewsets.ModelViewSet):
    queryset = Institution.objects.all()
    serializer_class = InstitutionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['institution_type', 'admission_open', 'is_verified']
    search_fields = ['name', 'address', 'description']
    ordering_fields = ['average_rating', 'name', 'established_year']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'nearby']:
            return [permissions.AllowAny()]
        from utils.permissions import IsAdminRole
        return [IsAdminRole()]

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def nearby(self, request):
        try:
            lat = float(request.query_params.get('lat', 0))
            lon = float(request.query_params.get('lng', 0))
            radius = float(request.query_params.get('radius', 20))
        except (TypeError, ValueError):
            return Response({'error': 'Invalid coordinates'}, status=400)

        results = []
        for inst in Institution.objects.all():
            if inst.latitude and inst.longitude:
                dist = calculate_distance_km(lat, lon, inst.latitude, inst.longitude)
                if dist <= radius:
                    inst._distance_km = round(dist, 2)
                    results.append(inst)
        results.sort(key=lambda x: x._distance_km)
        return Response({'results': InstitutionSerializer(results, many=True).data, 'count': len(results)})
