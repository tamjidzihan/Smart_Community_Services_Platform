import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Ambulance(models.Model):
    TYPE_CHOICES = [
        ('basic', 'Basic Life Support'),
        ('advanced', 'Advanced Life Support'),
        ('neonatal', 'Neonatal'),
        ('air', 'Air Ambulance'),
    ]
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('en_route', 'En Route'),
        ('at_scene', 'At Scene'),
        ('transporting', 'Transporting'),
        ('unavailable', 'Unavailable'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ambulances')
    registration_number = models.CharField(max_length=50, unique=True)
    ambulance_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='basic')
    driver_name = models.CharField(max_length=150)
    driver_phone = models.CharField(max_length=20)
    current_latitude = models.FloatField(null=True, blank=True)
    current_longitude = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.registration_number} ({self.get_status_display()})'

    class Meta:
        db_table = 'ambulances'
        indexes = [models.Index(fields=['status', 'is_active'])]


class EmergencyRequest(models.Model):
    REQUEST_TYPES = [
        ('ambulance', 'Ambulance'),
        ('medical', 'Medical Emergency'),
        ('accident', 'Accident'),
        ('cardiac', 'Cardiac Arrest'),
        ('fire', 'Fire'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('dispatched', 'Dispatched'),
        ('en_route', 'En Route'),
        ('arrived', 'Arrived'),
        ('resolved', 'Resolved'),
        ('cancelled', 'Cancelled'),
        ('no_resource', 'No Resource Available'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    citizen = models.ForeignKey(User, on_delete=models.CASCADE, related_name='emergency_requests')
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPES, default='ambulance')
    patient_condition = models.TextField(blank=True)
    pickup_address = models.TextField(blank=True)
    pickup_latitude = models.FloatField()
    pickup_longitude = models.FloatField()
    assigned_ambulance = models.ForeignKey(
        Ambulance, null=True, blank=True, on_delete=models.SET_NULL, related_name='emergency_requests'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    estimated_arrival_minutes = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'Emergency #{str(self.id)[:8]} — {self.get_status_display()}'

    class Meta:
        db_table = 'emergency_requests'
        ordering = ['-created_at']


class EmergencyContact(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='emergency_contacts')
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    relationship = models.CharField(max_length=50)

    class Meta:
        db_table = 'emergency_contacts'
