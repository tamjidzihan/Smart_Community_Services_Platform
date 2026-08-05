from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile, Role, EmailVerificationToken, PasswordResetToken


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = [UserProfileInline]
    list_display = ['email', 'is_active', 'is_email_verified', 'date_joined']
    list_filter = ['is_active', 'is_email_verified', 'roles']
    search_fields = ['email', 'profile__full_name']
    ordering = ['-date_joined']
    filter_horizontal = ['roles', 'groups', 'user_permissions']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'roles', 'groups', 'user_permissions')}),
        ('Status', {'fields': ('is_email_verified',)}),
    )
    add_fieldsets = (
        (None, {'classes': ('wide',), 'fields': ('email', 'password1', 'password2')}),
    )
