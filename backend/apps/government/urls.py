from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .models import GovernmentOfficeViewSet, GovernmentServiceViewSet

router = SimpleRouter()
router.register('offices', GovernmentOfficeViewSet, basename='gov-offices')
router.register('services', GovernmentServiceViewSet, basename='gov-services')

urlpatterns = [path('', include(router.urls))]

