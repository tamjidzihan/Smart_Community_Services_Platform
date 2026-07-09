import uuid
from django.db import models
from rest_framework import serializers, viewsets, permissions, filters
from django.urls import path, include
from rest_framework.routers import DefaultRouter


class GovernmentOffice(models.Model):
    OFFICE_TYPES = [
        ('municipality', 'Municipality'),
        ('district', 'District Office'),
        ('ministry', 'Ministry'),
        ('court', 'Court'),
        ('police', 'Police Station'),
        ('tax', 'Tax Office'),
        ('immigration', 'Immigration'),
        ('land', 'Land Registry'),
        ('other', 'Other'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    office_type = models.CharField(max_length=20, choices=OFFICE_TYPES, default='other')
    address = models.TextField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    office_hours = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'government_offices'
        ordering = ['name']


class GovernmentService(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    office = models.ForeignKey(GovernmentOffice, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=200)
    description = models.TextField()
    required_documents = models.JSONField(default=list)
    processing_time = models.CharField(max_length=100, blank=True)
    fee = models.CharField(max_length=100, blank=True)
    application_url = models.URLField(blank=True)
    is_online = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.name} — {self.office.name}'

    class Meta:
        db_table = 'government_services'


class GovernmentOfficeSerializer(serializers.ModelSerializer):
    services_count = serializers.SerializerMethodField()

    class Meta:
        model = GovernmentOffice
        fields = [
            'id', 'name', 'office_type', 'address', 'latitude', 'longitude',
            'phone', 'email', 'website', 'office_hours', 'description',
            'is_active', 'services_count',
        ]

    def get_services_count(self, obj):
        return obj.services.count()


class GovernmentServiceSerializer(serializers.ModelSerializer):
    office_name = serializers.CharField(source='office.name', read_only=True)
    office_address = serializers.CharField(source='office.address', read_only=True)

    class Meta:
        model = GovernmentService
        fields = [
            'id', 'office', 'office_name', 'office_address', 'name', 'description',
            'required_documents', 'processing_time', 'fee', 'application_url', 'is_online',
        ]


class GovernmentOfficeViewSet(viewsets.ModelViewSet):
    queryset = GovernmentOffice.objects.filter(is_active=True).prefetch_related('services')
    serializer_class = GovernmentOfficeSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'address', 'description']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        from utils.permissions import IsAdminRole
        return [IsAdminRole()]


class GovernmentServiceViewSet(viewsets.ModelViewSet):
    queryset = GovernmentService.objects.select_related('office')
    serializer_class = GovernmentServiceSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        from utils.permissions import IsAdminRole
        return [IsAdminRole()]



