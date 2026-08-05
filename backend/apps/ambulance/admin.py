from django.contrib import admin
from .models import Ambulance, EmergencyRequest, EmergencyContact


@admin.register(Ambulance)
class AmbulanceAdmin(admin.ModelAdmin):
    list_display = ['registration_number', 'ambulance_type', 'driver_name', 'driver_phone', 'status', 'is_active', 'provider']
    list_filter = ['ambulance_type', 'status', 'is_active']
    search_fields = ['registration_number', 'driver_name', 'driver_phone']


@admin.register(EmergencyRequest)
class EmergencyRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'citizen', 'request_type', 'status', 'assigned_ambulance', 'estimated_arrival_minutes', 'created_at']
    list_filter = ['request_type', 'status', 'created_at']
    search_fields = ['citizen__email', 'patient_condition', 'pickup_address']
    date_hierarchy = 'created_at'


@admin.register(EmergencyContact)
class EmergencyContactAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'phone', 'relationship']
    search_fields = ['user__email', 'name', 'phone']
