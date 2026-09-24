from django.urls import path
from .views import dashboard_summary, daily_users, appointment_trends, blood_stats

urlpatterns = [
    path('dashboard/', dashboard_summary, name='dashboard-summary'),
    path('overview/', dashboard_summary, name='dashboard-overview'),
    path('daily-users/', daily_users, name='daily-users'),
    path('appointment-trends/', appointment_trends, name='appointment-trends'),
    path('blood-stats/', blood_stats, name='blood-stats'),
]
