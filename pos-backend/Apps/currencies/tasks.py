# apps/currencies/tasks.py
from celery import shared_task
from .models import Currency
import logging

logger = logging.getLogger(__name__)


@shared_task
def update_exchange_rates():
    """Update currency exchange rates"""
    logger.info('Starting exchange rate update...')
    
    success = Currency.update_exchange_rates()
    
    if success:
        logger.info('Exchange rates updated successfully')
    else:
        logger.error('Failed to update exchange rates')
    
    return success
