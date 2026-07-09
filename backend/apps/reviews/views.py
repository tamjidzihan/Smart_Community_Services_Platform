from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework import serializers, viewsets, permissions
from .models import Review, ReviewSerializer


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
