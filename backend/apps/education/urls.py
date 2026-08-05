from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .models import InstitutionViewSet

router = SimpleRouter()
router.register('institutions', InstitutionViewSet, basename='institutions')

urlpatterns = [path('', include(router.urls))]
