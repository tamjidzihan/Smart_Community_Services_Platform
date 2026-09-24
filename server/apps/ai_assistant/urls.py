from django.urls import path
from .views import chat, chat_history, recommendations

urlpatterns = [
    path('chat/', chat, name='ai-chat'),
    path('chat/history/', chat_history, name='ai-chat-history'),
    path('history/', chat_history, name='ai-history'),
    path('sessions/', chat_history, name='ai-sessions'),
    path('recommend/', recommendations, name='ai-recommendations'),
]
