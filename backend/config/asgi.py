import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

django_asgi_app = get_asgi_application()

from apps.notifications.middleware import JWTAuthMiddleware
from apps.notifications import routing as notification_routing
from apps.ambulance import routing as ambulance_routing

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AllowedHostsOriginValidator(
        JWTAuthMiddleware(
            URLRouter(
                notification_routing.websocket_urlpatterns +
                ambulance_routing.websocket_urlpatterns
            )
        )
    ),
})
