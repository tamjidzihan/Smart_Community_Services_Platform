from rest_framework import serializers, viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .models import BloodDonor, BloodRequest, DonationHistory, COMPATIBLE_DONORS
from utils.geo import build_geo_filter


# ─── Serializers ─────────────────────────────────────────────────────────────

class BloodDonorSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.profile.full_name', read_only=True)
    phone = serializers.CharField(source='user.profile.phone', read_only=True)
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = BloodDonor
        fields = [
            'id', 'full_name', 'phone', 'blood_group',
            'latitude', 'longitude', 'is_available',
            'last_donated_at', 'total_donations', 'distance_km',
        ]

    def get_distance_km(self, obj):
        return getattr(obj, '_distance_km', None)


class BloodDonorWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodDonor
        fields = ['blood_group', 'latitude', 'longitude', 'is_available']


class BloodRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(source='requester.profile.full_name', read_only=True)

    class Meta:
        model = BloodRequest
        fields = [
            'id', 'requester_name', 'blood_group', 'units_needed', 'units_fulfilled',
            'hospital_name', 'patient_name', 'urgency', 'status',
            'latitude', 'longitude', 'notes', 'created_at', 'resolved_at',
        ]
        read_only_fields = ['id', 'units_fulfilled', 'status', 'requester_name', 'created_at']


# ─── Views ───────────────────────────────────────────────────────────────────

class BloodDonorViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return BloodDonorWriteSerializer
        return BloodDonorSerializer

    def get_queryset(self):
        return BloodDonor.objects.filter(is_available=True).select_related('user__profile')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def search(self, request):
        blood_group = request.query_params.get('group', '')
        try:
            lat = float(request.query_params.get('lat', 0))
            lon = float(request.query_params.get('lng', 0))
            radius = float(request.query_params.get('radius', 20))
        except (TypeError, ValueError):
            return Response({'error': 'Invalid parameters'}, status=400)

        compatible = COMPATIBLE_DONORS.get(blood_group, [blood_group])
        qs = BloodDonor.objects.filter(is_available=True, blood_group__in=compatible).select_related('user__profile')
        results = build_geo_filter(qs, lat, lon, radius)
        return Response({'results': BloodDonorSerializer(results, many=True).data, 'count': len(results)})


class BloodRequestViewSet(viewsets.ModelViewSet):
    serializer_class = BloodRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BloodRequest.objects.filter(requester=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        request_obj = serializer.save(requester=self.request.user)
        # Trigger emergency notification to nearby compatible donors
        from .tasks import notify_nearby_donors
        notify_nearby_donors.delay(str(request_obj.id))

