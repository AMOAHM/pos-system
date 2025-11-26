# apps/shifts/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.ShiftViewSet, basename='shift')

urlpatterns = [
    path('clock-in/', views.clock_in, name='clock-in'),
    path('<int:shift_id>/clock-out/', views.clock_out, name='clock-out'),
    path('', include(router.urls)),
]

