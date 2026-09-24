from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

# Add this health check view
def health_check(request):
    return JsonResponse({
        "status": "healthy",
        "service": "SCSP API",
        "version": "1.0.0"
    })

def root_view(request):
    return JsonResponse({
        "message": "Welcome to Smart Health Platform API",
        "docs": "/api/docs/",
        "admin": "/admin/",
        "endpoints": {
            "auth": "/api/v1/auth/",
            "healthcare": "/api/v1/healthcare/",
            "blood": "/api/v1/blood/",
            "reviews": "/api/v1/reviews/",
            "notifications": "/api/v1/notifications/",
            "ai": "/api/v1/ai/",
            "analytics": "/api/v1/analytics/",
        }
    })

urlpatterns = [
    # Root and health check
    path('', root_view, name='root'),
    path('health/', health_check, name='health_check'),
    path('healthz/', health_check, name='healthz'),
    
    # Admin
    path('admin/', admin.site.urls),

    # API v1
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/healthcare/', include('apps.healthcare.urls')),
    path('api/v1/blood/', include('apps.blood.urls')),
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