# apps/users/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')

urlpatterns = [
    # Authentication endpoints
    path('login/', views.login_view, name='login'),
    path('register-admin/', views.register_admin, name='register_admin'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('reset-password/', views.reset_password, name='reset_password'),
    
    # Password change with verification code (for logged-in users)
    path('send-verification-code/', views.send_verification_code, name='send_verification_code'),
    path('change-password/', views.change_password_with_code, name='change_password_with_code'),
    
    # User CRUD endpoints (includes: /users/, /users/<id>/, /users/<id>/change_password/, etc.)
    path('', include(router.urls)),
]