from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    HospitalViewSet,
    HospitalBranchViewSet,
    DepartmentViewSet,
    SpecialistViewSet,
    DoctorViewSet,
    DoctorScheduleViewSet,
    DoctorLeaveViewSet,
    AppointmentViewSet,
    FavoriteViewSet,
    HealthcareSearchView,
)

router = DefaultRouter()
router.register('hospitals', HospitalViewSet, basename='hospital')
router.register('branches', HospitalBranchViewSet, basename='hospital-branch')
router.register('departments', DepartmentViewSet, basename='department')
router.register('specialists', SpecialistViewSet, basename='specialist')
router.register('doctors', DoctorViewSet, basename='doctor')
router.register('schedules', DoctorScheduleViewSet, basename='doctor-schedule')
router.register('leaves', DoctorLeaveViewSet, basename='doctor-leave')
router.register('appointments', AppointmentViewSet, basename='appointment')
router.register('favorites', FavoriteViewSet, basename='favorite')

urlpatterns = [
    path('search/', HealthcareSearchView.as_view(), name='healthcare-search'),
    path('', include(router.urls)),
]
