from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'user', 'resource_type', 'resource_id', 'ip_address', 'timestamp']
    list_filter = ['action', 'resource_type', 'timestamp']
    search_fields = ['user__email', 'action', 'resource_type', 'ip_address']
    date_hierarchy = 'timestamp'
    readonly_fields = ['id', 'user', 'action', 'resource_type', 'resource_id', 'ip_address', 'user_agent', 'extra_data', 'timestamp']
