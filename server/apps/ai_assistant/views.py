import json
import logging
from django.conf import settings
from django.db.models import Q, Max, Count
from rest_framework import permissions, serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


class ChatMessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=1500)
    session_id = serializers.CharField(max_length=100, required=False, allow_blank=True)
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)


SYSTEM_PROMPT = """You are the Senior Clinical Intelligence & Healthcare Navigator AI for the Smart Health Platform in Bangladesh.
Your mission is to provide empathetic, professional medical guidance for any health problem or query, and precisely extract healthcare navigation parameters to query our live database of 1,000+ Doctors, 225+ Hospitals, and 1,000+ Blood Donors across Dhaka.

When a user presents symptoms or health problems:
1. Analyze the symptoms carefully and outline potential clinical concerns in your response.
2. Provide practical first-aid / home precautions and red-flag warning signs (when to seek immediate emergency care).
3. Identify the EXACT medical departments and specialist categories they should consult.
4. Extract structured entities to retrieve real doctors, hospitals, and blood donors from our database.

Always respond in a single valid JSON object with this exact structure:
{
  "intent": "medical_solution|doctor_search|hospital_search|blood_search|emergency",
  "urgency": "critical|high|medium|normal",
  "entities": {
    "symptoms": ["chest pain", "dizziness"],
    "departments": ["Cardiology", "Medicine"],
    "specialties": ["Cardiologist", "General Physician"],
    "area": "Dhanmondi|Uttara|Panthapath|Gulshan|Mirpur|etc (or null)",
    "hospital_name": null,
    "blood_group": "A+|B+|O+|AB+|A-|B-|O-|AB-|null",
    "doctor_name": null,
    "keyword": null
  },
  "clinical_assessment": {
    "summary": "Brief 1-2 sentence medical summary of the condition",
    "primary_specialty": "Cardiology",
    "precautions": ["Rest immediately in an upright position", "Avoid heavy meals or exertion", "Monitor blood pressure"],
    "emergency_warning": "Seek immediate emergency room care if chest tightness radiates to left arm, jaw, or is accompanied by cold sweat."
  },
  "human_response": "A comprehensive, highly empathetic, professional medical advice in clear language (plain text or markdown). Explain what might be happening, recommended care steps, what kind of doctor to consult, and encourage booking an appointment with the matched doctors or visiting the hospitals listed below.",
  "confidence": 0.95
}

Dhaka Areas available in DB: Dhanmondi, Gulshan 1, Gulshan 2, Banani, Uttara Sector 3, Uttara Sector 7, Uttara Sector 11, Mohakhali, Panthapath, Green Road, Shahbagh, Mirpur 1, Mirpur 2, Mirpur 10, Mirpur 12, Shyamoli, Mohammadpur, Badda, Bashundhara R/A, Baridhara, Motijheel, Old Dhaka (Mitford), Wari, Malibagh, Mogbazar, Kakrail, Tejgaon, Farmgate, Rampura, Khilgaon, Jatrabari, Kurmitola, Savar.

Major Departments available in DB: Cardiology, Neurology, Nephrology, Orthopedics, Pediatrics, Gynecology & Obstetrics, Dermatology, Gastroenterology, General Surgery, Internal Medicine, Oncology, Urology, Ophthalmology, ENT & Head Neck Surgery, Psychiatry, Endocrinology, Pulmonology & Chest Medicine.

Always respond in valid JSON only — no text outside the JSON object."""


# ─── Comprehensive Symptom & Specialty Mapping (for AI & Heuristic Fallback) ──
SYMPTOM_CLINICAL_MAP = {
    'chest pain': {'depts': ['Cardiology', 'Pulmonology & Chest Medicine', 'Internal Medicine'], 'urgency': 'critical', 'spec': 'Cardiology'},
    'heart': {'depts': ['Cardiology', 'Internal Medicine'], 'urgency': 'high', 'spec': 'Cardiology'},
    'palpitation': {'depts': ['Cardiology', 'Internal Medicine'], 'urgency': 'high', 'spec': 'Cardiology'},
    'blood pressure': {'depts': ['Cardiology', 'Internal Medicine', 'Nephrology'], 'urgency': 'medium', 'spec': 'Cardiology'},
    'headache': {'depts': ['Neurology', 'Internal Medicine', 'Ophthalmology'], 'urgency': 'medium', 'spec': 'Neurology'},
    'stroke': {'depts': ['Neurology', 'Internal Medicine'], 'urgency': 'critical', 'spec': 'Neurology'},
    'dizziness': {'depts': ['Neurology', 'ENT & Head Neck Surgery', 'Internal Medicine'], 'urgency': 'medium', 'spec': 'Neurology'},
    'seizure': {'depts': ['Neurology', 'Internal Medicine'], 'urgency': 'critical', 'spec': 'Neurology'},
    'kidney': {'depts': ['Nephrology', 'Urology', 'Internal Medicine'], 'urgency': 'high', 'spec': 'Nephrology'},
    'urine': {'depts': ['Urology', 'Nephrology'], 'urgency': 'medium', 'spec': 'Urology'},
    'back pain': {'depts': ['Orthopedics', 'Neurology', 'Internal Medicine'], 'urgency': 'medium', 'spec': 'Orthopedics'},
    'bone': {'depts': ['Orthopedics', 'General Surgery'], 'urgency': 'medium', 'spec': 'Orthopedics'},
    'joint': {'depts': ['Orthopedics', 'Internal Medicine'], 'urgency': 'medium', 'spec': 'Orthopedics'},
    'fracture': {'depts': ['Orthopedics', 'General Surgery'], 'urgency': 'critical', 'spec': 'Orthopedics'},
    'baby': {'depts': ['Pediatrics'], 'urgency': 'high', 'spec': 'Pediatrics'},
    'child': {'depts': ['Pediatrics'], 'urgency': 'high', 'spec': 'Pediatrics'},
    'infant': {'depts': ['Pediatrics'], 'urgency': 'high', 'spec': 'Pediatrics'},
    'pregnancy': {'depts': ['Gynecology & Obstetrics'], 'urgency': 'high', 'spec': 'Gynecology & Obstetrics'},
    'pregnant': {'depts': ['Gynecology & Obstetrics'], 'urgency': 'high', 'spec': 'Gynecology & Obstetrics'},
    'period': {'depts': ['Gynecology & Obstetrics'], 'urgency': 'medium', 'spec': 'Gynecology & Obstetrics'},
    'skin': {'depts': ['Dermatology'], 'urgency': 'medium', 'spec': 'Dermatology'},
    'rash': {'depts': ['Dermatology', 'Internal Medicine'], 'urgency': 'medium', 'spec': 'Dermatology'},
    'allergy': {'depts': ['Dermatology', 'Pulmonology & Chest Medicine', 'Internal Medicine'], 'urgency': 'medium', 'spec': 'Dermatology'},
    'stomach': {'depts': ['Gastroenterology', 'General Surgery', 'Internal Medicine'], 'urgency': 'medium', 'spec': 'Gastroenterology'},
    'gastric': {'depts': ['Gastroenterology', 'Internal Medicine'], 'urgency': 'normal', 'spec': 'Gastroenterology'},
    'liver': {'depts': ['Gastroenterology', 'Internal Medicine'], 'urgency': 'high', 'spec': 'Gastroenterology'},
    'vomiting': {'depts': ['Gastroenterology', 'Internal Medicine', 'Pediatrics'], 'urgency': 'medium', 'spec': 'Gastroenterology'},
    'diarrhea': {'depts': ['Gastroenterology', 'Internal Medicine', 'Pediatrics'], 'urgency': 'medium', 'spec': 'Gastroenterology'},
    'fever': {'depts': ['Internal Medicine', 'Pediatrics'], 'urgency': 'medium', 'spec': 'Internal Medicine'},
    'diabetes': {'depts': ['Endocrinology', 'Internal Medicine'], 'urgency': 'medium', 'spec': 'Endocrinology'},
    'thyroid': {'depts': ['Endocrinology', 'ENT & Head Neck Surgery', 'Internal Medicine'], 'urgency': 'medium', 'spec': 'Endocrinology'},
    'cough': {'depts': ['Pulmonology & Chest Medicine', 'Internal Medicine', 'Pediatrics'], 'urgency': 'medium', 'spec': 'Pulmonology & Chest Medicine'},
    'asthma': {'depts': ['Pulmonology & Chest Medicine', 'Pediatrics'], 'urgency': 'high', 'spec': 'Pulmonology & Chest Medicine breathing'},
    'breathing': {'depts': ['Pulmonology & Chest Medicine', 'Cardiology', 'Internal Medicine'], 'urgency': 'critical', 'spec': 'Pulmonology & Chest Medicine'},
    'eye': {'depts': ['Ophthalmology'], 'urgency': 'medium', 'spec': 'Ophthalmology'},
    'vision': {'depts': ['Ophthalmology'], 'urgency': 'medium', 'spec': 'Ophthalmology'},
    'ear': {'depts': ['ENT & Head Neck Surgery'], 'urgency': 'medium', 'spec': 'ENT & Head Neck Surgery'},
    'throat': {'depts': ['ENT & Head Neck Surgery', 'Internal Medicine'], 'urgency': 'medium', 'spec': 'ENT & Head Neck Surgery'},
    'depression': {'depts': ['Psychiatry'], 'urgency': 'medium', 'spec': 'Psychiatry'},
    'anxiety': {'depts': ['Psychiatry', 'Internal Medicine'], 'urgency': 'medium', 'spec': 'Psychiatry'},
    'cancer': {'depts': ['Oncology', 'General Surgery', 'Internal Medicine'], 'urgency': 'high', 'spec': 'Oncology'},
    'tumor': {'depts': ['Oncology', 'General Surgery'], 'urgency': 'high', 'spec': 'Oncology'},
}


# ─── Full Database Search Dispatcher ───

def _execute_full_database_search(entities, lat=None, lon=None):
    """
    Executes a multi-dimensional live database query across:
    1. Doctors (matching departments, specialists, qualifications, areas, names)
    2. Hospitals (matching departments, areas, emergency beds, names)
    3. Blood Donors (matching compatible blood groups, areas)
    4. Active Emergency Blood Requests
    """
    from apps.healthcare.models import Doctor, Hospital, Department
    from apps.blood.models import BloodDonor, BloodRequest, COMPATIBLE_DONORS
    from utils.geo import calculate_distance_km

    results = {
        'doctors': [],
        'hospitals': [],
        'donors': [],
        'blood_requests': [],
        'departments': [],
    }

    depts = entities.get('departments') or []
    specialties = entities.get('specialties') or []
    area = (entities.get('area') or '').strip()
    doctor_name = (entities.get('doctor_name') or '').strip()
    hospital_name = (entities.get('hospital_name') or '').strip()
    blood_group = (entities.get('blood_group') or '').upper().strip()
    keyword = (entities.get('keyword') or '').strip()

    # 1. Query Doctors
    doc_q = Q(is_active=True)
    dept_filters = Q()
    for d in depts:
        dept_filters |= Q(hospital_affiliations__department__name__icontains=d)
        dept_filters |= Q(specialists__name__icontains=d)
        dept_filters |= Q(degree_summary__icontains=d)
        dept_filters |= Q(professional_summary__icontains=d)
    
    for s in specialties:
        dept_filters |= Q(specialists__name__icontains=s)
        dept_filters |= Q(current_position__icontains=s)
        dept_filters |= Q(degree_summary__icontains=s)

    if dept_filters:
        doc_q &= dept_filters

    if doctor_name:
        doc_q &= Q(full_name__icontains=doctor_name)

    if area:
        doc_q &= (Q(hospital_affiliations__hospital__area__icontains=area) |
                  Q(hospital_affiliations__hospital__address__icontains=area))

    if keyword:
        doc_q &= (Q(full_name__icontains=keyword) |
                  Q(degree_summary__icontains=keyword) |
                  Q(professional_summary__icontains=keyword))

    doctor_qs = Doctor.objects.filter(doc_q).distinct().prefetch_related(
        'hospital_affiliations__hospital',
        'hospital_affiliations__department',
        'schedules',
        'specialists'
    ).order_by('-average_rating', '-review_count')[:6]

    # Fallback to top rated doctors in matching departments if no direct area match
    if not doctor_qs.exists() and dept_filters:
        doctor_qs = Doctor.objects.filter(Q(is_active=True) & dept_filters).distinct().prefetch_related(
            'hospital_affiliations__hospital',
            'hospital_affiliations__department',
            'schedules',
            'specialists'
        ).order_by('-average_rating')[:6]

    for doc in doctor_qs:
        aff = doc.hospital_affiliations.first()
        hosp = aff.hospital if aff else None
        dept = aff.department if aff else None
        schedules = [
            f"{s.get_day_of_week_display()}: {s.start_time.strftime('%I:%M %p')} - {s.end_time.strftime('%I:%M %p')}"
            for s in doc.schedules.all()[:3]
        ]
        results['doctors'].append({
            'id': doc.id,
            'full_name': doc.full_name,
            'degree_summary': doc.degree_summary,
            'current_position': doc.current_position,
            'specialization': doc.specialists.first().name if doc.specialists.exists() else (dept.name if dept else 'Specialist'),
            'hospital_name': hosp.name if hosp else 'Affiliated Hospital',
            'hospital_id': hosp.id if hosp else None,
            'hospital_area': hosp.area if hosp else 'Dhaka',
            'department_name': dept.name if dept else 'Clinical Care',
            'consultation_fee': doc.consultation_fee,
            'average_rating': doc.average_rating,
            'review_count': doc.review_count,
            'appointment_number': doc.appointment_number,
            'schedules': schedules,
        })

    # 2. Query Hospitals
    hosp_q = Q(status='active')
    hosp_filters = Q()
    for d in depts:
        hosp_filters |= Q(departments__name__icontains=d)
    
    if hosp_filters:
        hosp_q &= hosp_filters

    if area:
        hosp_q &= (Q(area__icontains=area) | Q(address__icontains=area))

    if hospital_name:
        hosp_q &= Q(name__icontains=hospital_name)

    hospital_qs = Hospital.objects.filter(hosp_q).distinct().prefetch_related('departments').order_by('-average_rating')[:4]
    if not hospital_qs.exists():
        fallback_q = Q(status='active', emergency_available=True)
        if area:
            fallback_q &= (Q(area__icontains=area) | Q(address__icontains=area))
        hospital_qs = Hospital.objects.filter(fallback_q).order_by('-average_rating')[:4]

    for h in hospital_qs:
        dist = None
        if lat and lon and h.latitude and h.longitude:
            dist = round(calculate_distance_km(lat, lon, h.latitude, h.longitude), 2)
        results['hospitals'].append({
            'id': h.id,
            'name': h.name,
            'hospital_type': h.hospital_type,
            'address': h.address,
            'area': h.area,
            'phone': h.phone,
            'emergency_phone': h.emergency_phone,
            'available_beds': h.available_beds,
            'bed_count': h.bed_count,
            'emergency_available': h.emergency_available,
            'average_rating': h.average_rating,
            'website': h.website,
            'distance_km': dist,
            'departments': [d.name for d in h.departments.all()[:5]],
        })

    # 3. Query Blood Donors (if blood is relevant)
    if blood_group:
        compat_groups = COMPATIBLE_DONORS.get(blood_group, [blood_group])
        donor_q = Q(is_available=True, blood_group__in=compat_groups)
        if area:
            donor_q &= (Q(user__profile__address__icontains=area))

        donor_qs = BloodDonor.objects.filter(donor_q).select_related('user__profile')[:6]
        if not donor_qs.exists():
            donor_qs = BloodDonor.objects.filter(is_available=True, blood_group__in=compat_groups).select_related('user__profile')[:6]

        for donor in donor_qs:
            prof = getattr(donor.user, 'profile', None)
            dist = None
            if lat and lon and donor.latitude and donor.longitude:
                dist = round(calculate_distance_km(lat, lon, donor.latitude, donor.longitude), 2)
            results['donors'].append({
                'id': donor.id,
                'full_name': prof.full_name if prof else 'Voluntary Donor',
                'blood_group': donor.blood_group,
                'phone': prof.phone if prof else '+8801700000000',
                'address': prof.address if prof else 'Dhaka',
                'is_available': donor.is_available,
                'distance_km': dist,
            })

    # 4. Active Blood Requests
    if blood_group or 'blood' in (entities.get('keyword') or '').lower():
        req_qs = BloodRequest.objects.filter(status__in=['open', 'partially_fulfilled']).order_by('-created_at')[:3]
        for req in req_qs:
            results['blood_requests'].append({
                'id': req.id,
                'patient_name': req.patient_name,
                'hospital_name': req.hospital_name,
                'blood_group': req.blood_group,
                'units_needed': req.units_needed,
                'urgency': req.urgency,
                'notes': req.notes,
            })

    return results


def _build_heuristic_solution(message, lat=None, lon=None):
    """
    Intelligent medical triage & keyword extractor when Gemini API is offline/quota-limited.
    """
    msg_lower = message.lower()
    matched_depts = []
    matched_specialties = []
    urgency = 'normal'
    primary_spec = 'General Medicine'

    for kw, val in SYMPTOM_CLINICAL_MAP.items():
        if kw in msg_lower:
            matched_depts.extend(val['depts'])
            matched_specialties.append(val['spec'])
            if val['urgency'] in ['critical', 'high']:
                urgency = val['urgency']
            primary_spec = val['spec']

    # Extract Dhaka Area
    DHAKA_AREAS = [
        "dhanmondi", "gulshan", "banani", "uttara", "mohakhali", "panthapath",
        "green road", "shahbagh", "mirpur", "shyamoli", "mohammadpur", "badda",
        "bashundhara", "baridhara", "motijheel", "wari", "malibagh", "mogbazar",
        "kakrail", "tejgaon", "farmgate", "rampura", "khilgaon", "jatrabari", "savar"
    ]
    detected_area = None
    for a in DHAKA_AREAS:
        if a in msg_lower:
            detected_area = a.capitalize()
            break

    # Extract Blood Group
    import re
    bg_match = re.search(r'\b(a|b|ab|o)[+-]\b', msg_lower)
    blood_group = bg_match.group(0).upper() if bg_match else None

    # Deduplicate depts
    seen = set()
    unique_depts = []
    for d in matched_depts:
        if d not in seen:
            seen.add(d)
            unique_depts.append(d)

    if not unique_depts:
        unique_depts = ["Internal Medicine"]

    entities = {
        'symptoms': [message[:100]],
        'departments': unique_depts,
        'specialties': matched_specialties or [primary_spec],
        'area': detected_area,
        'blood_group': blood_group,
        'doctor_name': None,
        'hospital_name': None,
        'keyword': message[:60],
    }

    db_data = _execute_full_database_search(entities, lat, lon)

    # Construct professional clinical human response
    advice_lines = [
        f"### 🩺 Clinical Triage & Guidance",
        f"Based on your query regarding **\"{message}\"**, here is the recommended healthcare plan:",
        f"- **Primary Specialty to Consult:** `{primary_spec}` (Department of {unique_depts[0]})",
        f"- **Urgency Assessment:** `{urgency.upper()}` priority",
        "",
        "#### 💡 Important Care Instructions & Precautions:",
        "- Please monitor vitals (temperature, blood pressure, or pain intensity).",
        "- Keep all previous prescriptions, medical test reports, and allergy histories ready.",
        "- Avoid self-medicating with antibiotics or sedatives without a physician's prescription.",
    ]
    if urgency == 'critical':
        advice_lines.append("\n⚠️ **EMERGENCY WARNING:** If you experience severe chest distress, sudden shortness of breath, or loss of consciousness, please visit the nearest 24/7 emergency department immediately or call an emergency hotline.")

    advice_lines.append("\n### 🏥 Live Database Matches from Smart Health Network:")
    if db_data['doctors']:
        advice_lines.append(f"We found **{len(db_data['doctors'])} verified specialist doctors** ready for appointment bookings:")
        for doc in db_data['doctors'][:3]:
            advice_lines.append(f"• **Dr. {doc['full_name']}** — *{doc['specialization']}* at **{doc['hospital_name']}** ({doc['hospital_area']}) | Fee: ৳{doc['consultation_fee']} | Chamber: {doc['appointment_number']}")

    if db_data['hospitals']:
        advice_lines.append(f"\n**Top Accredited Hospitals Available:**")
        for hosp in db_data['hospitals'][:2]:
            advice_lines.append(f"• **{hosp['name']}** ({hosp['area']}) — 📞 Emergency: {hosp['emergency_phone']} | Available Beds: {hosp['available_beds']}")

    if db_data['donors']:
        advice_lines.append(f"\n**Compatible Blood Donors Available ({blood_group}):**")
        for don in db_data['donors'][:2]:
            advice_lines.append(f"• **{don['full_name']}** ({don['blood_group']}) — 📞 {don['phone']}")

    return {
        'intent': 'medical_solution',
        'urgency': urgency,
        'entities': entities,
        'clinical_assessment': {
            'summary': f"Clinical inquiry related to {primary_spec}",
            'primary_specialty': primary_spec,
            'precautions': [
                'Rest and monitor symptoms closely',
                'Avoid strenuous activities',
                'Consult verified doctor for thorough diagnostic evaluation'
            ],
            'emergency_warning': 'Proceed to nearest emergency room if symptoms suddenly escalate.'
        },
        'human_response': "\n".join(advice_lines),
        'confidence': 0.90,
        'data': db_data,
    }


# ─── Main AI Assistant Endpoint ───

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def chat(request):
    """
    Protected AI Chat endpoint.
    Provides complete medical triage solutions and full live access to Doctors, Hospitals, and Blood Donors database.
    """
    serializer = ChatMessageSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    message = serializer.validated_data['message'].strip()
    session_id = serializer.validated_data.get('session_id') or 'session_default'
    lat = serializer.validated_data.get('latitude')
    lon = serializer.validated_data.get('longitude')

    if not message:
        return Response({'error': 'Message cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)

    ai_result = None

    # 1. Attempt Gemini 2.5 Flash if API Key is configured
    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            user_context = f"User health inquiry: {message}"
            if lat and lon:
                user_context += f"\nUser coordinates: lat={lat}, lng={lon}"

            config = types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                max_output_tokens=1500,
                temperature=0.3,
            )

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=user_context,
                config=config,
            )

            raw = response.text
            ai_result = json.loads(raw)
        except Exception as e:
            logger.warning(f"Gemini API invocation fallback: {e}")
            ai_result = None

    # 2. If Gemini didn't return or failed, run our robust clinical heuristic solution
    if not ai_result or not isinstance(ai_result, dict):
        ai_result = _build_heuristic_solution(message, lat, lon)
    else:
        # Gemini returned structured entities; now execute the live database query
        entities = ai_result.get('entities', {})
        db_data = _execute_full_database_search(entities, lat, lon)
        ai_result['data'] = db_data

    # 3. Save conversation history for the authenticated user
    try:
        from apps.ai_assistant.models import AIConversation
        AIConversation.objects.create(
            user=request.user,
            session_id=session_id,
            role='user',
            content=message,
            intent=ai_result.get('intent', 'medical_solution')
        )
        AIConversation.objects.create(
            user=request.user,
            session_id=session_id,
            role='assistant',
            content=ai_result.get('human_response', ''),
            intent=ai_result.get('intent', 'medical_solution')
        )
    except Exception as e:
        logger.error(f"Error persisting AIConversation: {e}")

    total_doctors = len(ai_result.get('data', {}).get('doctors', []))
    total_hospitals = len(ai_result.get('data', {}).get('hospitals', []))
    total_donors = len(ai_result.get('data', {}).get('donors', []))

    return Response({
        'session_id': session_id,
        'intent': ai_result.get('intent', 'medical_solution'),
        'urgency': ai_result.get('urgency', 'normal'),
        'clinical_assessment': ai_result.get('clinical_assessment', {}),
        'human_response': ai_result.get('human_response', ''),
        'entities': ai_result.get('entities', {}),
        'confidence': ai_result.get('confidence', 0.95),
        'data': ai_result.get('data', {}),
        'summary_counts': {
            'doctors': total_doctors,
            'hospitals': total_hospitals,
            'donors': total_donors,
        }
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def chat_history(request):
    """Retrieve chat history / sessions for the logged-in user."""
    try:
        from apps.ai_assistant.models import AIConversation
        session_id = request.query_params.get('session_id')

        if session_id:
            qs = AIConversation.objects.filter(
                user=request.user, session_id=session_id,
            ).order_by('created_at')
            data = [{
                'role': c.role,
                'content': c.content,
                'intent': c.intent,
                'created_at': c.created_at,
                'session_id': c.session_id,
            } for c in qs]
            return Response({'results': data})

        sessions = (
            AIConversation.objects
            .filter(user=request.user)
            .values('session_id')
            .annotate(
                last_message_at=Max('created_at'),
                message_count=Count('id'),
            )
            .order_by('-last_message_at')[:30]
        )

        session_list = []
        for s in sessions:
            first_msg = (
                AIConversation.objects
                .filter(user=request.user, session_id=s['session_id'], role='user')
                .order_by('created_at')
                .first()
            )
            if not first_msg:
                first_msg = (
                    AIConversation.objects
                    .filter(user=request.user, session_id=s['session_id'])
                    .order_by('created_at')
                    .first()
                )

            preview = first_msg.content[:65] if first_msg else 'Consultation'
            session_list.append({
                'session_id': s['session_id'],
                'last_message_at': s['last_message_at'],
                'message_count': s['message_count'],
                'preview': preview,
            })

        return Response({'sessions': session_list})
    except Exception as e:
        logger.error(f"Error retrieving chat_history: {e}")
        return Response({'sessions': [], 'error': str(e)}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def recommendations(request):
    """Top medical recommendations for the authenticated user."""
    try:
        from apps.healthcare.models import Doctor, Hospital
        from apps.healthcare.views import DoctorSerializer, HospitalSerializer

        doctors = Doctor.objects.filter(is_active=True).order_by('-average_rating')[:6]
        hospitals = Hospital.objects.filter(status='active').order_by('-average_rating')[:6]
        return Response({
            'doctors': DoctorSerializer(doctors, many=True).data,
            'hospitals': HospitalSerializer(hospitals, many=True).data,
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
