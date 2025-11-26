# apps/analytics/tasks.py
from celery import shared_task
from django.utils import timezone
from .models import AnalyticsSnapshot
from .metrics import AnalyticsEngine
from shops.models import Shop
import logging

logger = logging.getLogger(__name__)


@shared_task
def generate_daily_snapshots():
    """Generate daily analytics snapshots for all shops"""
    logger.info('Generating daily analytics snapshots...')
    
    yesterday = timezone.now().date() - timedelta(days=1)
    shops = Shop.objects.filter(is_active=True)
    
    count = 0
    for shop in shops:
        try:
            engine = AnalyticsEngine(shop, yesterday)
            engine.generate_daily_snapshot()
            count += 1
        except Exception as e:
            logger.error(f'Failed to generate snapshot for {shop.name}: {str(e)}')
    
    logger.info(f'Generated {count} analytics snapshots')
    return count


@shared_task
def cleanup_old_snapshots():
    """Delete old analytics snapshots"""
    retention_days = 365
    cutoff_date = timezone.now().date() - timedelta(days=retention_days)
    
    deleted = AnalyticsSnapshot.objects.filter(
        date__lt=cutoff_date
    ).delete()
    
    logger.info(f'Deleted {deleted[0]} old snapshots')
    return deleted[0]