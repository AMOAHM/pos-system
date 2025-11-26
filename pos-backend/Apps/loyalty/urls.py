# apps/loyalty/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'customers', views.CustomerViewSet, basename='customer')
router.register(r'rewards', views.LoyaltyRewardViewSet, basename='reward')

urlpatterns = [
    path('earn-points/', views.earn_points, name='earn-points'),
    path('redeem-reward/', views.redeem_reward, name='redeem-reward'),
    path('stats/', views.loyalty_stats, name='loyalty-stats'),
    path('', include(router.urls)),
]
