"""
Smart Health Platform Complete Database Seeder
==============================================
Flushes all data and seeds:
1. Superuser (admin@admin.com / admin1234)
2. 200+ Hospitals in Dhaka, Bangladesh
3. 1,000+ Specialist Doctors affiliated to hospitals & departments
4. Weekly practice schedules (including daytime, evening, and overnight shifts)
5. Fake reviews & calculated ratings
6. 1,000+ Blood Donors across Dhaka & active blood requests
"""

import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import random
import uuid
from datetime import date, time, timedelta
from django.utils import timezone
from django.utils.text import slugify

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
import django
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.db import transaction
from apps.healthcare.models import (
    Hospital, HospitalBranch, Department, Specialist,
    Doctor, DoctorHospital, DoctorBranch, DoctorSchedule, DoctorLeave,
    Appointment, FavoriteDoctor, FavoriteHospital
)
from apps.blood.models import BloodDonor, BloodRequest
from apps.reviews.models import Review
from apps.accounts.models import Role, UserProfile

User = get_user_model()

print("=" * 70)
print("STARTING SMART HEALTH PLATFORM FULL DATABASE RESET & SEEDING")
print("=" * 70)

# 1. PURGE ALL EXISTING DATA
print("\n[1/6] Purging all existing database records...")
from django.db import connection

if connection.vendor == 'postgresql':
    with connection.cursor() as cursor:
        cursor.execute("""
            DO $$ 
            DECLARE 
                r RECORD;
            BEGIN
                FOR r IN (
                    SELECT tablename 
                    FROM pg_tables 
                    WHERE schemaname = 'public' 
                      AND tablename NOT LIKE 'django_migrations%'
                      AND tablename NOT LIKE 'spatial_ref_sys%'
                ) LOOP
                    EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE;';
                END LOOP;
            END $$;
        """)
else:
    # SQLite cleanup
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA foreign_keys = OFF;")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'django_migrations%' AND name NOT LIKE 'sqlite_%';")
        tables = [row[0] for row in cursor.fetchall()]
        for table in tables:
            cursor.execute(f"DELETE FROM \"{table}\";")
        cursor.execute("PRAGMA foreign_keys = ON;")

print("  ✓ All database tables purged cleanly.")

# 2. SEED ROLES & SUPERUSER
print("\n[2/6] Creating roles & superuser (admin@admin.com)...")
role_admin, _ = Role.objects.get_or_create(name='admin', defaults={'description': 'System Administrator'})
role_doctor, _ = Role.objects.get_or_create(name='doctor', defaults={'description': 'Medical Doctor'})
role_citizen, _ = Role.objects.get_or_create(name='citizen', defaults={'description': 'Patient & Citizen'})

admin_user = User.objects.create(
    email='admin@admin.com',
    is_staff=True,
    is_superuser=True,
    is_active=True,
    is_email_verified=True,
)
admin_user.set_password('admin1234')
admin_user.save()
admin_user.roles.add(role_admin)

admin_profile, _ = UserProfile.objects.get_or_create(user=admin_user)
admin_profile.full_name = "Chief Health Administrator"
admin_profile.phone = "+8801711000000"
admin_profile.address = "Directorate General of Health Services (DGHS), Mohakhali, Dhaka"
admin_profile.gender = "M"
admin_profile.latitude = 23.7771
admin_profile.longitude = 90.4061
admin_profile.save()

print(f"  ✓ Superuser created: {admin_user.email} (Password: admin1234)")

# Also create demo doctor and citizen users for quick testing
demo_doc_user = User.objects.create(
    email='doctor@smarthealth.local',
    is_staff=False,
    is_active=True,
    is_email_verified=True,
)
demo_doc_user.set_password('doctor1234')
demo_doc_user.save()
demo_doc_user.roles.add(role_doctor)
doc_prof, _ = UserProfile.objects.get_or_create(user=demo_doc_user)
doc_prof.full_name = "Prof. Dr. A. K. M. Fazlul Haque"
doc_prof.phone = "+8801712000000"
doc_prof.address = "Dhanmondi, Dhaka"
doc_prof.gender = "M"
doc_prof.save()

demo_cit_user = User.objects.create(
    email='citizen@smarthealth.local',
    is_staff=False,
    is_active=True,
    is_email_verified=True,
)
demo_cit_user.set_password('citizen1234')
demo_cit_user.save()
demo_cit_user.roles.add(role_citizen)
cit_prof, _ = UserProfile.objects.get_or_create(user=demo_cit_user)
cit_prof.full_name = "Tanvir Ahmed"
cit_prof.phone = "+8801819000000"
cit_prof.address = "Uttara Sector 7, Dhaka"
cit_prof.gender = "M"
cit_prof.save()

print("  ✓ Demo accounts created (doctor@smarthealth.local, citizen@smarthealth.local).")

# 3. SEED SPECIALTIES
print("\n[3/6] Seeding medical specialties...")
SPECIALTY_DEFS = [
    ("Cardiology", "Heart diseases, hypertension, coronary interventions, arrhythmias, pacemakers"),
    ("Neurology", "Brain, stroke, epilepsy, neuromuscular disorders, Parkinson's, migraines"),
    ("Nephrology", "Kidney diseases, dialysis, renal transplant, hypertension"),
    ("Orthopedics", "Bone fractures, joint replacement, spine surgery, trauma, sports injuries"),
    ("Pediatrics", "Neonatal care, child development, pediatric vaccinations, childhood diseases"),
    ("Gynecology & Obstetrics", "Maternal health, high-risk pregnancy, laparoscopy, infertility"),
    ("Dermatology", "Skin diseases, cosmetology, hair disorders, allergies, laser therapy"),
    ("Gastroenterology", "Liver, stomach, endoscopy, colonoscopy, hepatitis, pancreatitis"),
    ("General Surgery", "Laparoscopic surgery, abdominal emergencies, hernia, gallbladder"),
    ("Internal Medicine", "General adult diseases, fever, diabetes, thyroid, infectious diseases"),
    ("Oncology", "Cancer chemotherapy, radiotherapy, surgical oncology, screening"),
    ("Urology", "Kidney stones, prostate, bladder, reconstructive urology, andrology"),
    ("Ophthalmology", "Eye care, cataract surgery, Lasik, glaucoma, retina, cornea"),
    ("ENT & Head Neck Surgery", "Ear, nose, throat, sinus surgery, hearing loss, head & neck tumors"),
    ("Psychiatry", "Mental health, depression, anxiety, psychotherapy, addiction medicine"),
    ("Endocrinology", "Diabetes mellitus, thyroid disorders, hormone imbalances, obesity"),
    ("Pulmonology & Chest Medicine", "Asthma, COPD, tuberculosis, pneumonia, sleep apnea, lung care"),
    ("Rheumatology", "Arthritis, lupus, autoimmune conditions, connective tissue diseases"),
    ("Physical Medicine & Rehabilitation", "Pain management, stroke rehabilitation, physiotherapy, sciatica"),
    ("Hematology", "Blood disorders, thalassemia, leukemia, anemia, clotting disorders"),
]

specialist_objects = {}
for name, desc in SPECIALTY_DEFS:
    s = Specialist.objects.create(
        name=name,
        slug=slugify(name),
        description=desc,
        status='active'
    )
    specialist_objects[name] = s

print(f"  ✓ {len(specialist_objects)} medical specialties seeded.")

# 4. SEED 200+ HOSPITALS ACROSS DHAKA
print("\n[4/6] Seeding 200+ Hospitals across Dhaka, Bangladesh...")

DHAKA_AREAS = [
    ("Dhanmondi", 23.7465, 90.3760),
    ("Gulshan 1", 23.7780, 90.4168),
    ("Gulshan 2", 23.7925, 90.4150),
    ("Banani", 23.7937, 90.4043),
    ("Uttara Sector 3", 23.8680, 90.3980),
    ("Uttara Sector 7", 23.8745, 90.3955),
    ("Uttara Sector 11", 23.8820, 90.3890),
    ("Mohakhali", 23.7776, 90.4055),
    ("Panthapath", 23.7515, 90.3872),
    ("Green Road", 23.7485, 90.3830),
    ("Shahbagh", 23.7380, 90.3957),
    ("Mirpur 1", 23.7956, 90.3537),
    ("Mirpur 2", 23.8067, 90.3601),
    ("Mirpur 10", 23.8070, 90.3685),
    ("Mirpur 12", 23.8240, 90.3650),
    ("Shyamoli", 23.7725, 90.3645),
    ("Mohammadpur", 23.7658, 90.3584),
    ("Badda", 23.7805, 90.4267),
    ("Bashundhara R/A", 23.8160, 90.4280),
    ("Baridhara", 23.7985, 90.4225),
    ("Motijheel", 23.7330, 90.4175),
    ("Old Dhaka (Mitford)", 23.7125, 90.4010),
    ("Wari", 23.7190, 90.4190),
    ("Malibagh", 23.7480, 90.4150),
    ("Mogbazar", 23.7505, 90.4035),
    ("Kakrail", 23.7390, 90.4060),
    ("Tejgaon", 23.7600, 90.3980),
    ("Farmgate", 23.7570, 90.3890),
    ("Rampura", 23.7615, 90.4215),
    ("Khilgaon", 23.7520, 90.4280),
    ("Jatrabari", 23.7110, 90.4350),
    ("Kurmitola", 23.8210, 90.4050),
    ("Savar", 23.8500, 90.2600),
]

TOP_HOSPITAL_NAMES = [
    # Prominent Tertiary / Private
    ("Square Hospital Ltd.", "specialized", "8/F, Kazi Nazrul Islam Ave, Panthapath, Dhaka", "Panthapath", 23.7528, 90.3814, "+8801713377775", "10616", "https://squarehospital.com", 450, 65, 2006),
    ("Evercare Hospital Dhaka", "tertiary", "Plot 81, Block E, Bashundhara R/A, Dhaka", "Bashundhara R/A", 23.8103, 90.4312, "+88028431661", "10678", "https://evercarebd.com", 500, 80, 2005),
    ("United Hospital Limited", "tertiary", "Plot 15, Road 71, Gulshan 2, Dhaka", "Gulshan 2", 23.7995, 90.4140, "+88028836000", "10666", "https://uhlbd.com", 500, 75, 2006),
    ("Labaid Specialized Hospital", "specialized", "House 6, Road 4, Dhanmondi, Dhaka", "Dhanmondi", 23.7432, 90.3820, "+88029676356", "10606", "https://labaidgroup.com", 350, 45, 2004),
    ("Labaid Cardiac Hospital", "specialized", "House 1, Road 4, Dhanmondi, Dhaka", "Dhanmondi", 23.7428, 90.3825, "+88028610793", "10606", "https://labaidgroup.com", 250, 30, 2002),
    ("Bangladesh Specialized Hospital", "specialized", "21 Shyamoli, Mirpur Road, Dhaka", "Shyamoli", 23.7712, 90.3648, "+8809666700100", "10633", "https://bdspecializedhospital.com", 400, 60, 2016),
    ("Asgar Ali Hospital", "tertiary", "111/1/A Distillery Road, Gandaria, Dhaka", "Old Dhaka (Mitford)", 23.7085, 90.4285, "+8809666710602", "10602", "https://asgaralihospital.com", 350, 50, 2015),
    ("BRB Hospitals Limited", "general", "77/A, East Rajabazar, West Panthapath, Dhaka", "Panthapath", 23.7535, 90.3838, "+88029140333", "10647", "https://brbhospital.com", 300, 40, 2014),
    ("Anwer Khan Modern Medical College Hospital", "general", "House 17, Road 8, Dhanmondi, Dhaka", "Dhanmondi", 23.7470, 90.3780, "+88029670295", "01755607060", "https://akmmc.edu.bd", 750, 110, 2008),
    ("Ibn Sina Specialized Hospital Dhanmondi", "specialized", "House 68, Road 15/A, Dhanmondi, Dhaka", "Dhanmondi", 23.7540, 90.3740, "+88029126625", "10615", "https://ibnsinatrust.com", 350, 45, 2006),
    ("Ibn Sina Hospital & Diagnostic Center Uttara", "general", "House 52, Gausul Azam Ave, Sector 13, Uttara, Dhaka", "Uttara Sector 11", 23.8795, 90.3880, "+88028953932", "10615", "https://ibnsinatrust.com", 200, 30, 2010),
    ("Popular Specialized Hospital", "specialized", "House 77, Road 5/A, Dhanmondi, Dhaka", "Dhanmondi", 23.7445, 90.3810, "+8809613787801", "01755532470", "https://popularmedical.com", 400, 60, 2009),
    ("Central Hospital Limited", "general", "House 2, Road 5, Green Road, Dhanmondi, Dhaka", "Green Road", 23.7440, 90.3840, "+88029660015", "01738448855", "https://centralhospitaldhaka.com", 300, 40, 1993),
    ("Green Life Hospital Limited", "general", "32 Green Road, Dhanmondi, Dhaka", "Green Road", 23.7475, 90.3855, "+88029612345", "01712255700", "https://greenlifehospital.com.bd", 400, 55, 2005),
    ("Comfort Diagnostic Centre & Nursing Home", "diagnostic", "167/B Green Road, Dhanmondi, Dhaka", "Green Road", 23.7510, 90.3860, "+88029135936", "01731956033", "https://comforthospitalbd.com", 200, 25, 1991),
    ("Samorita Hospital Limited", "general", "89/1 Panthapath, Dhaka", "Panthapath", 23.7522, 90.3850, "+88029131901", "01713405788", "https://samoritahospital.org", 250, 35, 1984),
    ("Holy Family Red Crescent Medical College Hospital", "tertiary", "1/1 Eskaton Garden Road, Dhaka", "Mogbazar", 23.7435, 90.4020, "+88028311721", "01819213144", "https://hfrcmc.edu.bd", 600, 90, 1953),
    ("Delta Hospital Limited", "specialized", "26/2 Principal Abul Kashem Road, Mirpur 1, Dhaka", "Mirpur 1", 23.7970, 90.3520, "+88029007036", "01715011922", "https://deltahospitalbd.com", 350, 45, 1989),
    ("Ahsania Mission Cancer & General Hospital", "specialized", "Plot 03, Embankment Drive Way, Sector 10, Uttara, Dhaka", "Uttara Sector 11", 23.8850, 90.3840, "+88028952445", "10617", "https://amcghbd.org", 500, 70, 2001),
    ("Al-Helal Specialized Hospital", "specialized", "150 Begum Rokeya Sarani, Mirpur 10, Dhaka", "Mirpur 10", 23.8060, 90.3680, "+88029008188", "01711644888", "https://alhelalhospital.com", 200, 30, 2000),

    # Prominent Government / National Institutes
    ("Bangabandhu Sheikh Mujib Medical University (BSMMU)", "tertiary", "Shahbagh, Dhaka", "Shahbagh", 23.7395, 90.3958, "+880255165606", "10655", "https://bsmmu.edu.bd", 1900, 250, 1965),
    ("Dhaka Medical College & Hospital (DMCH)", "tertiary", "Secretariat Road, Ramna, Dhaka", "Shahbagh", 23.7258, 90.3976, "+880255165000", "01711000999", "https://dmch.gov.bd", 2600, 300, 1946),
    ("Sir Salimullah Medical College Mitford Hospital", "tertiary", "Mitford Road, Old Dhaka", "Old Dhaka (Mitford)", 23.7118, 90.4005, "+88027319002", "01711223344", "https://ssmc.gov.bd", 900, 120, 1858),
    ("National Institute of Cardiovascular Diseases (NICVD)", "specialized", "Sher-e-Bangla Nagar, Dhaka", "Shyamoli", 23.7705, 90.3695, "+88029122560", "01713000888", "https://nicvd.gov.bd", 1200, 160, 1978),
    ("National Institute of Neurosciences & Hospital (NINS)", "specialized", "Sher-e-Bangla Nagar, Agargaon, Dhaka", "Shyamoli", 23.7745, 90.3680, "+88029140752", "01715998877", "https://nins.gov.bd", 450, 60, 2012),
    ("National Institute of Cancer Research & Hospital (NICRH)", "specialized", "Mohakhali, Dhaka", "Mohakhali", 23.7790, 90.4030, "+88029880078", "01712334455", "https://nicrh.gov.bd", 500, 70, 1982),
    ("National Institute of Kidney Diseases and Urology (NIKDU)", "specialized", "Sher-e-Bangla Nagar, Dhaka", "Shyamoli", 23.7730, 90.3710, "+88029136565", "01718001122", "https://nikdu.gov.bd", 500, 65, 2001),
    ("National Institute of Traumatology and Orthopaedic Rehabilitation (NITOR)", "specialized", "Sher-e-Bangla Nagar, Dhaka", "Shyamoli", 23.7690, 90.3685, "+88029112521", "01714112233", "https://nitor.gov.bd", 1000, 140, 1972),
    ("National Institute of Diseases of the Chest and Hospital (NIDCH)", "specialized", "Mohakhali, Dhaka", "Mohakhali", 23.7785, 90.4065, "+88029880181", "01717445566", "https://nidch.gov.bd", 670, 85, 1955),
    ("Shaheed Suhrawardy Medical College Hospital", "tertiary", "Sher-e-Bangla Nagar, Dhaka", "Shyamoli", 23.7680, 90.3705, "+88029130800", "01713224455", "https://shsmch.gov.bd", 850, 110, 1963),
    ("Kurmitola General Hospital", "general", "Dhaka-Mymensingh Highway, Kurmitola, Dhaka", "Kurmitola", 23.8220, 90.4060, "+880255062301", "01769010203", "https://kgh.gov.bd", 500, 75, 2012),
    ("Mugda Medical College & Hospital", "general", "Mugda, Dhaka", "Khilgaon", 23.7290, 90.4320, "+88027278233", "01713556677", "https://mumc.gov.bd", 500, 70, 2013),
    ("Dhaka Shishu (Children) Hospital", "specialized", "Sher-e-Bangla Nagar, Dhaka", "Shyamoli", 23.7718, 90.3670, "+88029113640", "01713002244", "https://dsh.org.bd", 650, 90, 1977),
    ("BIRDEM General Hospital (Diabetic Association)", "specialized", "122 Kazi Nazrul Islam Avenue, Shahbagh, Dhaka", "Shahbagh", 23.7405, 90.3960, "+88029661551", "10620", "https://birdembd.org", 700, 100, 1980),
    ("Combined Military Hospital (CMH) Dhaka", "tertiary", "Dhaka Cantonment, Dhaka", "Mohakhali", 23.8150, 90.3980, "+88028750011", "01769010000", "https://army.mil.bd", 1200, 150, 1971),

    # Specialized Eye & Dental & Maternity
    ("Ispahani Islamia Eye Institute and Hospital", "eye", "Khamarbari, Farmgate, Dhaka", "Farmgate", 23.7595, 90.3860, "+88029119315", "01713049444", "https://islamia.org.bd", 250, 40, 1960),
    ("Bangladesh Eye Hospital Ltd. Dhanmondi", "eye", "House 19/1, Road 6, Dhanmondi, Dhaka", "Dhanmondi", 23.7450, 90.3800, "+88029666290", "10660", "https://bdeyehospital.org", 150, 25, 2005),
    ("Bangladesh Eye Hospital Uttara", "eye", "Sector 11, Uttara, Dhaka", "Uttara Sector 11", 23.8810, 90.3885, "+88028952323", "10660", "https://bdeyehospital.org", 100, 18, 2012),
    ("Harun Eye Foundation Hospital", "eye", "House 12/A, Road 5, Dhanmondi, Dhaka", "Dhanmondi", 23.7442, 90.3815, "+88029663950", "01711567890", "https://haruneyefoundation.com", 120, 20, 1994),
    ("National Institute of ENT", "specialized", "Tejgaon, Dhaka", "Tejgaon", 23.7650, 90.3950, "+88028878070", "01712998877", "https://nient.gov.bd", 250, 35, 2013),
    ("Pioneer Dental College & Hospital", "dental", "Faidabad, Uttara, Dhaka", "Uttara Sector 7", 23.8760, 90.4020, "+88028960091", "01711122334", "https://pioneerdental.edu.bd", 150, 25, 1995),
    ("Dhaka Dental College & Hospital", "dental", "Mirpur 14, Dhaka", "Mirpur 10", 23.8120, 90.3810, "+88029011887", "01711445566", "https://ddc.gov.bd", 300, 45, 1961),
    ("Mohammadpur Fertility Services & Training Centre", "maternity", "Aurangzeb Road, Mohammadpur, Dhaka", "Mohammadpur", 23.7630, 90.3620, "+88029111822", "01715009988", "https://mfstc.gov.bd", 150, 20, 1974),
    ("Dhaka Community Medical College Hospital", "general", "190/1, Boro Moghbazar, Wireless Railgate, Dhaka", "Mogbazar", 23.7530, 90.4070, "+88029351190", "01713030300", "https://dcmch.org.bd", 500, 70, 2008),
    ("Ad-din Women's Medical College Hospital", "maternity", "2 Bara Moghbazar, Dhaka", "Mogbazar", 23.7490, 90.4050, "+88029353391", "01713488411", "https://ad-din.org", 500, 65, 2008),
]

hospital_prefixes = [
    "Care", "Medinova", "Apex", "City", "Metro", "Prime", "Universal", "Cure",
    "HealthAid", "LifeCare", "Al-Madina", "Comfort", "Popular", "Nova", "Crescent",
    "Pinnacle", "MediPlus", "Standard", "Trust", "Reliance", "Imperial", "Global",
    "Everest", "Beacon", "Prescription Point", "Padma", "Meghna", "Jamuna", "Safa",
    "Modern", "Advanced", "Galaxy", "Medix", "Grace", "Fortune", "Suraksha",
    "Renaissance", "Al-Razi", "Farabi", "Medex", "BioMed", "Shikder", "Anannya"
]

hospital_suffixes = [
    ("Specialized Hospital", "specialized"),
    ("General Hospital & Diagnostic Centre", "general"),
    ("Medical Center & Hospital", "general"),
    ("Diagnostic & Consultation Centre", "diagnostic"),
    ("Eye Hospital & Phaco Centre", "eye"),
    ("Maternity & Child Health Clinic", "maternity"),
    ("Dental Care & Implant Centre", "dental"),
    ("Cardiac & Vascular Care Hospital", "specialized"),
    ("Kidney & Dialysis Care Center", "specialized"),
    ("Orthopedic & Spine Care Center", "specialized"),
]

all_hospital_data = list(TOP_HOSPITAL_NAMES)

for prefix in hospital_prefixes:
    for suffix, htype in hospital_suffixes:
        if len(all_hospital_data) >= 225:
            break
        area_name, lat, lon = random.choice(DHAKA_AREAS)
        lat_jitter = lat + random.uniform(-0.008, 0.008)
        lon_jitter = lon + random.uniform(-0.008, 0.008)
        hname = f"{prefix} {suffix} {area_name}"
        haddress = f"Plot {random.randint(1, 150)}, Road {random.randint(1, 30)}, {area_name}, Dhaka"
        phone = f"+8801{random.choice(['7','8','9','3','5'])}{random.randint(10000000, 99999999)}"
        em_phone = f"+8801{random.choice(['7','8','9'])}{random.randint(10000000, 99999999)}"
        beds = random.randint(30, 250)
        avail = random.randint(5, int(beds * 0.4))
        est = random.randint(1995, 2023)
        all_hospital_data.append((
            hname, htype, haddress, area_name,
            round(lat_jitter, 5), round(lon_jitter, 5),
            phone, em_phone, f"https://{slugify(prefix)}.com.bd",
            beds, avail, est
        ))

created_hospitals = []
department_objects_by_hospital = {}

with transaction.atomic():
    for item in all_hospital_data:
        hname, htype, haddress, harea, hlat, hlon, hphone, hem_phone, hweb, hbeds, havail, hest = item
        rating = round(random.uniform(4.2, 4.95), 1)
        reviews_cnt = random.randint(45, 850)
        
        h = Hospital.objects.create(
            name=hname,
            slug=slugify(hname)[:210],
            hospital_type=htype,
            description=f"{hname} is an accredited healthcare institution located in {harea}, Dhaka, providing clinical diagnostics, certified medical faculty consultations, state-of-the-art operation theaters, and patient care services.",
            address=haddress,
            division="Dhaka",
            district="Dhaka",
            city="Dhaka",
            area=harea,
            latitude=hlat,
            longitude=hlon,
            phone=hphone,
            emergency_phone=hem_phone,
            email=f"info@{slugify(hname)[:30]}.com.bd",
            website=hweb,
            emergency_available=True,
            open_24_hours=True,
            ambulance_available=random.choice([True, False]),
            bed_count=hbeds,
            available_beds=havail,
            established_year=hest,
            is_verified=True,
            status='active',
            average_rating=rating,
            review_count=reviews_cnt
        )
        created_hospitals.append(h)
        
        # Main Branch
        HospitalBranch.objects.create(
            hospital=h,
            name="Main Campus",
            address=haddress,
            division="Dhaka",
            district="Dhaka",
            city="Dhaka",
            area=harea,
            phone=hphone,
            telephones=f"{hphone}, {hem_phone}",
            latitude=hlat,
            longitude=hlon,
            opening_hours="24/7 Emergency & OPD (8:00 AM - 10:00 PM)",
            status='active'
        )
        
        # Departments
        dept_names = random.sample([
            "Cardiology", "Neurology", "Nephrology", "Orthopedics", "Pediatrics",
            "Gynecology & Obstetrics", "Dermatology", "Gastroenterology", "General Surgery",
            "Internal Medicine", "Oncology", "Urology", "Ophthalmology", "ENT & Head Neck Surgery",
            "Psychiatry", "Endocrinology", "Pulmonology & Chest Medicine"
        ], k=random.randint(5, 10))
        
        dept_objs = []
        for dname in dept_names:
            dept = Department.objects.create(
                hospital=h,
                name=dname,
                slug=slugify(dname)[:170],
                description=f"Department of {dname} at {h.name} offering diagnostics, inpatient management, and specialized consultant chambers.",
                status='active',
                average_rating=round(random.uniform(4.0, 5.0), 1),
                review_count=random.randint(15, 200)
            )
            dept_objs.append(dept)
        
        department_objects_by_hospital[h.id] = dept_objs

print(f"  ✓ {len(created_hospitals)} Hospitals and hospital departments seeded in Dhaka.")

# 5. SEED 1,000+ SPECIALIST DOCTORS
print("\n[5/6] Seeding 1,000 Specialist Doctors across Dhaka Hospitals...")

FIRST_NAMES_MALE = [
    "Mahmudur", "Farhan", "Tanvir", "Sajjad", "Mustafizur", "Nazrul", "Ashraf",
    "Tariq", "Ziaur", "Monirul", "Sharif", "Enamul", "Rashed", "Syed", "Kamrul",
    "Shahidul", "Jahangir", "Matiur", "Habibur", "Anisur", "Sirajul", "Rafiqul",
    "Shafiqul", "Aminul", "Golam", "Kawsar", "Zahid", "Mizanur", "Mahbub", "Fazle",
    "Tawfiq", "Saifullah", "Zubair", "Muhib", "Shohel", "Imran", "Nayeem", "Ariful"
]

FIRST_NAMES_FEMALE = [
    "Nusrat", "Tasnim", "Farhana", "Sabrina", "Sadia", "Ruma", "Nazneen",
    "Shireen", "Laila", "Salma", "Rumana", "Nasrin", "Tahmina", "Shamima",
    "Farzana", "Rehana", "Khadija", "Afroza", "Jesmin", "Sultana", "Ferdousi",
    "Ayesha", "Rashida", "Zakia", "Shahnaz", "Dilruba", "Sanjida", "Mousumi",
    "Sharmin", "Nafisa", "Samia", "Jannatul", "Ishrat", "Munira", "Fariha"
]

LAST_NAMES = [
    "Rahman", "Ahmed", "Khan", "Hossain", "Islam", "Chowdhury", "Hasan", "Ali",
    "Mahmud", "Alam", "Haque", "Sikder", "Talukder", "Sarker", "Bhuiyan", "Karim",
    "Miah", "Paul", "Roy", "Das", "Sen", "Datta", "Bhowmik", "Mazumder", "Gazi",
    "Kabir", "Munshi", "Dewan", "Khandakar", "Mirza", "Pramanik", "Howlader"
]

TITLES_DESIGNATIONS = [
    ("Prof. Dr.", "Professor & Head of Department"),
    ("Prof. Dr.", "Senior Professor"),
    ("Assoc. Prof. Dr.", "Associate Professor"),
    ("Asst. Prof. Dr.", "Assistant Professor"),
    ("Dr.", "Senior Consultant"),
    ("Dr.", "Consultant Physician"),
    ("Dr.", "Chief Resident Specialist"),
]

SPECIALTY_QUALIFICATIONS = {
    "Cardiology": [
        "MBBS, MD (Cardiology), FACC (USA), FSCAI (USA)",
        "MBBS, FCPS (Medicine), MD (Cardiology), Fellow Interventional Cardiology (Singapore)",
        "MBBS, MRCP (UK), MD (Cardiology), FRCP (Edin)",
        "MBBS, D-Card (DU), FCPS (Medicine), FESC"
    ],
    "Neurology": [
        "MBBS, MD (Neurology), PhD (Japan), Fellow Stroke Unit",
        "MBBS, FCPS (Medicine), MD (Neurology), Fellow Movement Disorders",
        "MBBS, MRCP (UK), FRCP (Glasgow), MD (Neurology)"
    ],
    "Orthopedics": [
        "MBBS, MS (Orthopedics), Fellow Joint Replacement (India), AO Trauma Fellow",
        "MBBS, D-Ortho, MS (Orthopedic Surgery), Spine Surgery Fellow (Seoul)",
        "MBBS, FCPS (Surgery), MS (Orthopedics), Arthroscopy Specialist"
    ],
    "Pediatrics": [
        "MBBS, FCPS (Pediatrics), MD (Child Health), DCH (Glasgow)",
        "MBBS, DCH, MD (Pediatrics), Fellow Neonatology (Australia)",
        "MBBS, MRCPCH (UK), FCPS (Pediatrics)"
    ],
    "Gynecology & Obstetrics": [
        "MBBS, FCPS (Obstetrics & Gynecology), MS (Gynae), Fellow Infertility & Laparoscopy",
        "MBBS, DGO, FCPS (Gynae), Fellow Maternal-Fetal Medicine (UK)",
        "MBBS, MRCOG (London), FRCOG (UK), MS (Gynae & Obs)"
    ],
    "Dermatology": [
        "MBBS, DDV, FCPS (Dermatology & Venereology), Aesthetic Laser Fellow (Bangkok)",
        "MBBS, MD (Dermatology), Fellow American Academy of Dermatology",
        "MBBS, DVD, MCPS, FCPS (Skin & Sex)"
    ],
    "Gastroenterology": [
        "MBBS, MD (Gastroenterology), FACG (USA), Interventional Endoscopy Fellow",
        "MBBS, FCPS (Medicine), MD (Gastroenterology)",
        "MBBS, MRCP (UK), MD (Hepatology & Gastro)"
    ],
    "General Surgery": [
        "MBBS, FCPS (Surgery), MS (General Surgery), FRCS (Edin), Laparoscopic Surgeon",
        "MBBS, FCPS (Surgery), FRCS (Glasgow), Colorectal Surgery Specialist",
        "MBBS, MS (General Surgery), FMAS (Minimal Access Surgery)"
    ],
    "Internal Medicine": [
        "MBBS, FCPS (Internal Medicine), MRCP (UK), FACP (USA)",
        "MBBS, MD (Internal Medicine), MACP (USA)",
        "MBBS, FCPS (Medicine), FRCP (London)"
    ],
    "Oncology": [
        "MBBS, FCPS (Radiotherapy), MD (Medical Oncology), ESMO Certified",
        "MBBS, MPhil, FCPS (Oncology), Radiation Oncology Fellow (Germany)",
        "MBBS, MS (Surgical Oncology), Fellow Surgical Oncology (Tata Memorial)"
    ],
    "Urology": [
        "MBBS, MS (Urology), Fellow Endourology & Renal Transplant (Austria)",
        "MBBS, FCPS (Surgery), MS (Urology), Laser Urolithiasis Fellow",
        "MBBS, FRCS (Urol), MS (Urology)"
    ],
    "Ophthalmology": [
        "MBBS, FCPS (Ophthalmology), MS (Eye), Fellow Phaco & Refractive Surgery",
        "MBBS, DO, FCPS (Eye), Vitreo-Retina Fellow (India)",
        "MBBS, FICO (UK), FCPS (Ophthalmology), Glaucoma Specialist"
    ],
    "ENT & Head Neck Surgery": [
        "MBBS, DLO, MS (ENT), Fellow Endoscopic Sinus Surgery (UK)",
        "MBBS, FCPS (ENT), Head & Neck Cancer Specialist",
        "MBBS, MS (Otolaryngology), Micro-Ear Surgery Fellow"
    ],
    "Nephrology": [
        "MBBS, MD (Nephrology), Fellow Clinical Nephrology & Dialysis (Canada)",
        "MBBS, FCPS (Medicine), MD (Nephrology), Renal Transplant Physician"
    ],
    "Psychiatry": [
        "MBBS, MD (Psychiatry), MPhil, Fellow World Psychiatric Association",
        "MBBS, FCPS (Psychiatry), Child & Adolescent Mental Health Fellow"
    ],
    "Endocrinology": [
        "MBBS, MD (Endocrinology & Metabolism), MACE (USA)",
        "MBBS, DEM, FCPS (Medicine), MD (Diabetes & Endocrine)"
    ],
    "Pulmonology & Chest Medicine": [
        "MBBS, DTCD, MD (Chest Diseases), FCCP (USA)",
        "MBBS, FCPS (Medicine), MD (Pulmonology), Sleep Medicine Fellow"
    ]
}

created_doctors = []

with transaction.atomic():
    for i in range(1000):
        gender = random.choice(['male', 'female'])
        fname = random.choice(FIRST_NAMES_MALE if gender == 'male' else FIRST_NAMES_FEMALE)
        lname = random.choice(LAST_NAMES)
        
        title, designation = random.choice(TITLES_DESIGNATIONS)
        full_doctor_name = f"{title} {fname} {lname}"
        
        spec_name = random.choice(list(SPECIALTY_QUALIFICATIONS.keys()))
        spec_obj = specialist_objects.get(spec_name, list(specialist_objects.values())[0])
        degrees = random.choice(SPECIALTY_QUALIFICATIONS[spec_name])
        
        fee = random.choice([800, 1000, 1200, 1500, 1800, 2000, 2500])
        phone = f"+8801{random.choice(['7','8','9','3','5'])}{random.randint(10000000, 99999999)}"
        rating = round(random.uniform(4.5, 5.0), 1)
        reviews_count = random.randint(18, 420)
        
        hospital = random.choice(created_hospitals)
        dept_list = department_objects_by_hospital.get(hospital.id, [])
        dept_obj = next((d for d in dept_list if d.name.lower() in spec_name.lower()), (dept_list[0] if dept_list else None))
        
        doc = Doctor.objects.create(
            full_name=full_doctor_name,
            gender=gender,
            mobile=phone,
            email=f"dr.{slugify(fname)}.{slugify(lname)}{random.randint(10,999)}@gmail.com",
            professional_summary=f"{full_doctor_name} is a distinguished {designation} specializing in {spec_name} with over {random.randint(8, 30)} years of clinical excellence, research publications, and inpatient care experience.",
            degree_summary=degrees,
            experience_summary=f"{random.randint(8, 28)}+ years of active clinical practice in major tertiary hospitals in Bangladesh and abroad.",
            current_position=f"{designation}, Department of {spec_name}",
            education=f"MBBS (Dhaka University / Chittagong University / Rajshahi University)\nPostgraduate Qualifications: {degrees}",
            previous_experience=f"Former Registrar and Specialist Consultant at BSMMU & Dhaka Medical College Hospital.",
            appointment_number=f"{phone}, Hotlines: 10616 / 10606",
            friday_reservation_information="Friday evening chambers available with prior reservation from 5:00 PM to 9:00 PM.",
            additional_information="Please arrive with all previous medical records, prescriptions, and recent diagnostic lab reports.",
            consultation_fee=fee,
            is_active=True,
            is_verified=True,
            average_rating=rating,
            review_count=reviews_count
        )
        doc.specialists.add(spec_obj)
        created_doctors.append(doc)
        
        # Affiliations
        DoctorHospital.objects.create(
            doctor=doc,
            hospital=hospital,
            department=dept_obj,
            position=designation,
            status='active'
        )
        
        branch = hospital.branches.first()
        if branch:
            DoctorBranch.objects.create(
                doctor=doc,
                branch=branch,
                room_number=f"Room {random.randint(101, 899)} (Building {random.choice(['A', 'B', 'C', 'Main'])})",
                status='active'
            )
        
        # Add Weekly Schedules (3-5 days per week)
        days_to_practice = random.sample(range(7), k=random.randint(3, 5))
        for d in days_to_practice:
            shift_type = random.choice(['morning', 'evening', 'overnight'])
            if shift_type == 'morning':
                st, et = time(9, 0), time(13, 30)
            elif shift_type == 'evening':
                st, et = time(17, 0), time(21, 30)
            else:
                st, et = time(20, 0), time(8, 0)
            
            DoctorSchedule.objects.create(
                doctor=doc,
                hospital=hospital,
                day_of_week=d,
                start_time=st,
                end_time=et,
                appointment_type=random.choice(['general', 'specialist', 'follow_up']),
                maximum_appointments=random.randint(15, 30),
                status='active'
            )

print(f"  [OK] {len(created_doctors)} Doctors created with hospital affiliations and weekly schedules.")

# 6. SEED REVIEWS & RATINGS
print("\n[6/6] Seeding patient reviews & rating points...")

SAMPLE_REVIEW_COMMENTS = [
    "Extremely thorough examination. Took the time to explain the diagnosis clearly and adjusted my medications effectively.",
    "Very humble and compassionate doctor. The diagnosis was spot on and my recovery was remarkably swift.",
    "Outstanding consultant. Handled my parent's surgery with utmost professionalism. Highly recommended.",
    "Clean and well-organized chamber. The appointment was on time and the doctor's explanation was very reassuring.",
    "One of the best specialists in Dhaka. Very knowledgeable and caring approach to patients.",
    "Excellent diagnostic acumen. I had been suffering for months until this doctor correctly diagnosed the underlying cause.",
    "Friendly staff, modern diagnostic facility, and the doctor gave ample time during consultation.",
    "Great bedside manner and clear lifestyle recommendations alongside medication."
]

review_users = []
patient_hashed_pw = make_password('patient1234')
with transaction.atomic():
    for idx in range(30):
        u = User.objects.create(
            email=f"patient.user{idx+1}@gmail.com",
            password=patient_hashed_pw,
            is_active=True,
            is_email_verified=True
        )
        u.roles.add(role_citizen)
        p, _ = UserProfile.objects.get_or_create(user=u)
        p.full_name = f"{random.choice(FIRST_NAMES_MALE + FIRST_NAMES_FEMALE)} {random.choice(LAST_NAMES)}"
        p.gender = random.choice(['M', 'F'])
        p.save()
        review_users.append(u)

reviews_batch = []
for doc in created_doctors[:300]:
    chosen_reviewers = random.sample(review_users, k=random.randint(2, 5))
    for u in chosen_reviewers:
        reviews_batch.append(Review(
            reviewer=u,
            service_id=doc.id,
            service_type='doctor',
            rating=random.choice([4, 5, 5, 5]),
            comment=random.choice(SAMPLE_REVIEW_COMMENTS),
            is_approved=True
        ))

for hosp in created_hospitals[:150]:
    chosen_reviewers = random.sample(review_users, k=random.randint(2, 4))
    for u in chosen_reviewers:
        reviews_batch.append(Review(
            reviewer=u,
            service_id=hosp.id,
            service_type='hospital',
            rating=random.choice([4, 5, 5]),
            comment=f"{hosp.name} provides first-class clinical response, clean patient cabins, and courteous nurses.",
            is_approved=True
        ))

Review.objects.bulk_create(reviews_batch, ignore_conflicts=True)
print(f"  [OK] {len(reviews_batch)} Patient reviews and verified ratings seeded.")

# 7. SEED 1,000+ BLOOD DONORS & REQUESTS
print("\n[7/7] Seeding 1,000+ Voluntary Blood Donors across Dhaka...")

donor_hashed_pw = make_password('donor1234')
with transaction.atomic():
    for idx in range(1000):
        bg = random.choice(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        area_name, lat, lon = random.choice(DHAKA_AREAS)
        lat_jitter = lat + random.uniform(-0.015, 0.015)
        lon_jitter = lon + random.uniform(-0.015, 0.015)
        
        fname = random.choice(FIRST_NAMES_MALE if random.random() > 0.3 else FIRST_NAMES_FEMALE)
        lname = random.choice(LAST_NAMES)
        phone = f"+8801{random.choice(['7','8','9','3','5'])}{random.randint(10000000, 99999999)}"
        
        u = User.objects.create(
            email=f"donor.{slugify(fname)}.{slugify(lname)}{random.randint(100,99999)}@gmail.com",
            password=donor_hashed_pw,
            is_active=True,
            is_email_verified=True
        )
        u.roles.add(role_citizen)
        
        p, _ = UserProfile.objects.get_or_create(user=u)
        p.full_name = f"{fname} {lname}"
        p.phone = phone
        p.address = f"House {random.randint(1,100)}, Road {random.randint(1,25)}, {area_name}, Dhaka"
        p.gender = random.choice(['M', 'F'])
        p.latitude = lat_jitter
        p.longitude = lon_jitter
        p.save()
        
        BloodDonor.objects.create(
            user=u,
            blood_group=bg,
            latitude=round(lat_jitter, 5),
            longitude=round(lon_jitter, 5),
            is_available=random.choice([True, True, True, False]),
            last_donated_at=date.today() - timedelta(days=random.randint(95, 450)),
            total_donations=random.randint(1, 18)
        )

print(f"  [OK] 1,000 Voluntary Blood Donors created with coordinates & phone numbers.")

# Seed Active Emergency Blood Requests
print("  Seeding sample emergency blood transfusion broadcasts...")
with transaction.atomic():
    for _ in range(40):
        u = random.choice(review_users)
        hosp = random.choice(created_hospitals[:40])
        bg = random.choice(['A+', 'B+', 'O+', 'AB+', 'O-', 'A-'])
        urg = random.choice(['critical', 'high', 'medium'])
        phone_num = f"+88017{random.randint(10000000, 99999999)}"
        BloodRequest.objects.create(
            requester=u,
            blood_group=bg,
            units_needed=random.randint(1, 4),
            units_fulfilled=0,
            patient_name=f"{random.choice(FIRST_NAMES_MALE + FIRST_NAMES_FEMALE)} {random.choice(LAST_NAMES)}",
            hospital_name=hosp.name,
            latitude=hosp.latitude,
            longitude=hosp.longitude,
            urgency=urg,
            status='open',
            notes=f"Urgent blood requirement for surgery/transfusion at {hosp.name}. Contact: {phone_num}"
        )

print("  [OK] 40 Live emergency blood requests seeded.")

print("\n" + "=" * 70)
print("ALL SEEDING COMPLETED SUCCESSFULLY!")
print(f"Superuser Account  -> Email: admin@admin.com | Password: admin1234")
print(f"Total Hospitals    -> {Hospital.objects.count()}")
print(f"Total Doctors      -> {Doctor.objects.count()}")
print(f"Total Blood Donors -> {BloodDonor.objects.count()}")
print(f"Total Reviews      -> {Review.objects.count()}")
print("=" * 70)
