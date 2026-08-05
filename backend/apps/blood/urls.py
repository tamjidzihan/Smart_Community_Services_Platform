from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import BloodDonorViewSet, BloodRequestViewSet

router = SimpleRouter()
router.register('donors', BloodDonorViewSet, basename='donors')
router.register('requests', BloodRequestViewSet, basename='blood-requests')

urlpatterns = [path('', include(router.urls))]
