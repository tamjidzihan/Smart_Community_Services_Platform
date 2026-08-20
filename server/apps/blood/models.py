import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

BLOOD_GROUPS = [
    ('A+', 'A+'), ('A-', 'A-'),
    ('B+', 'B+'), ('B-', 'B-'),
    ('AB+', 'AB+'), ('AB-', 'AB-'),
    ('O+', 'O+'), ('O-', 'O-'),
]

# Blood type compatibility map (who can receive from whom)
COMPATIBLE_DONORS = {
    'A+':  ['A+', 'A-', 'O+', 'O-'],
    'A-':  ['A-', 'O-'],
    'B+':  ['B+', 'B-', 'O+', 'O-'],
    'B-':  ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'O+':  ['O+', 'O-'],
    'O-':  ['O-'],
}


class BloodDonor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blood_donors')
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUPS, db_index=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    is_available = models.BooleanField(default=True, db_index=True)
    last_donated_at = models.DateField(null=True, blank=True)
    total_donations = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.email} — {self.blood_group}'

    class Meta:
        db_table = 'blood_donors'
        indexes = [
            models.Index(fields=['blood_group', 'is_available']),
        ]


class BloodRequest(models.Model):
    URGENCY = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')]
    STATUS = [
        ('open', 'Open'),
        ('partially_fulfilled', 'Partially Fulfilled'),
        ('fulfilled', 'Fulfilled'),
        ('cancelled', 'Cancelled'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blood_requests')
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUPS)
    units_needed = models.PositiveIntegerField(default=1)
    units_fulfilled = models.PositiveIntegerField(default=0)
    hospital_name = models.CharField(max_length=200, blank=True)
    patient_name = models.CharField(max_length=150)
    urgency = models.CharField(max_length=10, choices=URGENCY, default='medium')
    status = models.CharField(max_length=25, choices=STATUS, default='open')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'{self.blood_group} request by {self.requester.email}'

    class Meta:
        db_table = 'blood_requests'
        ordering = ['-created_at']


class DonationHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    donor = models.ForeignKey(BloodDonor, on_delete=models.CASCADE, related_name='donations')
    request = models.ForeignKey(BloodRequest, on_delete=models.SET_NULL, null=True, blank=True, related_name='donations')
    donated_at = models.DateField(auto_now_add=True)
    volume_ml = models.PositiveIntegerField(default=450)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'donation_history'
        ordering = ['-donated_at']
