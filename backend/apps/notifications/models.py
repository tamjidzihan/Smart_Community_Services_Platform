import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Notification(models.Model):
    TYPE_CHOICES = [
        ('blood_request', 'Blood Request'),
        ('ambulance_dispatch', 'Ambulance Dispatch'),
        ('emergency_update', 'Emergency Update'),
        ('emergency_no_resource', 'No Resource'),
        ('appointment', 'Appointment'),
        ('review', 'Review'),
        ('system', 'System'),
        ('general', 'General'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='general')
    title = models.CharField(max_length=200)
    body = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.title} → {self.user.email}'

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [models.Index(fields=['user', 'is_read'])]
