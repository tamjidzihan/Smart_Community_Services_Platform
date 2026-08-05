AUDIT_PATHS = ['/api/v1/auth/', '/api/v1/ambulance/emergency/', '/api/v1/blood/requests/']


class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            if any(request.path.startswith(p) for p in AUDIT_PATHS):
                self._log(request, response)
        return response

    def _log(self, request, response):
        try:
            from .models import AuditLog
            user = request.user if request.user.is_authenticated else None
            AuditLog.objects.create(
                user=user,
                action=f'{request.method} {request.path}',
                ip_address=self._get_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                extra_data={'status_code': response.status_code},
            )
        except Exception:
            pass

    def _get_ip(self, request):
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
