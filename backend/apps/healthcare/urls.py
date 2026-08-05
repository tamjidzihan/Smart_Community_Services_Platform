from django.urls import path, include
from rest_framework.routers import SimpleRouter
from apps.healthcare.views import HospitalViewSet, DoctorViewSet, AppointmentViewSet

router = SimpleRouter()
router.register(r'hospitals', HospitalViewSet, basename='hospital')
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'appointments', AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('', include(router.urls)),
]
