

# apps/notifications/tasks.py
from celery import shared_task
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from products.models import Product
from shops.models import Shop
from datetime import timedelta
from django.utils import timezone


@shared_task
def check_low_stock_alerts():
    """Check for low stock and send email notifications"""
    
    # Get all low stock products
    low_stock_products = Product.objects.filter(
        is_active=True,
        current_stock__lte=models.F('reorder_level')
    ).select_related('shop')
    
    # Group by shop
    shops_products = {}
    for product in low_stock_products:
        if product.shop.id not in shops_products:
            shops_products[product.shop.id] = {
                'shop': product.shop,
                'products': []
            }
        shops_products[product.shop.id]['products'].append(product)
    
    # Send email for each shop
    for shop_data in shops_products.values():
        send_low_stock_email(shop_data['shop'], shop_data['products'])


def send_low_stock_email(shop, products):
    """Send low stock alert email"""
    
    # Get shop managers and admin emails
    from users.models import User
    recipients = User.objects.filter(
        models.Q(role='admin') | 
        (models.Q(role='manager') & models.Q(assigned_shops=shop))
    ).values_list('email', flat=True)
    
    if not recipients:
        return
    
    # Render email
    html_content = render_to_string(
        'emails/low_stock_alert.html',
        {
            'shop': shop,
            'products': products,
            'count': len(products)
        }
    )
    
    text_content = f"""
    Low Stock Alert - {shop.name}
    
    The following products are running low on stock:
    
    {chr(10).join([f"- {p.name} ({p.sku}): {p.current_stock} remaining" for p in products])}
    
    Please reorder these items soon.
    """
    
    # Send email
    email = EmailMultiAlternatives(
        subject=f'Low Stock Alert - {shop.name}',
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=list(recipients)
    )
    email.attach_alternative(html_content, "text/html")
    email.send()


@shared_task
def send_daily_summary_emails():
    """Send daily summary emails to managers and admin"""
    
    from users.models import User
    from analytics.models import AnalyticsSnapshot
    
    yesterday = timezone.now().date() - timedelta(days=1)
    
    # Get all shops
    shops = Shop.objects.filter(is_active=True)
    
    for shop in shops:
        # Get yesterday's snapshot
        try:
            snapshot = AnalyticsSnapshot.objects.get(
                shop=shop,
                date=yesterday,
                period_type='daily'
            )
        except AnalyticsSnapshot.DoesNotExist:
            continue
        
        # Get recipients
        recipients = User.objects.filter(
            models.Q(role='admin') | 
            (models.Q(role='manager') & models.Q(assigned_shops=shop))
        ).values_list('email', flat=True)
        
        if not recipients:
            continue
        
        # Render and send email
        html_content = render_to_string(
            'emails/daily_summary.html',
            {
                'shop': shop,
                'snapshot': snapshot,
                'date': yesterday
            }
        )
        
        email = EmailMultiAlternatives(
            subject=f'Daily Summary - {shop.name} - {yesterday}',
            body=f'Daily summary for {shop.name}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=list(recipients)
        )
        email.attach_alternative(html_content, "text/html")
     