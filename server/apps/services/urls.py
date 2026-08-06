from django.urls import path, include
from rest_framework.routers import SimpleRouter
from . import views

router = SimpleRouter()
router.register('categories', views.ServiceCategoryViewSet, basename='categories')
router.register('listings', views.ServiceListingViewSet, basename='listings')

urlpatterns = [
    path('', include(router.urls)),
    path('favorites/', views.FavoriteListView.as_view(), name='favorites'),
    path('provider/profile/', views.ProviderProfileView.as_view(), name='provider-profile'),
]
