# apps/payments/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('paystack/callback/', views.paystack_callback, name='paystack-callback'),
    path('paystack/webhook/', views.paystack_webhook, name='paystack-webhook'),
]