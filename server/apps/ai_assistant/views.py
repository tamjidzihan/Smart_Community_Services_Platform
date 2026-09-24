import json
from django.conf import settings
from django.db.models import Q
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


SYSTEM_PROMPT = """You are the Smart Health AI Assistant for Smart Health Platform.
Your job is to help patients find accredited hospitals, certified doctors, clinical departments, and voluntary blood donors.

Always respond with a JSON object with this exact structure:
{
  "intent": "blood_search|hospital_search|doctor_search|general",
  "entities": {
    "blood_group": null,
    "specialization": null,
    "hospital_category": null,
    "urgency": "normal",
    "radius_km": 15,
    "keyword": null
  },
  "human_response": "A friendly, professional healthcare guidance response to the user in plain text.",
  "confidence": 0.95
}

Examples:
- "find me a dentist" -> intent: "doctor_search", specialization: "Dentist"
- "I need O+ blood donor near me" -> intent: "blood_search", blood_group: "O+"
- "find dental hospital" -> intent: "hospital_search", hospital_category: "dental"
- "cardiologist near me" -> intent: "doctor_search", specialization: "Cardiology"

Specialization mappings:
- "dentist" or "dental" -> "Dentist" or "Dental"
- "heart doctor" or "cardiologist" -> "Cardiology" or "Cardiologist"
- "eye doctor" or "ophthalmologist" -> "Ophthalmology" or "Ophthalmologist"
- "children doctor" or "pediatrician" -> "Pediatrics" or "Pediatrician"

Hospital categories: general, specialized, clinic, diagnostic, pharmacy, dental, eye, maternity

Blood groups: A+, A-, B+, B-, AB+, AB-, O+, O-

Be concise, empathetic, and helpful.
Always respond in valid JSON only — no markdown, no extra text outside the JSON."""


# ─── Database Search Helpers ─────────────────────────────────────────────────

def _execute_blood_search(entities, lat, lon):
    """Search blood donors by blood group + optional geolocation."""
    from apps.blood.models import BloodDonor, COMPATIBLE_DONORS
    from apps.blood.views import BloodDonorSerializer
    from utils.geo import calculate_distance_km

    blood_group = (entities.get('blood_group') or '').upper().strip()
    if not blood_group:
        return {}
    compatible_groups = COMPATIBLE_DONORS.get(blood_group, [blood_group])
    qs = BloodDonor.objects.filter(
        blood_group__in=compatible_groups, is_available=True,
    ).select_related('user__profile')
    radius = entities.get('radius_km') or 15
    results = []
    if lat and lon:
        for donor in qs:
            if donor.latitude and donor.longitude:
                dist = calculate_distance_km(lat, lon, donor.latitude, donor.longitude)
                if dist <= radius:
                    donor._distance_km = round(dist, 2)
                    results.append(donor)
        results.sort(key=lambda x: x._distance_km)
    else:
        results = list(qs[:10])
    return {
        'donors': BloodDonorSerializer(results[:10], many=True).data,
        '_meta': {'result_type': 'blood_donors', 'total_found': len(results),
                  'blood_group_requested': blood_group, 'compatible_groups': compatible_groups},
    }


def _execute_doctor_search(entities, lat, lon):
    """Search doctors by specialization + optional geolocation."""
    from apps.healthcare.models import Doctor
    from apps.healthcare.views import DoctorSerializer
    from utils.geo import calculate_distance_km

    spec = (entities.get('specialization') or '').strip()
    if not spec:
        return {}
    qs = Doctor.objects.filter(
        specialization__icontains=spec, is_available=True,
    ).select_related('hospital').prefetch_related('schedules')
    radius = entities.get('radius_km') or 15
    results = []
    if lat and lon:
        for doc in qs:
            h = doc.hospital
            if h and h.latitude and h.longitude:
                dist = calculate_distance_km(lat, lon, h.latitude, h.longitude)
                if dist <= radius:
                    doc._distance_km = round(dist, 2)
                    results.append(doc)
        results.sort(key=lambda x: getattr(x, '_distance_km', 9999))
    else:
        results = list(qs[:10])
    return {
        'doctors': DoctorSerializer(results[:10], many=True).data,
        '_meta': {'result_type': 'doctors', 'total_found': len(results), 'specialization': spec},
    }


def _execute_hospital_search(entities, lat, lon):
    """Search hospitals by category / keyword / specialization."""
    from apps.healthcare.models import Hospital
    from apps.healthcare.views import HospitalSerializer
    from utils.geo import calculate_distance_km

    category = (entities.get('hospital_category') or '').strip()
    keyword = (entities.get('keyword') or '').strip()
    spec = (entities.get('specialization') or '').strip()
    qs = Hospital.objects.all()
    if category:
        qs = qs.filter(category=category)
    if keyword:
        qs = qs.filter(Q(name__icontains=keyword) | Q(description__icontains=keyword) | Q(address__icontains=keyword))
    if spec and not category and not keyword:
        qs = qs.filter(Q(name__icontains=spec) | Q(description__icontains=spec) | Q(category__icontains=spec))
    radius = entities.get('radius_km') or 15
    results = []
    if lat and lon:
        for h in qs:
            if h.latitude and h.longitude:
                dist = calculate_distance_km(lat, lon, h.latitude, h.longitude)
                if dist <= radius:
                    h._distance_km = round(dist, 2)
                    results.append(h)
        results.sort(key=lambda x: x._distance_km)
    else:
        results = list(qs[:10])
    return {
        'hospitals': HospitalSerializer(results[:10], many=True).data,
        '_meta': {'result_type': 'hospitals', 'total_found': len(results),
                  'category': category, 'keyword': keyword or spec},
    }


def _execute_ambulance_search(lat, lon, entities):
    """Find available ambulances near the user's location."""
    from apps.ambulance.models import Ambulance
    from apps.ambulance.serializers import AmbulanceSerializer
    from utils.geo import calculate_distance_km

    if not lat or not lon:
        return {}
    ambulances = Ambulance.objects.filter(is_active=True, status='available')
    results = []
    for a in ambulances:
        if a.current_latitude and a.current_longitude:
            dist = calculate_distance_km(lat, lon, a.current_latitude, a.current_longitude)
            if dist <= 20:
                a._distance_km = round(dist, 2)
                results.append(a)
    results.sort(key=lambda x: x._distance_km)
    return {
        'ambulances': AmbulanceSerializer(results[:5], many=True).data,
        '_meta': {'result_type': 'ambulances', 'total_found': len(results),
                  'urgency': entities.get('urgency', 'normal')},
    }


def _run_db_query(intent, entities, lat, lon):
    """Dispatch intent to the right DB search helper."""
    try:
        if intent == 'blood_search' and entities.get('blood_group'):
            return _execute_blood_search(entities, lat, lon)
        if intent == 'doctor_search' and entities.get('specialization'):
            return _execute_doctor_search(entities, lat, lon)
        if intent == 'hospital_search':
            return _execute_hospital_search(entities, lat, lon)
    except Exception as e:
        return {'_error': str(e)}
    return {}


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
        return Response({
            'session_id': session_id,
            'intent': 'general',
            'human_response': f'I received your message: "{message}". Please configure GEMINI_API_KEY for full AI functionality.',
            'entities': {},
            'data': {},
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
        if request.user and request.user.is_authenticated:
            try:
                from apps.ai_assistant.models import AIConversation
                AIConversation.objects.create(user=request.user, session_id=session_id,
                                             role='user', content=message, intent=result.get('intent', ''))
                AIConversation.objects.create(user=request.user, session_id=session_id,
                                             role='assistant', content=result.get('human_response', ''),
                                             intent=result.get('intent', ''))
            except Exception:
                pass

        # Execute DB search based on the detected intent
        intent = result.get('intent', 'general')
        entities = result.get('entities', {})
        db_data = _run_db_query(intent, entities, lat, lon)

        # Build human-readable response with result counts
        human_response = result.get('human_response', '')
        meta = db_data.pop('_meta', {})
        total = meta.get('total_found', 0)

        if total == 0 and intent != 'general':
            human_response += f"\n\nI searched our database but couldn't find any matching results right now. Please try broadening your search or check back later."

        return Response({
            'session_id': session_id,
            'intent': intent,
            'human_response': human_response,
            'entities': entities,
            'confidence': result.get('confidence', 0.8),
            'data': db_data,
            'total_found': total,
        })

    except Exception as e:
        return Response({
            'session_id': session_id,
            'intent': 'general',
            'human_response': 'Sorry, I encountered an error. Please try again.',
            'entities': {},
            'data': {},
            'error': str(e),
        }, status=500)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def chat_history(request):
    try:
        from apps.ai_assistant.models import AIConversation
        from django.db.models import Max, Count
        session_id = request.query_params.get('session_id')

        if session_id:
            # Return messages for a specific session
            qs = AIConversation.objects.filter(
                user=request.user, session_id=session_id,
            ).order_by('created_at')
            data = [{
                'role': c.role, 'content': c.content,
                'intent': c.intent, 'created_at': c.created_at,
                'session_id': c.session_id,
            } for c in qs]
            return Response({'results': data})

        # No session_id → return list of recent sessions with preview
        sessions = (
            AIConversation.objects
            .filter(user=request.user)
            .values('session_id')
            .annotate(
                last_message_at=Max('created_at'),
                message_count=Count('id'),
            )
            .order_by('-last_message_at')[:20]
        )

        session_list = []
        for s in sessions:
            last_msg = (
                AIConversation.objects
                .filter(user=request.user, session_id=s['session_id'], role='user')
                .order_by('-created_at')
                .first()
            )
            session_list.append({
                'session_id': s['session_id'],
                'last_message_at': s['last_message_at'],
                'message_count': s['message_count'],
                'preview': last_msg.content[:80] if last_msg else 'Conversation',
            })

        return Response({'sessions': session_list})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def recommendations(request):
    """Simple recommendation: popular doctors and hospitals."""
    try:
        from apps.healthcare.models import Doctor, Hospital
        from apps.healthcare.views import DoctorSerializer, HospitalSerializer

        doctors = Doctor.objects.filter(is_active=True).order_by('-average_rating')[:5]
        hospitals = Hospital.objects.filter(is_active=True).order_by('-average_rating')[:5]
        return Response({
            'doctors': DoctorSerializer(doctors, many=True).data,
            'hospitals': HospitalSerializer(hospitals, many=True).data,
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)

