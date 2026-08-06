from django.utils import timezone
from rest_framework import generics, viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Ambulance, EmergencyRequest, EmergencyContact
from .serializers import (
    AmbulanceSerializer, AmbulanceLocationUpdateSerializer,
    EmergencyRequestSerializer, EmergencyContactSerializer,
)
from .tasks import dispatch_ambulance, notify_emergency_status_change
from utils.geo import build_geo_filter
from utils.permissions import IsProviderOrAdmin


class AmbulanceViewSet(viewsets.ModelViewSet):
    queryset = Ambulance.objects.filter(is_active=True)
    serializer_class = AmbulanceSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'nearby']:
            return [permissions.AllowAny()]
        return [IsProviderOrAdmin()]

    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def nearby(self, request):
        try:
            lat = float(request.query_params.get('lat', 23.8103))
            lon = float(request.query_params.get('lng', 90.4125))
            radius = float(request.query_params.get('radius', 50))
        except (TypeError, ValueError):
            lat, lon, radius = 23.8103, 90.4125, 50

        qs = Ambulance.objects.filter(is_active=True, status='available')
        
        filtered = []
        from utils.geo import calculate_distance_km
        for amb in qs:
            if amb.current_latitude is not None and amb.current_longitude is not None:
                dist = calculate_distance_km(lat, lon, amb.current_latitude, amb.current_longitude)
                if radius is None or dist <= radius:
                    amb._distance_km = round(dist, 2)
                    filtered.append(amb)
            else:
                # If ambulance has no location set yet, include it with unknown distance
                amb._distance_km = None
                filtered.append(amb)

        # Fallback to all available ambulances if distance filtering yields none
        if not filtered and qs.exists():
            filtered = list(qs)
            for amb in filtered:
                amb._distance_km = None

        filtered.sort(key=lambda x: getattr(x, '_distance_km', 0) if getattr(x, '_distance_km', None) is not None else 9999)
        return Response({'results': AmbulanceSerializer(filtered, many=True).data, 'count': len(filtered)})

    @action(detail=True, methods=['patch'], permission_classes=[IsProviderOrAdmin])
    def update_location(self, request, pk=None):
        ambulance = self.get_object()
        serializer = AmbulanceLocationUpdateSerializer(ambulance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Broadcast location update via WebSocket
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        # Notify any tracking citizens
        async_to_sync(channel_layer.group_send)(
            f'ambulance_{ambulance.id}',
            {
                'type': 'location_update',
                'latitude': ambulance.current_latitude,
                'longitude': ambulance.current_longitude,
                'status': ambulance.status,
            }
        )
        return Response({'message': 'Location updated.'})


class EmergencyRequestViewSet(viewsets.ModelViewSet):
    serializer_class = EmergencyRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.has_role('admin') or user.has_role('moderator'):
            return EmergencyRequest.objects.all().select_related('citizen__profile', 'assigned_ambulance')
        return EmergencyRequest.objects.filter(citizen=user).select_related('assigned_ambulance')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        emergency = serializer.save(citizen=request.user)
        # Trigger async dispatch
        dispatch_ambulance.delay(str(emergency.id))
        
        # Notify Admins with action details & direct link
        try:
            from apps.notifications.utils import notify_admins
            user_name = getattr(request.user, 'profile', None) and request.user.profile.full_name or request.user.email
            notify_admins(
                title="🚨 Emergency Ambulance Requested!",
                body=f"New emergency request by {user_name}. Type: {emergency.request_type.title()} | Condition: {emergency.patient_condition} | Pickup: {emergency.pickup_address}",
                notification_type="ambulance_dispatch",
                data={
                    "link": "/admin/ambulances",
                    "emergency_id": str(emergency.id),
                    "patient_condition": emergency.patient_condition,
                    "pickup_address": emergency.pickup_address,
                }
            )
        except Exception:
            pass

        return Response(
            self.get_serializer(emergency, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['patch'], permission_classes=[IsProviderOrAdmin])
    def update_status(self, request, pk=None):
        emergency = self.get_object()
        new_status = request.data.get('status')
        old_status = emergency.status
        
        if new_status:
            valid_statuses = [s[0] for s in EmergencyRequest.STATUS_CHOICES]
            if new_status not in valid_statuses:
                return Response({'error': 'Invalid status'}, status=400)
            emergency.status = new_status
            if new_status == 'dispatched':
                emergency.dispatched_at = timezone.now()
            elif new_status in ['resolved', 'cancelled']:
                emergency.resolved_at = timezone.now()
        
        ambulance_id = request.data.get('assigned_ambulance')
        if ambulance_id is not None:
            if ambulance_id == '':
                emergency.assigned_ambulance = None
            else:
                try:
                    ambulance = Ambulance.objects.get(id=ambulance_id)
                    emergency.assigned_ambulance = ambulance
                except (Ambulance.DoesNotExist, ValueError):
                    return Response({'error': 'Ambulance not found'}, status=404)
        
        eta = request.data.get('estimated_arrival_minutes')
        if eta is not None:
            if eta == '':
                emergency.estimated_arrival_minutes = None
            else:
                try:
                    emergency.estimated_arrival_minutes = int(eta)
                except ValueError:
                    return Response({'error': 'Invalid ETA value'}, status=400)
                    
        emergency.save()
        if new_status:
            notify_emergency_status_change.delay(str(emergency.id), old_status, new_status)
        return Response({'message': 'Emergency request updated.'})



class EmergencyContactViewSet(viewsets.ModelViewSet):
    serializer_class = EmergencyContactSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EmergencyContact.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
