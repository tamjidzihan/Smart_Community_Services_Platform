from django.contrib import admin
from .models import BloodDonor, BloodRequest, DonationHistory


@admin.register(BloodDonor)
class BloodDonorAdmin(admin.ModelAdmin):
    list_display = ['user', 'blood_group', 'is_available', 'total_donations', 'last_donated_at', 'created_at']
    list_filter = ['blood_group', 'is_available']
    search_fields = ['user__email', 'user__profile__full_name']


@admin.register(BloodRequest)
class BloodRequestAdmin(admin.ModelAdmin):
    list_display = ['patient_name', 'blood_group', 'units_needed', 'units_fulfilled', 'urgency', 'status', 'requester', 'created_at']
    list_filter = ['blood_group', 'urgency', 'status']
    search_fields = ['patient_name', 'hospital_name', 'requester__email']
    date_hierarchy = 'created_at'


@admin.register(DonationHistory)
class DonationHistoryAdmin(admin.ModelAdmin):
    list_display = ['donor', 'request', 'donated_at', 'volume_ml']
    list_filter = ['donated_at']
    search_fields = ['donor__user__email', 'notes']
