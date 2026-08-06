from django.urls import path
from .views import chat, chat_history, recommendations

urlpatterns = [
    path('chat/', chat, name='ai-chat'),
    path('chat/history/', chat_history, name='ai-chat-history'),
    path('recommend/', recommendations, name='ai-recommendations'),
]
