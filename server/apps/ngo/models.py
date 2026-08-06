import uuid
from django.db import models
from django.contrib.auth import get_user_model
from rest_framework import serializers, viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.urls import path, include
from rest_framework.routers import DefaultRouter

User = get_user_model()


class NGO(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    registration_number = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    focus_areas = models.JSONField(default=list)  # ['education', 'health', 'disaster_relief']
    address = models.TextField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    logo_url = models.URLField(blank=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'ngos'
        ordering = ['name']


class Volunteer(models.Model):
    SKILL_CHOICES = [
        ('medical', 'Medical'),
        ('teaching', 'Teaching'),
        ('disaster_relief', 'Disaster Relief'),
        ('counseling', 'Counseling'),
        ('logistics', 'Logistics'),
        ('tech', 'Technology'),
        ('other', 'Other'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='volunteer_profile')
    ngo = models.ForeignKey(NGO, null=True, blank=True, on_delete=models.SET_NULL, related_name='volunteers')
    skills = models.JSONField(default=list)
    availability = models.CharField(max_length=100, blank=True)
    is_available = models.BooleanField(default=True)
    bio = models.TextField(blank=True)
    hours_contributed = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.email} (Volunteer)'

    class Meta:
        db_table = 'volunteers'


class NGOEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ngo = models.ForeignKey(NGO, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=200)
    description = models.TextField()
    location = models.TextField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    max_volunteers = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ngo_events'
        ordering = ['start_date']


# ─── Serializers ─────────────────────────────────────────────────────────────

class NGOSerializer(serializers.ModelSerializer):
    volunteer_count = serializers.SerializerMethodField()

    class Meta:
        model = NGO
        fields = [
            'id', 'name', 'registration_number', 'description', 'focus_areas',
            'address', 'latitude', 'longitude', 'phone', 'email', 'website',
            'logo_url', 'is_verified', 'is_active', 'volunteer_count',
        ]

    def get_volunteer_count(self, obj):
        return obj.volunteers.filter(is_available=True).count()


class VolunteerSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.profile.full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Volunteer
        fields = [
            'id', 'user_name', 'user_email', 'ngo', 'skills',
            'availability', 'is_available', 'bio', 'hours_contributed',
        ]
        read_only_fields = ['id', 'user_name', 'user_email', 'hours_contributed']


class NGOEventSerializer(serializers.ModelSerializer):
    ngo_name = serializers.CharField(source='ngo.name', read_only=True)

    class Meta:
        model = NGOEvent
        fields = [
            'id', 'ngo', 'ngo_name', 'title', 'description', 'location',
            'latitude', 'longitude', 'start_date', 'end_date',
            'max_volunteers', 'is_active',
        ]


# ─── ViewSets ────────────────────────────────────────────────────────────────

class NGOViewSet(viewsets.ModelViewSet):
    queryset = NGO.objects.filter(is_active=True)
    serializer_class = NGOSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'focus_areas']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        from utils.permissions import IsAdminRole
        return [IsAdminRole()]


class VolunteerViewSet(viewsets.ModelViewSet):
    serializer_class = VolunteerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Volunteer.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class NGOEventViewSet(viewsets.ModelViewSet):
    queryset = NGOEvent.objects.filter(is_active=True)
    serializer_class = NGOEventSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ngo', 'is_active']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

