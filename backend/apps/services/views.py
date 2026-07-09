from rest_framework import viewsets, generics, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import ServiceCategory, ServiceListing, ProviderProfile, Favorite
from .serializers import (
    ServiceCategorySerializer, ServiceListingSerializer,
    ServiceListingWriteSerializer, ProviderProfileSerializer,
)
from utils.geo import build_geo_filter
from utils.permissions import IsServiceProvider, IsProviderOrAdmin


class ServiceCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ServiceCategory.objects.filter(is_active=True, parent=None)
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.AllowAny]


class ServiceListingViewSet(viewsets.ModelViewSet):
    queryset = ServiceListing.objects.filter(status='active').select_related('category', 'provider')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_verified', 'is_featured']
    search_fields = ['title', 'description', 'address']
    ordering_fields = ['average_rating', 'review_count', 'created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'nearby']:
            return [permissions.AllowAny()]
        return [IsProviderOrAdmin()]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ServiceListingWriteSerializer
        return ServiceListingSerializer

    def perform_create(self, serializer):
        provider = self.request.user.provider_profile
        serializer.save(provider=provider)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def nearby(self, request):
        try:
            lat = float(request.query_params.get('lat', 0))
            lon = float(request.query_params.get('lng', 0))
            radius = float(request.query_params.get('radius', 10))
        except (TypeError, ValueError):
            return Response({'error': 'Invalid lat/lng/radius'}, status=400)

        qs = ServiceListing.objects.filter(status='active').select_related('category', 'provider')
        results = build_geo_filter(qs, lat, lon, radius)
        serializer = ServiceListingSerializer(results, many=True)
        return Response({'results': serializer.data, 'count': len(results)})


class FavoriteListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related('service')

    def list(self, request, *args, **kwargs):
        favs = self.get_queryset()
        services = [f.service for f in favs]
        return Response(ServiceListingSerializer(services, many=True).data)

    def create(self, request, *args, **kwargs):
        service_id = request.data.get('service_id')
        try:
            service = ServiceListing.objects.get(id=service_id)
        except ServiceListing.DoesNotExist:
            return Response({'error': 'Service not found'}, status=404)
        _, created = Favorite.objects.get_or_create(user=request.user, service=service)
        if not created:
            return Response({'message': 'Already in favorites'}, status=200)
        return Response({'message': 'Added to favorites'}, status=201)


class ProviderProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProviderProfileSerializer
    permission_classes = [IsServiceProvider]

    def get_object(self):
        profile, _ = ProviderProfile.objects.get_or_create(user=self.request.user, defaults={'business_name': 'My Business'})
        return profile
