from rest_framework import serializers
from .models import Ambulance, EmergencyRequest, EmergencyContact


class AmbulanceSerializer(serializers.ModelSerializer):
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = Ambulance
        fields = [
            'id', 'registration_number', 'ambulance_type', 'driver_name',
            'driver_phone', 'current_latitude', 'current_longitude',
            'status', 'distance_km',
        ]

    def get_distance_km(self, obj):
        return getattr(obj, '_distance_km', None)


class AmbulanceLocationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ambulance
        fields = ['current_latitude', 'current_longitude', 'status']


class EmergencyRequestSerializer(serializers.ModelSerializer):
    ambulance = AmbulanceSerializer(source='assigned_ambulance', read_only=True)
    citizen_name = serializers.CharField(source='citizen.profile.full_name', read_only=True)
    citizen_phone = serializers.CharField(source='citizen.profile.phone', read_only=True)
    websocket_channel = serializers.SerializerMethodField()

    class Meta:
        model = EmergencyRequest
        fields = [
            'id', 'request_type', 'patient_condition', 'pickup_address',
            'pickup_latitude', 'pickup_longitude', 'status',
            'estimated_arrival_minutes', 'notes', 'ambulance',
            'citizen_name', 'citizen_phone', 'websocket_channel',
            'created_at', 'dispatched_at',
        ]
        read_only_fields = [
            'id', 'status', 'estimated_arrival_minutes', 'ambulance',
            'citizen_name', 'citizen_phone', 'websocket_channel',
            'created_at', 'dispatched_at',
        ]

    def get_websocket_channel(self, obj):
        request = self.context.get('request')
        if request:
            return f'ws://{request.get_host()}/ws/emergency/{obj.id}/'
        return f'/ws/emergency/{obj.id}/'


class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = ['id', 'name', 'phone', 'relationship']
