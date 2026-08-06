from django.contrib import admin
from .models import NGO, Volunteer, NGOEvent


@admin.register(NGO)
class NGOAdmin(admin.ModelAdmin):
    list_display = ['name', 'registration_number', 'phone', 'email', 'is_verified', 'is_active', 'created_at']
    list_filter = ['is_verified', 'is_active']
    search_fields = ['name', 'registration_number', 'description', 'email']


@admin.register(Volunteer)
class VolunteerAdmin(admin.ModelAdmin):
    list_display = ['user', 'ngo', 'is_available', 'hours_contributed', 'created_at']
    list_filter = ['is_available', 'ngo']
    search_fields = ['user__email', 'bio']


@admin.register(NGOEvent)
class NGOEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'ngo', 'start_date', 'end_date', 'max_volunteers', 'is_active']
    list_filter = ['is_active', 'start_date', 'ngo']
    search_fields = ['title', 'description', 'location']
