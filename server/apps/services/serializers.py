from rest_framework import serializers
from .models import ServiceCategory, ServiceListing, ProviderProfile, ServiceAvailability, Favorite


class ServiceCategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = ServiceCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'parent', 'children', 'is_active']

    def get_children(self, obj):
        return ServiceCategorySerializer(obj.children.filter(is_active=True), many=True).data


class ServiceAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceAvailability
        fields = ['day_of_week', 'open_time', 'close_time', 'is_available']


class ProviderProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderProfile
        fields = ['id', 'business_name', 'business_description', 'website', 'verification_status']


class ServiceListingSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    provider_name = serializers.CharField(source='provider.business_name', read_only=True)
    availability = ServiceAvailabilitySerializer(many=True, read_only=True)
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = ServiceListing
        fields = [
            'id', 'title', 'description', 'address', 'latitude', 'longitude',
            'phone', 'email', 'website', 'status', 'is_verified', 'is_featured',
            'average_rating', 'review_count', 'category', 'category_name',
            'provider_name', 'availability', 'distance_km', 'created_at',
        ]

    def get_distance_km(self, obj):
        return getattr(obj, '_distance_km', None)


class ServiceListingWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceListing
        fields = [
            'title', 'description', 'category', 'address',
            'latitude', 'longitude', 'phone', 'email', 'website',
        ]
