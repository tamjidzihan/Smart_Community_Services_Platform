from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import UserProfile, Role, EmailVerificationToken, PasswordResetToken

User = get_user_model()


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'full_name', 'phone', 'avatar_url', 'gender',
            'date_of_birth', 'address', 'latitude', 'longitude', 'bio',
        ]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    roles = RoleSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'is_email_verified', 'is_staff', 'is_superuser', 'date_joined',
            'profile', 'roles',
        ]
        read_only_fields = ['id', 'date_joined', 'is_email_verified', 'is_staff', 'is_superuser']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(max_length=150)

    class Meta:
        model = User
        fields = ['email', 'password', 'confirm_password', 'full_name']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        full_name = validated_data.pop('full_name')
        user = User.objects.create_user(**validated_data)
        # Assign citizen role by default
        citizen_role, _ = Role.objects.get_or_create(name='citizen')
        user.roles.add(citizen_role)
        # Create profile
        UserProfile.objects.create(user=user, full_name=full_name)
        # Create email verification token
        expires = timezone.now() + timedelta(hours=24)
        EmailVerificationToken.objects.create(user=user, expires_at=expires)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data['user'] = UserSerializer(user).data
        return data


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.UUIDField()

    def validate_token(self, value):
        try:
            token_obj = EmailVerificationToken.objects.get(token=value, is_used=False)
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError('Invalid or expired token.')
        if token_obj.expires_at < timezone.now():
            raise serializers.ValidationError('Token has expired.')
        self.token_obj = token_obj
        return value


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            self.user = User.objects.get(email=value)
        except User.DoesNotExist:
            # Don't reveal whether email exists
            self.user = None
        return value


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        try:
            token_obj = PasswordResetToken.objects.get(token=data['token'], is_used=False)
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError({'token': 'Invalid or expired reset token.'})
        if token_obj.expires_at < timezone.now():
            raise serializers.ValidationError({'token': 'Token has expired.'})
        self.token_obj = token_obj
        return data


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'full_name', 'phone', 'avatar_url', 'gender',
            'date_of_birth', 'address', 'latitude', 'longitude', 'bio',
        ]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data
