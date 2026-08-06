import uuid
from django.db import models
from django.contrib.auth import get_user_model
from rest_framework import serializers, viewsets, permissions
from rest_framework.response import Response
from django.urls import path, include
from rest_framework.routers import DefaultRouter

User = get_user_model()


class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    service_id = models.UUIDField(db_index=True)
    service_type = models.CharField(max_length=50, default='service')  # service|hospital|doctor
    rating = models.PositiveSmallIntegerField()  # 1-5
    comment = models.TextField()
    is_approved = models.BooleanField(default=True)
    is_flagged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reviews'
        ordering = ['-created_at']
        unique_together = ['reviewer', 'service_id']


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.profile.full_name', read_only=True)
    reviewer_avatar = serializers.CharField(source='reviewer.profile.avatar_url', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'service_id', 'service_type', 'rating', 'comment',
            'is_approved', 'reviewer_name', 'reviewer_avatar', 'created_at',
        ]
        read_only_fields = ['id', 'reviewer_name', 'reviewer_avatar', 'is_approved', 'created_at']

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Review.objects.filter(is_approved=True).select_related('reviewer__profile')
        service_id = self.request.query_params.get('service_id')
        if service_id:
            qs = qs.filter(service_id=service_id)
        return qs

    def perform_create(self, serializer):
        review = serializer.save(reviewer=self.request.user)
        # Update average rating on service
        self._update_rating(review.service_id, review.service_type)

    def _update_rating(self, service_id, service_type):
        from django.db.models import Avg, Count
        reviews = Review.objects.filter(service_id=service_id, is_approved=True)
        agg = reviews.aggregate(avg=Avg('rating'), count=Count('id'))
        avg = round(agg['avg'] or 0, 2)
        count = agg['count']
        try:
            if service_type == 'hospital':
                from apps.healthcare.models import Hospital
                Hospital.objects.filter(id=service_id).update(average_rating=avg)
            elif service_type == 'doctor':
                from apps.healthcare.models import Doctor
                Doctor.objects.filter(id=service_id).update(average_rating=avg)
            else:
                from apps.services.models import ServiceListing
                ServiceListing.objects.filter(id=service_id).update(average_rating=avg, review_count=count)
        except Exception:
            pass
