import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.text import slugify

User = get_user_model()


class Hospital(models.Model):
    HOSPITAL_TYPES = [
        ('general', 'General Hospital'),
        ('specialized', 'Specialized Hospital'),
        ('clinic', 'Clinic'),
        ('diagnostic', 'Diagnostic Center'),
        ('dental', 'Dental Clinic'),
        ('eye', 'Eye Hospital'),
        ('maternity', 'Maternity Hospital'),
        ('tertiary', 'Tertiary Care Hospital'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('pending', 'Pending Approval'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    logo = models.URLField(blank=True)
    cover_image = models.URLField(blank=True)
    description = models.TextField(blank=True)
    hospital_type = models.CharField(max_length=30, choices=HOSPITAL_TYPES, default='general', db_index=True)
    
    # Contact
    phone = models.CharField(max_length=30, blank=True)
    emergency_phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    
    # Location
    address = models.TextField()
    division = models.CharField(max_length=100, blank=True, db_index=True)
    district = models.CharField(max_length=100, blank=True, db_index=True)
    city = models.CharField(max_length=100, blank=True, db_index=True)
    area = models.CharField(max_length=150, blank=True, db_index=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    # Healthcare Capabilities
    emergency_available = models.BooleanField(default=False, db_index=True)
    open_24_hours = models.BooleanField(default=False, db_index=True)
    ambulance_available = models.BooleanField(default=False)
    bed_count = models.PositiveIntegerField(default=0)
    available_beds = models.PositiveIntegerField(default=0)
    established_year = models.IntegerField(null=True, blank=True)
    
    # Verification & Ratings
    is_verified = models.BooleanField(default=False, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', db_index=True)
    average_rating = models.FloatField(default=0.0, db_index=True)
    review_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hospitals'
        ordering = ['-average_rating', 'name']
        indexes = [
            models.Index(fields=['emergency_available', 'hospital_type']),
            models.Index(fields=['city', 'area']),
            models.Index(fields=['status', 'is_verified']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Hospital.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class HospitalBranch(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=200)
    address = models.TextField()
    phone = models.CharField(max_length=30, blank=True)
    telephones = models.CharField(max_length=200, blank=True, help_text="Comma-separated contact numbers")
    division = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    area = models.CharField(max_length=150, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    opening_hours = models.CharField(max_length=200, blank=True, default='24/7')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hospital_branches'
        ordering = ['name']
        indexes = [
            models.Index(fields=['hospital', 'status']),
            models.Index(fields=['city', 'area']),
        ]

    def __str__(self):
        return f"{self.hospital.name} — {self.name}"


class Department(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=150, db_index=True)
    slug = models.SlugField(max_length=180, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True, help_text="Icon identifier or icon URL")
    image_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    average_rating = models.FloatField(default=0.0)
    review_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hospital_departments'
        ordering = ['name']
        unique_together = ['hospital', 'slug']
        indexes = [
            models.Index(fields=['hospital', 'status']),
            models.Index(fields=['name']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Department.objects.filter(hospital=self.hospital, slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.hospital.name} — {self.name}"


class Specialist(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, unique=True, db_index=True)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True)
    image_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'specialists'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Doctor(models.Model):
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='doctor_profile')
    
    # Personal
    full_name = models.CharField(max_length=150, db_index=True)
    profile_image = models.URLField(blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    mobile = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    
    # Professional Qualifications
    professional_summary = models.TextField(blank=True)
    degree_summary = models.TextField(blank=True, help_text="e.g. MBBS, MD (Internal Medicine), FCPS")
    experience_summary = models.TextField(blank=True)
    current_position = models.CharField(max_length=250, blank=True, help_text="e.g. Professor, Department of Medicine")
    education = models.TextField(blank=True, help_text="Detailed academic background")
    previous_experience = models.TextField(blank=True, help_text="Past clinical/hospital positions")
    
    # Relationships
    specialists = models.ManyToManyField(Specialist, blank=True, related_name='doctors')
    
    # Additional Booking & Reservation info
    appointment_number = models.CharField(max_length=100, blank=True)
    friday_reservation_information = models.TextField(blank=True)
    additional_information = models.TextField(blank=True)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True, db_index=True)
    is_verified = models.BooleanField(default=False, db_index=True)
    average_rating = models.FloatField(default=0.0, db_index=True)
    review_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'doctors'
        ordering = ['-average_rating', 'full_name']
        indexes = [
            models.Index(fields=['full_name']),
            models.Index(fields=['is_active', 'is_verified']),
        ]

    def __str__(self):
        return self.full_name

    def get_current_leave(self, target_date=None):
        if target_date is None:
            target_date = timezone.now().date()
        return self.leaves.filter(
            status='active',
            start_date__lte=target_date,
            end_date__gte=target_date
        ).first()

    def get_availability_status(self, target_date=None):
        if not self.is_active:
            return {
                'status': 'INACTIVE',
                'label': 'Inactive',
                'is_available': False,
                'message': 'Doctor profile is currently inactive.',
            }
        if target_date is None:
            target_date = timezone.now().date()
        
        # Check leave
        active_leave = self.get_current_leave(target_date)
        if active_leave:
            return {
                'status': 'ON_LEAVE',
                'label': 'On Leave',
                'is_available': False,
                'leave_from': active_leave.start_date,
                'leave_to': active_leave.end_date,
                'message': active_leave.message or f"On leave until {active_leave.end_date.strftime('%d %B %Y')}",
            }
        
        # Check schedules for target day
        day_of_week = target_date.weekday()  # 0=Monday, 6=Sunday
        schedules = self.schedules.filter(day_of_week=day_of_week, status='active')
        if not schedules.exists():
            return {
                'status': 'NOT_SCHEDULED_TODAY',
                'label': 'Not Available Today',
                'is_available': False,
                'message': 'No scheduled practice hours today.',
            }
        
        return {
            'status': 'AVAILABLE_TODAY',
            'label': 'Available Today',
            'is_available': True,
            'message': 'Available for appointments today.',
        }


class DoctorHospital(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='hospital_affiliations')
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='doctor_affiliations')
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL, related_name='doctor_affiliations')
    position = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'doctor_hospitals'
        unique_together = ['doctor', 'hospital', 'department']
        indexes = [
            models.Index(fields=['doctor', 'hospital']),
            models.Index(fields=['hospital', 'department']),
        ]

    def __str__(self):
        dept_str = f" ({self.department.name})" if self.department else ""
        return f"{self.doctor.full_name} at {self.hospital.name}{dept_str}"


class DoctorBranch(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='branch_affiliations')
    branch = models.ForeignKey(HospitalBranch, on_delete=models.CASCADE, related_name='doctor_affiliations')
    room_number = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'doctor_branches'
        unique_together = ['doctor', 'branch']

    def __str__(self):
        return f"{self.doctor.full_name} at {self.branch.hospital.name} ({self.branch.name})"


class DoctorSchedule(models.Model):
    DAY_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]

    APPOINTMENT_TYPE_CHOICES = [
        ('general', 'General Appointment'),
        ('follow_up', 'Follow-up Consultation'),
        ('emergency', 'Emergency Consultation'),
        ('specialist', 'Specialist Consultation'),
    ]

    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='schedules')
    hospital = models.ForeignKey(Hospital, null=True, blank=True, on_delete=models.CASCADE, related_name='doctor_schedules')
    branch = models.ForeignKey(HospitalBranch, null=True, blank=True, on_delete=models.CASCADE, related_name='doctor_schedules')
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL, related_name='doctor_schedules')
    
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    appointment_type = models.CharField(max_length=30, choices=APPOINTMENT_TYPE_CHOICES, default='general')
    maximum_appointments = models.PositiveIntegerField(default=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'doctor_schedules'
        ordering = ['day_of_week', 'start_time']
        indexes = [
            models.Index(fields=['doctor', 'day_of_week', 'status']),
            models.Index(fields=['hospital', 'branch']),
        ]

    @property
    def is_overnight(self):
        """Returns True if the schedule spans across midnight (e.g., 7:00 PM to 8:00 AM)."""
        return self.end_time < self.start_time

    def __str__(self):
        return f"{self.doctor.full_name} — {self.get_day_of_week_display()} ({self.start_time} - {self.end_time})"


class DoctorLeave(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='leaves')
    branch = models.ForeignKey(HospitalBranch, null=True, blank=True, on_delete=models.SET_NULL, related_name='doctor_leaves')
    start_date = models.DateField(db_index=True)
    end_date = models.DateField(db_index=True)
    message = models.TextField(blank=True, help_text="Public notice message about leave")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'doctor_leaves'
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['doctor', 'status', 'start_date', 'end_date']),
        ]

    def is_active_on(self, date=None):
        if date is None:
            date = timezone.now().date()
        return self.status == 'active' and self.start_date <= date <= self.end_date

    def __str__(self):
        return f"{self.doctor.full_name} on leave: {self.start_date} to {self.end_date}"


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    ]

    APPOINTMENT_TYPES = [
        ('general', 'General Consultation'),
        ('follow_up', 'Follow-up'),
        ('emergency', 'Emergency Consultation'),
        ('specialist', 'Specialist Consultation'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    citizen = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    hospital = models.ForeignKey(Hospital, null=True, blank=True, on_delete=models.CASCADE, related_name='appointments')
    branch = models.ForeignKey(HospitalBranch, null=True, blank=True, on_delete=models.SET_NULL, related_name='appointments')
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL, related_name='appointments')
    
    scheduled_at = models.DateTimeField()
    appointment_type = models.CharField(max_length=30, choices=APPOINTMENT_TYPES, default='general')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'appointments'
        ordering = ['-scheduled_at']
        indexes = [
            models.Index(fields=['citizen', 'status']),
            models.Index(fields=['doctor', 'scheduled_at']),
            models.Index(fields=['hospital', 'status']),
        ]

    def __str__(self):
        return f"{self.citizen.email} with Dr. {self.doctor.full_name} on {self.scheduled_at}"


class FavoriteDoctor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_doctors')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'favorite_doctors'
        unique_together = ['user', 'doctor']


class FavoriteHospital(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_hospitals')
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'favorite_hospitals'
        unique_together = ['user', 'hospital']


class FavoriteDepartment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_departments')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'favorite_departments'
        unique_together = ['user', 'department']
