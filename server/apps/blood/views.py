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
        full_name = self.request.data.get('full_name')
        phone = self.request.data.get('phone')
        address = self.request.data.get('address')
        profile = getattr(self.request.user, 'profile', None)
        if profile:
            if full_name:
                profile.full_name = full_name
            if phone:
                profile.phone = phone
            if address:
                profile.address = address
            profile.save()
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def search(self, request):
        blood_group = request.query_params.get('group', '')
        try:
            lat = float(request.query_params.get('lat', 23.8103))
            lon = float(request.query_params.get('lng', 90.4125))
            radius = float(request.query_params.get('radius', 50))
        except (TypeError, ValueError):
            lat, lon, radius = 23.8103, 90.4125, 50

        qs = BloodDonor.objects.filter(is_available=True).select_related('user__profile')
        if blood_group:
            compatible = COMPATIBLE_DONORS.get(blood_group, [blood_group])
            qs = qs.filter(blood_group__in=compatible)

        results = build_geo_filter(qs, lat, lon, radius)
        # Fallback to all matching donors if radius filter excludes everyone
        if not results and qs.exists():
            results = list(qs)
            for r in results:
                r._distance_km = None

        return Response({'results': BloodDonorSerializer(results, many=True).data, 'count': len(results)})


class BloodRequestViewSet(viewsets.ModelViewSet):
    serializer_class = BloodRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser or user.roles.filter(name__in=['admin', 'moderator']).exists():
            qs = BloodRequest.objects.all().select_related('requester__profile').order_by('-created_at')
            # Optional filters for admin view
            urgency = self.request.query_params.get('urgency')
            status = self.request.query_params.get('status')
            blood_group = self.request.query_params.get('blood_group')
            if urgency:
                qs = qs.filter(urgency=urgency)
            if status:
                qs = qs.filter(status=status)
            if blood_group:
                qs = qs.filter(blood_group=blood_group)
            return qs
        return BloodRequest.objects.filter(requester=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        request_obj = serializer.save(requester=self.request.user)
        # Trigger emergency notification to nearby compatible donors
        from .tasks import notify_nearby_donors
        notify_nearby_donors.delay(str(request_obj.id))

        # Notify Admins with action details & direct link
        try:
            from apps.notifications.utils import notify_admins
            user_name = getattr(self.request.user, 'profile', None) and self.request.user.profile.full_name or self.request.user.email
            notify_admins(
                title=f"🩸 Urgent Blood Request ({request_obj.blood_group})",
                body=f"New emergency blood request by {user_name} for Patient: {request_obj.patient_name} ({request_obj.units_needed} unit(s)). Hospital: {request_obj.hospital_name or 'N/A'}",
                notification_type="blood_request",
                data={
                    "link": "/admin/requests",
                    "request_id": str(request_obj.id),
                    "blood_group": request_obj.blood_group,
                    "patient_name": request_obj.patient_name,
                }
            )
        except Exception:
            pass

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def update_status(self, request, pk=None):
        user = request.user
        if not (user.is_staff or user.is_superuser or user.roles.filter(name__in=['admin', 'moderator']).exists()):
            return Response({'error': 'Not authorized.'}, status=403)
        blood_request = self.get_object()
        status_val = request.data.get('status')
        units_fulfilled_val = request.data.get('units_fulfilled')
        notes_val = request.data.get('notes')
        
        if status_val:
            valid_statuses = [s[0] for s in BloodRequest.STATUS]
            if status_val not in valid_statuses:
                return Response({'error': 'Invalid status'}, status=400)
            blood_request.status = status_val
            if status_val in ['fulfilled', 'cancelled']:
                from django.utils import timezone
                blood_request.resolved_at = timezone.now()
        if units_fulfilled_val is not None:
            try:
                blood_request.units_fulfilled = int(units_fulfilled_val)
            except ValueError:
                return Response({'error': 'Invalid units fulfilled value'}, status=400)
        if notes_val is not None:
            blood_request.notes = notes_val
            
        blood_request.save()
        return Response({'message': 'Blood request updated.', 'status': blood_request.status})


