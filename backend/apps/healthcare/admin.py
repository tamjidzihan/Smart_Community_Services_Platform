from django.contrib import admin
from .models import Hospital, Doctor, DoctorSchedule, Appointment


class DoctorScheduleInline(admin.TabularInline):
    model = DoctorSchedule
    extra = 1


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'phone', 'bed_count', 'available_beds', 'emergency_available', 'is_verified', 'average_rating']
    list_filter = ['category', 'emergency_available', 'is_verified']
    search_fields = ['name', 'address', 'phone', 'email']


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'specialization', 'hospital', 'phone', 'consultation_fee', 'is_available', 'average_rating']
    list_filter = ['specialization', 'is_available', 'hospital']
    search_fields = ['full_name', 'specialization', 'phone', 'email', 'license_number']
    inlines = [DoctorScheduleInline]


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['citizen', 'doctor', 'hospital', 'scheduled_at', 'status', 'created_at']
    list_filter = ['status', 'scheduled_at']
    search_fields = ['citizen__email', 'doctor__full_name', 'hospital__name', 'reason']
    date_hierarchy = 'scheduled_at'
