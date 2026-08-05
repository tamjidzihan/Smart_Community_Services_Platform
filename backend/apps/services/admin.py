from django.contrib import admin
from .models import ServiceCategory, ProviderProfile, ServiceListing, ServiceAvailability, Favorite


class ServiceAvailabilityInline(admin.TabularInline):
    model = ServiceAvailability
    extra = 1


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'parent', 'is_active', 'order']
    list_filter = ['is_active']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    list_display = ['business_name', 'user', 'verification_status', 'created_at']
    list_filter = ['verification_status']
    search_fields = ['business_name', 'user__email', 'license_number']


@admin.register(ServiceListing)
class ServiceListingAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'provider', 'status', 'is_verified', 'is_featured', 'average_rating', 'created_at']
    list_filter = ['status', 'is_verified', 'is_featured', 'category']
    search_fields = ['title', 'description', 'address', 'phone', 'email']
    inlines = [ServiceAvailabilityInline]


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'service', 'created_at']
    search_fields = ['user__email', 'service__title']
