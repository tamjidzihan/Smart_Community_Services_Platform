import json
from django.conf import settings
from rest_framework import generics, permissions, serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.urls import path
from django.contrib.auth import get_user_model

User = get_user_model()


class ChatMessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=1000)
    session_id = serializers.CharField(max_length=100, required=False, allow_blank=True)
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)


class AIConversationSerializer(serializers.Serializer):
    session_id = serializers.CharField()
    role = serializers.CharField()
    content = serializers.CharField()
    intent = serializers.CharField(allow_blank=True)
    created_at = serializers.DateTimeField()


SYSTEM_PROMPT = """You are the Smart Community Services Assistant for SCSP (Smart Community Services Platform).
Your job is to help citizens find and access community services in their area.

Always respond with a JSON object with this exact structure:
{
  "intent": "blood_search|hospital_search|doctor_search|ambulance_request|education_search|ngo_search|government_info|general",
  "entities": {
    "blood_group": null,
    "specialization": null,
    "hospital_category": null,
    "urgency": "normal",
    "radius_km": 15,
    "keyword": null
  },
  "human_response": "A friendly, helpful response to the user in plain text.",
  "confidence": 0.95
}

Examples:
- "find me a dentist" -> intent: "doctor_search", specialization: "Dentist"
- "I need O+ blood donor near me" -> intent: "blood_search", blood_group: "O+"
- "find dental hospital" -> intent: "hospital_search", hospital_category: "dental"
- "cardiologist near me" -> intent: "doctor_search", specialization: "Cardiology"
- "emergency ambulance" -> intent: "ambulance_request", urgency: "emergency"

Specialization mappings:
- "dentist" or "dental" -> "Dentist" or "Dental"
- "heart doctor" or "cardiologist" -> "Cardiology" or "Cardiologist"
- "eye doctor" or "ophthalmologist" -> "Ophthalmology" or "Ophthalmologist"
- "children doctor" or "pediatrician" -> "Pediatrics" or "Pediatrician"

Hospital categories: general, specialized, clinic, diagnostic, pharmacy, dental, eye, maternity

Blood groups: A+, A-, B+, B-, AB+, AB-, O+, O-

Be concise, empathetic, and helpful. For emergencies, set urgency to "emergency" and confidence high.
Always respond in valid JSON only — no markdown, no extra text outside the JSON."""


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def chat(request):
    serializer = ChatMessageSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    message = serializer.validated_data['message']
    session_id = serializer.validated_data.get('session_id', 'anonymous')
    lat = serializer.validated_data.get('latitude')
    lon = serializer.validated_data.get('longitude')

    if not settings.GEMINI_API_KEY:
        # Return mock response if no API key
        return Response({
            'session_id': session_id,
            'intent': 'general',
            'human_response': f'I received your message: "{message}". Please configure GEMINI_API_KEY for full AI functionality.',
            'entities': {},
            'results': [],
        })

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        user_context = f'User message: {message}'
        if lat and lon:
            user_context += f'\nUser location: lat={lat}, lng={lon}'

        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            max_output_tokens=800,
        )

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=user_context,
            config=config,
        )

        raw = response.text
        result = json.loads(raw)

        # Save conversation if user is authenticated
        if request.user.is_authenticated:
            _save_conversation(request.user, session_id, message, result)

        # Execute intent → get real data
        service_data = _resolve_intent(result, lat, lon)

        return Response({
            'session_id': session_id,
            'intent': result.get('intent', 'general'),
            'human_response': result.get('human_response', ''),
            'entities': result.get('entities', {}),
            'confidence': result.get('confidence', 0),
            'suggested_actions': result.get('suggested_actions', []),
            'data': service_data,
        })

    except Exception as e:
        return Response({'error': str(e), 'human_response': 'Sorry, I encountered an error. Please try again.'}, status=500)


def _save_conversation(user, session_id, user_message, ai_result):
    """Save conversation to DB."""
    try:
        from apps.ai_assistant.models import AIConversation
        AIConversation.objects.create(
            user=user,
            session_id=session_id,
            role='user',
            content=user_message,
            intent='',
        )
        AIConversation.objects.create(
            user=user,
            session_id=session_id,
            role='assistant',
            content=ai_result.get('human_response', ''),
            intent=ai_result.get('intent', ''),
        )
    except Exception:
        pass


def _resolve_intent(result, lat, lon):
    """Convert AI intent into actual DB query results."""
    intent = result.get('intent', 'general')
    entities = result.get('entities', {})
    data = {}

    try:
        if intent == 'blood_search' and lat and lon:
            from apps.blood.models import BloodDonor, COMPATIBLE_DONORS
            from apps.blood.views import BloodDonorSerializer
            from utils.geo import calculate_distance_km
            blood_group = entities.get('blood_group', 'O+')
            compatible = COMPATIBLE_DONORS.get(blood_group, [blood_group])
            donors = BloodDonor.objects.filter(is_available=True, blood_group__in=compatible).select_related('user__profile')
            results = []
            for d in donors:
                dist = calculate_distance_km(lat, lon, d.latitude, d.longitude)
                if dist <= (entities.get('radius_km') or 20):
                    d._distance_km = round(dist, 2)
                    results.append(d)
            results.sort(key=lambda x: x._distance_km)
            data['donors'] = BloodDonorSerializer(results[:5], many=True).data

        elif intent == 'hospital_search' and lat and lon:
            from apps.healthcare.models import Hospital
            from apps.healthcare.views import HospitalSerializer
            from utils.geo import calculate_distance_km
            qs = Hospital.objects.all()
            spec = entities.get('specialization')
            if spec:
                qs = qs.filter(description__icontains=spec)
            results = []
            for h in qs:
                if h.latitude and h.longitude:
                    dist = calculate_distance_km(lat, lon, h.latitude, h.longitude)
                    if dist <= (entities.get('radius_km') or 15):
                        h._distance_km = round(dist, 2)
                        results.append(h)
            results.sort(key=lambda x: x._distance_km)
            data['hospitals'] = HospitalSerializer(results[:5], many=True).data

        elif intent == 'ambulance_request' and lat and lon:
            from apps.ambulance.models import Ambulance
            from apps.ambulance.serializers import AmbulanceSerializer
            from utils.geo import calculate_distance_km
            ambulances = Ambulance.objects.filter(is_active=True, status='available')
            results = []
            for a in ambulances:
                if a.current_latitude and a.current_longitude:
                    dist = calculate_distance_km(lat, lon, a.current_latitude, a.current_longitude)
                    if dist <= 15:
                        a._distance_km = round(dist, 2)
                        results.append(a)
            results.sort(key=lambda x: x._distance_km)
            data['ambulances'] = AmbulanceSerializer(results[:3], many=True).data

    except Exception as e:
        data['error'] = str(e)

    return data


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def chat_history(request):
    try:
        from apps.ai_assistant.models import AIConversation
        session_id = request.query_params.get('session_id')
        qs = AIConversation.objects.filter(user=request.user).order_by('-created_at')[:50]
        if session_id:
            qs = AIConversation.objects.filter(user=request.user, session_id=session_id).order_by('created_at')
        data = [{'role': c.role, 'content': c.content, 'intent': c.intent, 'created_at': c.created_at} for c in qs]
        return Response({'results': data})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def recommendations(request):
    """Simple recommendation: popular services near user."""
    try:
        from apps.services.models import ServiceListing
        from apps.services.serializers import ServiceListingSerializer
        from utils.geo import calculate_distance_km

        lat = float(request.query_params.get('lat', 0))
        lon = float(request.query_params.get('lng', 0))

        services = ServiceListing.objects.filter(status='active').order_by('-average_rating', '-review_count')[:50]
        results = []
        for s in services:
            if s.latitude and s.longitude:
                dist = calculate_distance_km(lat, lon, s.latitude, s.longitude)
                if dist <= 25:
                    s._distance_km = round(dist, 2)
                    results.append(s)
        results.sort(key=lambda x: (-x.average_rating, x._distance_km))
        return Response({'results': ServiceListingSerializer(results[:10], many=True).data})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

