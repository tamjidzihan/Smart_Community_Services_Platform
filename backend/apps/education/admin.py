from django.contrib import admin
from .models import Institution


@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ['name', 'institution_type', 'phone', 'established_year', 'admission_open', 'admission_deadline', 'is_verified', 'average_rating']
    list_filter = ['institution_type', 'admission_open', 'is_verified']
    search_fields = ['name', 'address', 'description', 'phone', 'email']
