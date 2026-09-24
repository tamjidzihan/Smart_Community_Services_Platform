from rest_framework import serializers
from .models import (
    Hospital,
    HospitalBranch,
    Department,
    Specialist,
    Doctor,
    DoctorHospital,
    DoctorBranch,
    DoctorSchedule,
    DoctorLeave,
    Appointment,
    FavoriteDoctor,
    FavoriteHospital,
    FavoriteDepartment,
)


class SpecialistSerializer(serializers.ModelSerializer):
    doctors_count = serializers.SerializerMethodField()

    class Meta:
        model = Specialist
        fields = ['id', 'name', 'slug', 'description', 'icon', 'image_url', 'status', 'doctors_count']

    def get_doctors_count(self, obj):
        return obj.doctors.filter(is_active=True).count()


class HospitalBranchSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)

    class Meta:
        model = HospitalBranch
        fields = [
            'id', 'hospital', 'hospital_name', 'name', 'address', 'phone', 'telephones',
            'division', 'district', 'city', 'area', 'latitude', 'longitude',
            'opening_hours', 'status', 'created_at', 'updated_at',
        ]


class DepartmentSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    doctors_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id', 'hospital', 'hospital_name', 'name', 'slug', 'description',
            'icon', 'image_url', 'status', 'average_rating', 'review_count',
            'doctors_count', 'created_at', 'updated_at',
        ]

    def get_doctors_count(self, obj):
        return DoctorHospital.objects.filter(department=obj, doctor__is_active=True, status='active').count()


class HospitalSerializer(serializers.ModelSerializer):
    branches_count = serializers.SerializerMethodField()
    departments_count = serializers.SerializerMethodField()
    doctors_count = serializers.SerializerMethodField()
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = Hospital
        fields = [
            'id', 'name', 'slug', 'logo', 'cover_image', 'description', 'hospital_type',
            'phone', 'emergency_phone', 'email', 'website',
            'address', 'division', 'district', 'city', 'area',
            'latitude', 'longitude', 'emergency_available', 'open_24_hours',
            'ambulance_available', 'bed_count', 'available_beds', 'established_year',
            'is_verified', 'status', 'average_rating', 'review_count',
            'branches_count', 'departments_count', 'doctors_count', 'distance_km',
            'created_at', 'updated_at',
        ]

    def get_branches_count(self, obj):
        return obj.branches.filter(status='active').count()

    def get_departments_count(self, obj):
        return obj.departments.filter(status='active').count()

    def get_doctors_count(self, obj):
        return DoctorHospital.objects.filter(hospital=obj, doctor__is_active=True, status='active').values('doctor_id').distinct().count()

    def get_distance_km(self, obj):
        return getattr(obj, '_distance_km', None)


class HospitalDetailSerializer(HospitalSerializer):
    branches = HospitalBranchSerializer(many=True, read_only=True)
    departments = DepartmentSerializer(many=True, read_only=True)

    class Meta(HospitalSerializer.Meta):
        fields = HospitalSerializer.Meta.fields + ['branches', 'departments']


class DoctorScheduleSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    is_overnight = serializers.BooleanField(read_only=True)

    class Meta:
        model = DoctorSchedule
        fields = [
            'id', 'doctor', 'hospital', 'hospital_name', 'branch', 'branch_name',
            'department', 'department_name', 'day_of_week', 'day_name',
            'start_time', 'end_time', 'appointment_type', 'maximum_appointments',
            'status', 'is_overnight', 'created_at',
        ]


class DoctorLeaveSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = DoctorLeave
        fields = [
            'id', 'doctor', 'branch', 'branch_name', 'start_date', 'end_date',
            'message', 'status', 'is_active', 'created_at',
        ]

    def get_is_active(self, obj):
        return obj.is_active_on()


class DoctorHospitalSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_slug = serializers.CharField(source='hospital.slug', read_only=True)
    hospital_logo = serializers.CharField(source='hospital.logo', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_slug = serializers.CharField(source='department.slug', read_only=True)

    class Meta:
        model = DoctorHospital
        fields = [
            'id', 'doctor', 'hospital', 'hospital_name', 'hospital_slug', 'hospital_logo',
            'department', 'department_name', 'department_slug', 'position', 'status',
        ]


class DoctorBranchSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    hospital_name = serializers.CharField(source='branch.hospital.name', read_only=True)
    branch_city = serializers.CharField(source='branch.city', read_only=True)
    branch_address = serializers.CharField(source='branch.address', read_only=True)

    class Meta:
        model = DoctorBranch
        fields = [
            'id', 'doctor', 'branch', 'branch_name', 'hospital_name',
            'branch_city', 'branch_address', 'room_number', 'status',
        ]


class DoctorSerializer(serializers.ModelSerializer):
    specialists = SpecialistSerializer(many=True, read_only=True)
    specialist_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Specialist.objects.all(), source='specialists', write_only=True, required=False
    )
    hospital_affiliations = DoctorHospitalSerializer(many=True, read_only=True)
    branch_affiliations = DoctorBranchSerializer(many=True, read_only=True)
    availability = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = [
            'id', 'full_name', 'profile_image', 'gender', 'mobile', 'email',
            'professional_summary', 'degree_summary', 'experience_summary',
            'current_position', 'education', 'previous_experience',
            'specialists', 'specialist_ids', 'appointment_number',
            'friday_reservation_information', 'additional_information',
            'consultation_fee', 'is_active', 'is_verified', 'average_rating',
            'review_count', 'hospital_affiliations', 'branch_affiliations',
            'availability', 'created_at', 'updated_at',
        ]

    def get_availability(self, obj):
        return obj.get_availability_status()


class DoctorDetailSerializer(DoctorSerializer):
    schedules = DoctorScheduleSerializer(many=True, read_only=True)
    leaves = DoctorLeaveSerializer(many=True, read_only=True)

    class Meta(DoctorSerializer.Meta):
        fields = DoctorSerializer.Meta.fields + ['schedules', 'leaves']


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    doctor_degrees = serializers.CharField(source='doctor.degree_summary', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    citizen_name = serializers.CharField(source='citizen.profile.full_name', read_only=True)
    citizen_email = serializers.CharField(source='citizen.email', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'citizen', 'citizen_name', 'citizen_email', 'doctor', 'doctor_name',
            'doctor_degrees', 'hospital', 'hospital_name', 'branch', 'branch_name',
            'department', 'department_name', 'scheduled_at', 'appointment_type',
            'status', 'reason', 'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'citizen', 'citizen_name', 'citizen_email', 'status', 'created_at', 'updated_at']

    def validate(self, attrs):
        doctor = attrs.get('doctor')
        scheduled_at = attrs.get('scheduled_at')
        if doctor and scheduled_at:
            # Validate Doctor is active
            if not doctor.is_active:
                raise serializers.ValidationError({'doctor': 'This doctor profile is currently inactive.'})
            
            # Validate Leave
            target_date = scheduled_at.date()
            if doctor.get_current_leave(target_date):
                active_leave = doctor.get_current_leave(target_date)
                raise serializers.ValidationError({
                    'scheduled_at': f"Doctor is on leave from {active_leave.start_date} to {active_leave.end_date}."
                })
        return attrs


class FavoriteDoctorSerializer(serializers.ModelSerializer):
    doctor_details = DoctorSerializer(source='doctor', read_only=True)

    class Meta:
        model = FavoriteDoctor
        fields = ['id', 'doctor', 'doctor_details', 'created_at']


class FavoriteHospitalSerializer(serializers.ModelSerializer):
    hospital_details = HospitalSerializer(source='hospital', read_only=True)

    class Meta:
        model = FavoriteHospital
        fields = ['id', 'hospital', 'hospital_details', 'created_at']
