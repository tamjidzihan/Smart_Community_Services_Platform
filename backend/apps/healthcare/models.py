import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Hospital(models.Model):
    CATEGORY_CHOICES = [
        ('general', 'General Hospital'),
        ('specialized', 'Specialized Hospital'),
        ('clinic', 'Clinic'),
        ('diagnostic', 'Diagnostic Center'),
        ('pharmacy', 'Pharmacy'),
        ('dental', 'Dental Clinic'),
        ('eye', 'Eye Hospital'),
        ('maternity', 'Maternity Hospital'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    address = models.TextField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    emergency_available = models.BooleanField(default=False)
    bed_count = models.PositiveIntegerField(default=0)
    available_beds = models.PositiveIntegerField(default=0)
    established_year = models.IntegerField(null=True, blank=True)
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    is_verified = models.BooleanField(default=False)
    average_rating = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'hospitals'
        ordering = ['-average_rating']
        indexes = [models.Index(fields=['emergency_available', 'category'])]

class Doctor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='doctors')
    full_name = models.CharField(max_length=150)
    specialization = models.CharField(max_length=100, db_index=True)
    license_number = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_available = models.BooleanField(default=True)
    average_rating = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Dr. {self.full_name} — {self.specialization}'

    class Meta:
        db_table = 'doctors'
        ordering = ['full_name']

class DoctorSchedule(models.Model):
    DAY_CHOICES = [(i, day) for i, day in enumerate(['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'])]
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    max_appointments = models.PositiveIntegerField(default=20)
    is_available = models.BooleanField(default=True)

    class Meta:
        db_table = 'doctor_schedules'
        unique_together = ['doctor', 'day_of_week']

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    citizen = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='appointments')
    scheduled_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.citizen.email} with Dr. {self.doctor.full_name} on {self.scheduled_at}'

    class Meta:
        db_table = 'appointments'
        ordering = ['-scheduled_at']
        indexes = [
            models.Index(fields=['citizen', 'status']),
            models.Index(fields=['doctor', 'scheduled_at']),
        ]
