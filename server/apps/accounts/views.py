from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q

from .models import  PasswordResetToken
from .serializers import (
    RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer,
    VerifyEmailSerializer, ForgotPasswordSerializer, ResetPasswordSerializer,
    UpdateProfileSerializer, ChangePasswordSerializer,
)
from .tasks import send_verification_email, send_password_reset_email
from utils.permissions import IsAdminRole

User = get_user_model()


class AuthThrottle(AnonRateThrottle):
    rate = '10/minute'
    scope = 'auth'


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Send verification email async
        token = user.verification_tokens.filter(is_used=False).first()
        if token:
            send_verification_email.delay(str(user.id), str(token.token))
        return Response(
            {'message': 'Registration successful. Please verify your email.', 'email': user.email},
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthThrottle]


class LogoutView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Logged out successfully.'})
        except Exception:
            return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailView(generics.GenericAPIView):
    serializer_class = VerifyEmailSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token_obj = serializer.token_obj
        token_obj.user.is_email_verified = True
        token_obj.user.save(update_fields=['is_email_verified'])
        token_obj.is_used = True
        token_obj.save(update_fields=['is_used'])
        return Response({'message': 'Email verified successfully.'})


class ForgotPasswordView(generics.GenericAPIView):
    serializer_class = ForgotPasswordSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthThrottle]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.user
        if user:
            expires = timezone.now() + timedelta(hours=1)
            token = PasswordResetToken.objects.create(user=user, expires_at=expires)
            send_password_reset_email.delay(str(user.id), str(token.token))
        # Always return 200 to prevent email enumeration
        return Response({'message': 'If this email exists, a reset link has been sent.'})


class ResetPasswordView(generics.GenericAPIView):
    serializer_class = ResetPasswordSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token_obj = serializer.token_obj
        user = token_obj.user
        user.set_password(serializer.validated_data['password'])
        user.save(update_fields=['password'])
        token_obj.is_used = True
        token_obj.save(update_fields=['is_used'])
        return Response({'message': 'Password reset successfully.'})


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def put(self, request, *args, **kwargs):
        profile = request.user.profile
        serializer = UpdateProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)

    def patch(self, request, *args, **kwargs):
        return self.put(request, *args, **kwargs)


class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Incorrect current password.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])
        return Response({'message': 'Password changed successfully.'})


@api_view(['GET'])
@permission_classes([IsAdminRole])
def admin_list_users(request):
    """Admin-only endpoint: paginated list of all users with search & role filter."""
    search = request.query_params.get('search', '').strip()
    role = request.query_params.get('role', '').strip()
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 20))

    qs = User.objects.select_related('profile').prefetch_related('roles').order_by('-date_joined')

    if search:
        qs = qs.filter(
            Q(email__icontains=search) |
            Q(profile__full_name__icontains=search) |
            Q(profile__phone__icontains=search)
        )

    if role:
        qs = qs.filter(roles__name=role)

    total = qs.count()
    start = (page - 1) * page_size
    end = start + page_size
    users = qs[start:end]

    results = []
    for u in users:
        profile = getattr(u, 'profile', None)
        results.append({
            'id': str(u.id),
            'email': u.email,
            'full_name': profile.full_name if profile else '',
            'phone': profile.phone if profile else '',
            'avatar_url': profile.avatar_url if profile else '',
            'address': profile.address if profile else '',
            'is_active': u.is_active,
            'is_email_verified': u.is_email_verified,
            'is_staff': u.is_staff,
            'date_joined': u.date_joined.isoformat(),
            'last_login': u.last_login.isoformat() if u.last_login else None,
            'roles': [r.name for r in u.roles.all()],
        })

    total_pages = (total + page_size - 1) // page_size
    return Response({
        'count': total,
        'total_pages': total_pages,
        'current_page': page,
        'results': results,
    })
