from django.contrib import admin
from .models import (
    Hospital,
    HospitalBranch,
    Department,
    Specialist,
    Doctor,
    DoctorHospital,
    DoctorBranch,
    DoctorSchedule,
    DoctorLeave,
    Appointment,
    FavoriteDoctor,
    FavoriteHospital,
    FavoriteDepartment,
)


class HospitalBranchInline(admin.TabularInline):
    model = HospitalBranch
    extra = 1


class DepartmentInline(admin.TabularInline):
    model = Department
    extra = 1


class DoctorScheduleInline(admin.TabularInline):
    model = DoctorSchedule
    extra = 1


class DoctorLeaveInline(admin.TabularInline):
    model = DoctorLeave
    extra = 1


class DoctorHospitalInline(admin.TabularInline):
    model = DoctorHospital
    extra = 1


class DoctorBranchInline(admin.TabularInline):
    model = DoctorBranch
    extra = 1


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ['name', 'hospital_type', 'city', 'phone', 'emergency_available', 'open_24_hours', 'status', 'is_verified', 'average_rating']
    list_filter = ['hospital_type', 'emergency_available', 'open_24_hours', 'status', 'is_verified', 'division']
    search_fields = ['name', 'address', 'city', 'phone', 'email']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [HospitalBranchInline, DepartmentInline]


@admin.register(HospitalBranch)
class HospitalBranchAdmin(admin.ModelAdmin):
    list_display = ['name', 'hospital', 'city', 'phone', 'status']
    list_filter = ['status', 'hospital', 'city']
    search_fields = ['name', 'address', 'phone', 'hospital__name']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'hospital', 'status', 'average_rating']
    list_filter = ['status', 'hospital']
    search_fields = ['name', 'hospital__name', 'description']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Specialist)
class SpecialistAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'status']
    list_filter = ['status']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'current_position', 'mobile', 'is_active', 'is_verified', 'average_rating']
    list_filter = ['is_active', 'is_verified', 'specialists', 'gender']
    search_fields = ['full_name', 'mobile', 'email', 'degree_summary', 'current_position']
    filter_horizontal = ['specialists']
    inlines = [DoctorHospitalInline, DoctorBranchInline, DoctorScheduleInline, DoctorLeaveInline]


@admin.register(DoctorSchedule)
class DoctorScheduleAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'hospital', 'branch', 'day_of_week', 'start_time', 'end_time', 'appointment_type', 'status']
    list_filter = ['day_of_week', 'status', 'appointment_type', 'hospital']
    search_fields = ['doctor__full_name', 'hospital__name']


@admin.register(DoctorLeave)
class DoctorLeaveAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'branch', 'start_date', 'end_date', 'status']
    list_filter = ['status', 'start_date', 'end_date']
    search_fields = ['doctor__full_name', 'message']


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['citizen', 'doctor', 'hospital', 'scheduled_at', 'appointment_type', 'status', 'created_at']
    list_filter = ['status', 'appointment_type', 'scheduled_at']
    search_fields = ['citizen__email', 'doctor__full_name', 'hospital__name', 'reason']
    date_hierarchy = 'scheduled_at'


admin.site.register(DoctorHospital)
admin.site.register(DoctorBranch)
admin.site.register(FavoriteDoctor)
admin.site.register(FavoriteHospital)
admin.site.register(FavoriteDepartment)
