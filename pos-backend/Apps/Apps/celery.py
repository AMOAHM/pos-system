from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from celery.schedules import crontab

# Set default Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pos_project.settings')

app = Celery('pos_project')

# Load config from Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all apps
app.autodiscover_tasks()

# Configure queues
app.conf.task_routes = {
    'apps.notifications.tasks.send_email': {'queue': 'high_priority'},
    'apps.notifications.tasks.check_low_stock_alerts': {'queue': 'default'},
    'apps.analytics.tasks.generate_snapshot': {'queue': 'low_priority'},
}

# Configure beat schedule
app.conf.beat_schedule = {
    # Check low stock every day at 9 AM
    'check-low-stock-daily': {
        'task': 'apps.notifications.tasks.check_low_stock_alerts',
        'schedule': crontab(hour=9, minute=0),
    },
    # Send daily summary at 6 PM
    'daily-summary': {
        'task': 'apps.notifications.tasks.send_daily_summary_emails',
        'schedule': crontab(hour=18, minute=0),
    },
    # Update currency rates daily at 1 AM
    'update-currency-rates': {
        'task': 'apps.currencies.tasks.update_exchange_rates',
        'schedule': crontab(hour=1, minute=0),
    },
    # Generate analytics snapshots at midnight
    'generate-analytics': {
        'task': 'apps.analytics.tasks.generate_daily_snapshots',
        'schedule': crontab(hour=0, minute=0),
    },
}

# Celery configuration
app.conf.update(
    # Task settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Result backend settings
    result_expires=3600,
    
    # Worker settings
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
)


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
