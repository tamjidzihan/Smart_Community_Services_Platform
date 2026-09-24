# Generated for Smart Health Platform transformation

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('healthcare', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Create Specialists
        migrations.CreateModel(
            name='Specialist',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(db_index=True, max_length=150, unique=True)),
                ('slug', models.SlugField(blank=True, max_length=180, unique=True)),
                ('description', models.TextField(blank=True)),
                ('icon', models.CharField(blank=True, max_length=100)),
                ('image_url', models.URLField(blank=True)),
                ('status', models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive')], default='active', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'specialists',
                'ordering': ['name'],
            },
        ),

        # Update Hospital fields
        migrations.AddField(
            model_name='hospital',
            name='ambulance_available',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='hospital',
            name='area',
            field=models.CharField(blank=True, db_index=True, max_length=150),
        ),
        migrations.AddField(
            model_name='hospital',
            name='city',
            field=models.CharField(blank=True, db_index=True, max_length=100),
        ),
        migrations.AddField(
            model_name='hospital',
            name='cover_image',
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name='hospital',
            name='district',
            field=models.CharField(blank=True, db_index=True, max_length=100),
        ),
        migrations.AddField(
            model_name='hospital',
            name='division',
            field=models.CharField(blank=True, db_index=True, max_length=100),
        ),
        migrations.AddField(
            model_name='hospital',
            name='emergency_phone',
            field=models.CharField(blank=True, max_length=30),
        ),
        migrations.AddField(
            model_name='hospital',
            name='hospital_type',
            field=models.CharField(choices=[('general', 'General Hospital'), ('specialized', 'Specialized Hospital'), ('clinic', 'Clinic'), ('diagnostic', 'Diagnostic Center'), ('dental', 'Dental Clinic'), ('eye', 'Eye Hospital'), ('maternity', 'Maternity Hospital'), ('tertiary', 'Tertiary Care Hospital')], db_index=True, default='general', max_length=30),
        ),
        migrations.AddField(
            model_name='hospital',
            name='logo',
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name='hospital',
            name='open_24_hours',
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddField(
            model_name='hospital',
            name='review_count',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='hospital',
            name='slug',
            field=models.SlugField(blank=True, max_length=220, unique=True, null=True),
        ),
        migrations.AddField(
            model_name='hospital',
            name='status',
            field=models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive'), ('pending', 'Pending Approval')], db_index=True, default='active', max_length=20),
        ),
        migrations.AddField(
            model_name='hospital',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='hospital',
            name='average_rating',
            field=models.FloatField(db_index=True, default=0.0),
        ),
        migrations.AlterField(
            model_name='hospital',
            name='emergency_available',
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AlterField(
            model_name='hospital',
            name='is_verified',
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AlterField(
            model_name='hospital',
            name='name',
            field=models.CharField(db_index=True, max_length=200),
        ),
        migrations.AlterField(
            model_name='hospital',
            name='phone',
            field=models.CharField(blank=True, max_length=30),
        ),

        # Create HospitalBranch
        migrations.CreateModel(
            name='HospitalBranch',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=200)),
                ('address', models.TextField()),
                ('phone', models.CharField(blank=True, max_length=30)),
                ('telephones', models.CharField(blank=True, help_text='Comma-separated contact numbers', max_length=200)),
                ('division', models.CharField(blank=True, max_length=100)),
                ('district', models.CharField(blank=True, max_length=100)),
                ('city', models.CharField(blank=True, max_length=100)),
                ('area', models.CharField(blank=True, max_length=150)),
                ('latitude', models.FloatField(blank=True, null=True)),
                ('longitude', models.FloatField(blank=True, null=True)),
                ('opening_hours', models.CharField(blank=True, default='24/7', max_length=200)),
                ('status', models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive')], default='active', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('hospital', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='branches', to='healthcare.hospital')),
            ],
            options={
                'db_table': 'hospital_branches',
                'ordering': ['name'],
            },
        ),

        # Create Department
        migrations.CreateModel(
            name='Department',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(db_index=True, max_length=150)),
                ('slug', models.SlugField(blank=True, max_length=180)),
                ('description', models.TextField(blank=True)),
                ('icon', models.CharField(blank=True, help_text='Icon identifier or icon URL', max_length=100)),
                ('image_url', models.URLField(blank=True)),
                ('status', models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive')], default='active', max_length=20)),
                ('average_rating', models.FloatField(default=0.0)),
                ('review_count', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('hospital', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='departments', to='healthcare.hospital')),
            ],
            options={
                'db_table': 'hospital_departments',
                'ordering': ['name'],
                'unique_together': {('hospital', 'slug')},
            },
        ),

        # Update Doctor model
        migrations.AddField(
            model_name='doctor',
            name='additional_information',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='doctor',
            name='appointment_number',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='doctor',
            name='current_position',
            field=models.CharField(blank=True, help_text='e.g. Professor, Department of Medicine', max_length=250),
        ),
        migrations.AddField(
            model_name='doctor',
            name='degree_summary',
            field=models.TextField(blank=True, help_text='e.g. MBBS, MD (Internal Medicine), FCPS'),
        ),
        migrations.AddField(
            model_name='doctor',
            name='education',
            field=models.TextField(blank=True, help_text='Detailed academic background'),
        ),
        migrations.AddField(
            model_name='doctor',
            name='experience_summary',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='doctor',
            name='friday_reservation_information',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='doctor',
            name='gender',
            field=models.CharField(blank=True, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], max_length=10),
        ),
        migrations.AddField(
            model_name='doctor',
            name='is_active',
            field=models.BooleanField(db_index=True, default=True),
        ),
        migrations.AddField(
            model_name='doctor',
            name='is_verified',
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddField(
            model_name='doctor',
            name='mobile',
            field=models.CharField(blank=True, max_length=30),
        ),
        migrations.AddField(
            model_name='doctor',
            name='previous_experience',
            field=models.TextField(blank=True, help_text='Past clinical/hospital positions'),
        ),
        migrations.AddField(
            model_name='doctor',
            name='professional_summary',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='doctor',
            name='profile_image',
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name='doctor',
            name='review_count',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='doctor',
            name='specialists',
            field=models.ManyToManyField(blank=True, related_name='doctors', to='healthcare.specialist'),
        ),
        migrations.AddField(
            model_name='doctor',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name='doctor',
            name='user',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='doctor_profile', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='doctor',
            name='average_rating',
            field=models.FloatField(db_index=True, default=0.0),
        ),
        migrations.AlterField(
            model_name='doctor',
            name='full_name',
            field=models.CharField(db_index=True, max_length=150),
        ),

        # Create DoctorHospital affiliation
        migrations.CreateModel(
            name='DoctorHospital',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('position', models.CharField(blank=True, max_length=200)),
                ('status', models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive')], default='active', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('department', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='doctor_affiliations', to='healthcare.department')),
                ('doctor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='hospital_affiliations', to='healthcare.doctor')),
                ('hospital', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='doctor_affiliations', to='healthcare.hospital')),
            ],
            options={
                'db_table': 'doctor_hospitals',
                'unique_together': {('doctor', 'hospital', 'department')},
            },
        ),

        # Create DoctorBranch affiliation
        migrations.CreateModel(
            name='DoctorBranch',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('room_number', models.CharField(blank=True, max_length=100)),
                ('status', models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive')], default='active', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('branch', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='doctor_affiliations', to='healthcare.hospitalbranch')),
                ('doctor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='branch_affiliations', to='healthcare.doctor')),
            ],
            options={
                'db_table': 'doctor_branches',
                'unique_together': {('doctor', 'branch')},
            },
        ),

        # Create DoctorLeave
        migrations.CreateModel(
            name='DoctorLeave',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('start_date', models.DateField(db_index=True)),
                ('end_date', models.DateField(db_index=True)),
                ('message', models.TextField(blank=True, help_text='Public notice message about leave')),
                ('status', models.CharField(choices=[('active', 'Active'), ('cancelled', 'Cancelled'), ('completed', 'Completed')], default='active', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('branch', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='doctor_leaves', to='healthcare.hospitalbranch')),
                ('doctor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='leaves', to='healthcare.doctor')),
            ],
            options={
                'db_table': 'doctor_leaves',
                'ordering': ['-start_date'],
            },
        ),

        # Drop old doctor schedule and recreate cleanly with UUID
        migrations.DeleteModel(
            name='DoctorSchedule',
        ),
        migrations.CreateModel(
            name='DoctorSchedule',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('day_of_week', models.IntegerField(choices=[(0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'), (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday')])),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('appointment_type', models.CharField(choices=[('general', 'General Appointment'), ('follow_up', 'Follow-up Consultation'), ('emergency', 'Emergency Consultation'), ('specialist', 'Specialist Consultation')], default='general', max_length=30)),
                ('maximum_appointments', models.PositiveIntegerField(default=20)),
                ('status', models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive')], default='active', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('branch', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='doctor_schedules', to='healthcare.hospitalbranch')),
                ('department', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='doctor_schedules', to='healthcare.department')),
                ('doctor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='schedules', to='healthcare.doctor')),
                ('hospital', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='doctor_schedules', to='healthcare.hospital')),
            ],
            options={
                'db_table': 'doctor_schedules',
                'ordering': ['day_of_week', 'start_time'],
            },
        ),

        # Update Appointment
        migrations.AddField(
            model_name='appointment',
            name='appointment_type',
            field=models.CharField(choices=[('general', 'General Consultation'), ('follow_up', 'Follow-up'), ('emergency', 'Emergency Consultation'), ('specialist', 'Specialist Consultation')], default='general', max_length=30),
        ),
        migrations.AddField(
            model_name='appointment',
            name='branch',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='appointments', to='healthcare.hospitalbranch')),
        migrations.AddField(
            model_name='appointment',
            name='department',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='appointments', to='healthcare.department')),
        migrations.AlterField(
            model_name='appointment',
            name='hospital',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='appointments', to='healthcare.hospital'),
        ),

        # Create Favorites
        migrations.CreateModel(
            name='FavoriteDoctor',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('doctor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorited_by', to='healthcare.doctor')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorite_doctors', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'favorite_doctors',
                'unique_together': {('user', 'doctor')},
            },
        ),
        migrations.CreateModel(
            name='FavoriteHospital',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('hospital', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorited_by', to='healthcare.hospital')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorite_hospitals', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'favorite_hospitals',
                'unique_together': {('user', 'hospital')},
            },
        ),
        migrations.CreateModel(
            name='FavoriteDepartment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('department', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorited_by', to='healthcare.department')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorite_departments', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'favorite_departments',
                'unique_together': {('user', 'department')},
            },
        ),
    ]
