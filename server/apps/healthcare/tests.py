import uuid
from datetime import time, timedelta
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.healthcare.models import (
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
)

User = get_user_model()


class HealthcareCoreTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='testcitizen@smarthealth.io', password='Password123!')
        
        self.hospital = Hospital.objects.create(
            name='Dhaka Medical College & Hospital',
            hospital_type='general',
            address='Secretariat Road, Dhaka',
            division='Dhaka',
            district='Dhaka',
            city='Dhaka',
            area='Bakshibazar',
            emergency_available=True,
            open_24_hours=True,
            ambulance_available=True,
        )

        self.branch = HospitalBranch.objects.create(
            hospital=self.hospital,
            name='Shantinagar Branch',
            address='Shantinagar, Dhaka',
            city='Dhaka',
            area='Shantinagar',
        )

        self.department = Department.objects.create(
            hospital=self.hospital,
            name='Department of Medicine',
            description='Comprehensive internal medicine care',
        )

        self.specialist = Specialist.objects.create(
            name='Medicine & Chest Medicine',
            description='Specialist in respiratory and internal medicine diseases',
        )

        self.doctor = Doctor.objects.create(
            full_name='Prof. Dr. M A Kashem',
            gender='male',
            mobile='01711600111',
            degree_summary='MBBS, MD (Internal Medicine), MCPS (Medicine), FACP (America), FRCP (UK)',
            experience_summary='Over 25 years of clinical and academic experience',
            current_position='Professor, Department of Medicine',
            is_active=True,
            is_verified=True,
        )
        self.doctor.specialists.add(self.specialist)

        self.doc_hosp = DoctorHospital.objects.create(
            doctor=self.doctor,
            hospital=self.hospital,
            department=self.department,
            position='Professor & Head of Department',
        )

        self.doc_branch = DoctorBranch.objects.create(
            doctor=self.doctor,
            branch=self.branch,
            room_number='Chamber 402',
        )

    def test_hospital_slug_generation(self):
        self.assertTrue(self.hospital.slug.startswith('dhaka-medical-college-hospital'))

    def test_specialist_slug_generation(self):
        self.assertEqual(self.specialist.slug, 'medicine-chest-medicine')

    def test_overnight_schedule(self):
        # 7:00 PM (19:00) to 8:00 AM (08:00) spans overnight
        schedule_overnight = DoctorSchedule.objects.create(
            doctor=self.doctor,
            hospital=self.hospital,
            branch=self.branch,
            day_of_week=0,  # Monday
            start_time=time(19, 0),
            end_time=time(8, 0),
            appointment_type='general',
        )
        self.assertTrue(schedule_overnight.is_overnight)

        # Standard daytime schedule: 9:00 AM to 5:00 PM
        schedule_daytime = DoctorSchedule.objects.create(
            doctor=self.doctor,
            hospital=self.hospital,
            branch=self.branch,
            day_of_week=2,  # Wednesday
            start_time=time(9, 0),
            end_time=time(17, 0),
            appointment_type='general',
        )
        self.assertFalse(schedule_daytime.is_overnight)

    def test_doctor_availability_without_leave(self):
        today = timezone.now().date()
        today_dow = today.weekday()

        # Doctor has schedule today
        DoctorSchedule.objects.create(
            doctor=self.doctor,
            hospital=self.hospital,
            branch=self.branch,
            day_of_week=today_dow,
            start_time=time(18, 0),
            end_time=time(21, 0),
        )

        status_info = self.doctor.get_availability_status(today)
        self.assertEqual(status_info['status'], 'AVAILABLE_TODAY')
        self.assertTrue(status_info['is_available'])

    def test_doctor_on_leave(self):
        today = timezone.now().date()
        DoctorLeave.objects.create(
            doctor=self.doctor,
            start_date=today - timedelta(days=2),
            end_date=today + timedelta(days=5),
            message='Attending International Medical Conference',
            status='active',
        )

        status_info = self.doctor.get_availability_status(today)
        self.assertEqual(status_info['status'], 'ON_LEAVE')
        self.assertFalse(status_info['is_available'])
        self.assertIn('International Medical Conference', status_info['message'])

    def test_doctor_inactive_status(self):
        self.doctor.is_active = False
        self.doctor.save()
        status_info = self.doctor.get_availability_status()
        self.assertEqual(status_info['status'], 'INACTIVE')
        self.assertFalse(status_info['is_available'])
