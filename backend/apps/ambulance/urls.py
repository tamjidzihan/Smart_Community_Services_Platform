from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import AmbulanceViewSet, EmergencyRequestViewSet, EmergencyContactViewSet

router = SimpleRouter()
router.register('vehicles', AmbulanceViewSet, basename='ambulances')
router.register('emergency', EmergencyRequestViewSet, basename='emergency')
router.register('contacts', EmergencyContactViewSet, basename='emergency-contacts')

urlpatterns = [path('', include(router.urls))]
