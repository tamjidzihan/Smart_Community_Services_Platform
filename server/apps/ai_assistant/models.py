import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class AIConversation(models.Model):
    ROLE_CHOICES = [('user', 'User'), ('assistant', 'Assistant')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_conversations')
    session_id = models.CharField(max_length=100, db_index=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    intent = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_conversations'
        ordering = ['created_at']
        indexes = [models.Index(fields=['user', 'session_id'])]
