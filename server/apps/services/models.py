import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ServiceCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True)  # icon name / emoji
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children')
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'service_categories'
        ordering = ['order', 'name']
        verbose_name_plural = 'Service Categories'


class ProviderProfile(models.Model):
    VERIFICATION_STATUS = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('suspended', 'Suspended'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='provider_profile')
    business_name = models.CharField(max_length=200)
    business_description = models.TextField(blank=True)
    license_number = models.CharField(max_length=100, blank=True)
    license_document = models.URLField(blank=True)
    website = models.URLField(blank=True)
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS, default='pending')
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='verified_providers')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.business_name

    class Meta:
        db_table = 'provider_profiles'


class ServiceListing(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive'), ('pending', 'Pending Review')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.ForeignKey(ProviderProfile, on_delete=models.CASCADE, related_name='services')
    category = models.ForeignKey(ServiceCategory, on_delete=models.SET_NULL, null=True, related_name='services')
    title = models.CharField(max_length=200)
    description = models.TextField()
    address = models.TextField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_verified = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    average_rating = models.FloatField(default=0.0)
    review_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        db_table = 'service_listings'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category', 'status']),
            models.Index(fields=['latitude', 'longitude']),
        ]


class ServiceAvailability(models.Model):
    DAY_CHOICES = [(i, day) for i, day in enumerate(['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'])]
    service = models.ForeignKey(ServiceListing, on_delete=models.CASCADE, related_name='availability')
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    open_time = models.TimeField()
    close_time = models.TimeField()
    is_available = models.BooleanField(default=True)

    class Meta:
        db_table = 'service_availability'
        unique_together = ['service', 'day_of_week']


class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    service = models.ForeignKey(ServiceListing, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'favorites'
        unique_together = ['user', 'service']
