from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['reviewer', 'service_type', 'service_id', 'rating', 'is_approved', 'is_flagged', 'created_at']
    list_filter = ['rating', 'service_type', 'is_approved', 'is_flagged']
    search_fields = ['reviewer__email', 'comment', 'service_id']
    date_hierarchy = 'created_at'
