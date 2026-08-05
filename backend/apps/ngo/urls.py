from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .models import NGOViewSet, VolunteerViewSet, NGOEventViewSet

router = SimpleRouter()
router.register('ngos', NGOViewSet, basename='ngos')
router.register('volunteers', VolunteerViewSet, basename='volunteers')
router.register('events', NGOEventViewSet, basename='ngo-events')

urlpatterns = [path('', include(router.urls))]
