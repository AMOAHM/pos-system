# Main URLs update - pos_project/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


   


urlpatterns = [
    
    path('admin/', admin.site.urls),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path('api/auth/', include('users.urls')), 
    path('api/shops/', include('shops.urls')),
    path('api/', include('products.urls')),
    path('api/sales/', include('sales.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/', include('reports.urls')),
    path('api/', include('suppliers.urls')),
    path('api/analytics/', include('analytics.urls')),  # NEW
    path('api/loyalty/', include('loyalty.urls')),      # NEW
    path('api/shifts/', include('shifts.urls')),        # NEW
    path('api/currencies/', include('currencies.urls')),# NEW
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)


# settings.py update for Celery Beat schedule
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    # Check low stock every day at 9 AM
    'check-low-stock-daily': {
        'task': 'notifications.tasks.check_low_stock_alerts',
        'schedule': crontab(hour=9, minute=0),
    },
    # Send daily summary at 6 PM
    'daily-summary': {
        'task': 'notifications.tasks.send_daily_summary_emails',
        'schedule': crontab(hour=18, minute=0),
    },
    # Update currency rates daily at 1 AM
    'update-currency-rates': {
        'task': 'currencies.tasks.update_exchange_rates',
        'schedule': crontab(hour=1, minute=0),
    },
    # Generate analytics snapshots at midnight
    'generate-analytics': {
        'task': 'analytics.tasks.generate_daily_snapshots',
        'schedule': crontab(hour=0, minute=0),
    },
    # Cleanup old snapshots weekly (Sunday at 2 AM)
    'cleanup-snapshots': {
        'task': 'analytics.tasks.cleanup_old_snapshots',
        'schedule': crontab(hour=2, minute=0, day_of_week=0),
    },
}