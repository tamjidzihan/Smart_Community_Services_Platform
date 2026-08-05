from rest_framework import generics, permissions, serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.urls import path
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'body', 'data', 'is_read', 'created_at']


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.filter(user=self.request.user)
        unread_only = self.request.query_params.get('unread') == 'true'
        if unread_only:
            qs = qs.filter(is_read=False)
        return qs


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_all_read(request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'message': 'All notifications marked as read.'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_one_read(request, pk):
    Notification.objects.filter(id=pk, user=request.user).update(is_read=True)
    return Response({'message': 'Notification marked as read.'})


urlpatterns = [
    path('', NotificationListView.as_view(), name='notifications'),
    path('mark-all-read/', mark_all_read, name='mark-all-read'),
    path('<uuid:pk>/read/', mark_one_read, name='mark-one-read'),
]
