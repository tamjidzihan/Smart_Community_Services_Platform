from django.contrib import admin
from .models import AIConversation


@admin.register(AIConversation)
class AIConversationAdmin(admin.ModelAdmin):
    list_display = ['user', 'session_id', 'role', 'intent', 'created_at']
    list_filter = ['role', 'intent', 'created_at']
    search_fields = ['user__email', 'session_id', 'content', 'intent']
    date_hierarchy = 'created_at'
