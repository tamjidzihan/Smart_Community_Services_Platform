from django.contrib import admin
from .models import GovernmentOffice, GovernmentService


class GovernmentServiceInline(admin.TabularInline):
    model = GovernmentService
    extra = 1


@admin.register(GovernmentOffice)
class GovernmentOfficeAdmin(admin.ModelAdmin):
    list_display = ['name', 'office_type', 'phone', 'email', 'office_hours', 'is_active', 'created_at']
    list_filter = ['office_type', 'is_active']
    search_fields = ['name', 'address', 'description', 'email', 'phone']
    inlines = [GovernmentServiceInline]


@admin.register(GovernmentService)
class GovernmentServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'office', 'processing_time', 'fee', 'is_online', 'created_at']
    list_filter = ['is_online', 'office']
    search_fields = ['name', 'description', 'office__name']
