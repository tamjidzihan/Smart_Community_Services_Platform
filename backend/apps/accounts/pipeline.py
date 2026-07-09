from .models import UserProfile, Role


def save_user_profile(backend, user, response, *args, **kwargs):
    """Save profile data from Google OAuth."""
    profile, created = UserProfile.objects.get_or_create(user=user)
    if created or not profile.full_name:
        profile.full_name = response.get('name', '')
        profile.avatar_url = response.get('picture', '')
        profile.save()
    if created:
        citizen_role, _ = Role.objects.get_or_create(name='citizen')
        user.roles.add(citizen_role)
    user.is_email_verified = True
    user.save(update_fields=['is_email_verified'])
