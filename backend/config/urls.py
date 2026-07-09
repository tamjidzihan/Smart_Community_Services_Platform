from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),

    # API v1
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/services/', include('apps.services.urls')),
    path('api/v1/healthcare/', include('apps.healthcare.urls')),
    path('api/v1/blood/', include('apps.blood.urls')),
    path('api/v1/ambulance/', include('apps.ambulance.urls')),
    path('api/v1/education/', include('apps.education.urls')),
    path('api/v1/ngo/', include('apps.ngo.urls')),
    path('api/v1/government/', include('apps.government.urls')),
    path('api/v1/reviews/', include('apps.reviews.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/ai/', include('apps.ai_assistant.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),

    # Social Auth
    path('social-auth/', include('social_django.urls', namespace='social')),

    # API Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
