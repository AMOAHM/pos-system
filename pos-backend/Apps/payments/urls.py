from django.urls import path
from . import views

urlpatterns = [
    path('plans/', views.plans_list, name='plans-list'),
    path('create/', views.create_subscription, name='subscription-create'),
    path('current/', views.current_subscription, name='subscription-current'),
    path('cancel/', views.cancel_subscription, name='subscription-cancel'),
    path('upgrade/', views.upgrade_subscription, name='subscription-upgrade'),
    path('initialize-subscription/', views.initialize_subscription, name='subscription-initialize'),
    path('verify-subscription/', views.verify_subscription_payment, name='subscription-verify'),
    # existing endpoints for paystack
    path('paystack/callback/', views.paystack_callback, name='paystack-callback'),
    path('paystack/webhook/', views.paystack_webhook, name='paystack-webhook'),
]