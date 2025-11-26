
# apps/analytics/metrics.py
from django.db.models import Sum, Count, Avg, F, Q
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from sales.models import Sale, SaleItem
from products.models import Product
from .models import AnalyticsSnapshot


class AnalyticsEngine:
    """Core analytics calculation engine"""
    
    def __init__(self, shop, date=None):
        self.shop = shop
        self.date = date or timezone.now().date()
    
    def generate_daily_snapshot(self):
        """Generate daily analytics snapshot"""
        
        # Get sales for the day
        sales = Sale.objects.filter(
            shop=self.shop,
            status='completed',
            created_at__date=self.date
        )
        
        # Basic metrics
        total_revenue = sales.aggregate(total=Sum('total_amount'))['total'] or 0
        total_transactions = sales.count()
        
        avg_transaction = (
            total_revenue / total_transactions if total_transactions > 0 else 0
        )
        
        # Items sold
        total_items = SaleItem.objects.filter(
            sale__in=sales
        ).aggregate(total=Sum('quantity'))['total'] or 0
        
        # Payment method breakdown
        cash_revenue = sales.filter(
            payment_method='cash'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        card_revenue = sales.filter(
            payment_method='card'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        mobile_money_revenue = sales.filter(
            payment_method='mobile_money'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Customer metrics
        unique_customers = sales.filter(
            customer_email__isnull=False
        ).values('customer_email').distinct().count()
        
        # Top products
        top_products = SaleItem.objects.filter(
            sale__in=sales
        ).values(
            'product__id',
            'product__name',
            'product__sku'
        ).annotate(
            quantity=Sum('quantity'),
            revenue=Sum('subtotal')
        ).order_by('-revenue')[:10]
        
        # Stock levels
        products = Product.objects.filter(shop=self.shop, is_active=True)
        low_stock = products.filter(
            current_stock__lte=F('reorder_level')
        ).count()
        out_of_stock = products.filter(current_stock=0).count()
        
        # Cashier performance
        cashier_perf = {}
        for sale in sales.select_related('cashier'):
            cashier_id = str(sale.cashier.id)
            if cashier_id not in cashier_perf:
                cashier_perf[cashier_id] = {
                    'name': sale.cashier.username,
                    'transactions': 0,
                    'revenue': 0
                }
            cashier_perf[cashier_id]['transactions'] += 1
            cashier_perf[cashier_id]['revenue'] += float(sale.total_amount)
        
        # Peak hour
        peak_hour = sales.extra(
            select={'hour': 'EXTRACT(hour FROM created_at)'}
        ).values('hour').annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        # Create or update snapshot
        snapshot, created = AnalyticsSnapshot.objects.update_or_create(
            shop=self.shop,
            date=self.date,
            period_type='daily',
            defaults={
                'total_revenue': total_revenue,
                'total_transactions': total_transactions,
                'average_transaction_value': avg_transaction,
                'total_items_sold': total_items,
                'cash_revenue': cash_revenue,
                'card_revenue': card_revenue,
                'mobile_money_revenue': mobile_money_revenue,
                'unique_customers': unique_customers,
                'top_products': list(top_products),
                'low_stock_items': low_stock,
                'out_of_stock_items': out_of_stock,
                'cashier_performance': cashier_perf,
                'peak_hour': peak_hour['hour'] if peak_hour else None,
            }
        )
        
        return snapshot
    
    def calculate_trends(self, days=30):
        """Calculate trends over period"""
        
        end_date = self.date
        start_date = end_date - timedelta(days=days)
        
        snapshots = AnalyticsSnapshot.objects.filter(
            shop=self.shop,
            date__range=(start_date, end_date),
            period_type='daily'
        ).order_by('date')
        
        if not snapshots.exists():
            return None
        
        # Calculate trends
        revenue_trend = []
        transaction_trend = []
        
        for snapshot in snapshots:
            revenue_trend.append({
                'date': snapshot.date.isoformat(),
                'value': float(snapshot.total_revenue)
            })
            transaction_trend.append({
                'date': snapshot.date.isoformat(),
                'value': snapshot.total_transactions
            })
        
        # Calculate growth rate
        first_week_revenue = sum(
            s.total_revenue for s in snapshots[:7]
        )
        last_week_revenue = sum(
            s.total_revenue for s in snapshots[-7:]
        )
        
        growth_rate = (
            ((last_week_revenue - first_week_revenue) / first_week_revenue * 100)
            if first_week_revenue > 0 else 0
        )
        
        return {
            'revenue_trend': revenue_trend,
            'transaction_trend': transaction_trend,
            'growth_rate': float(growth_rate),
            'average_daily_revenue': float(
                snapshots.aggregate(avg=Avg('total_revenue'))['avg']
            ),
            'total_revenue': float(
                snapshots.aggregate(total=Sum('total_revenue'))['total']
            ),
            'total_transactions': snapshots.aggregate(
                total=Sum('total_transactions')
            )['total']
        }
    
    def predict_demand(self, product_id, days_ahead=7):
        """Simple demand forecasting using moving average"""
        
        # Get historical sales data
        end_date = self.date
        start_date = end_date - timedelta(days=30)
        
        sales_data = SaleItem.objects.filter(
            product_id=product_id,
            sale__shop=self.shop,
            sale__status='completed',
            sale__created_at__date__range=(start_date, end_date)
        ).extra(
            select={'date': 'DATE(sale__created_at)'}
        ).values('date').annotate(
            quantity=Sum('quantity')
        ).order_by('date')
        
        if not sales_data:
            return 0
        
        # Calculate moving average
        quantities = [item['quantity'] for item in sales_data]
        moving_avg = sum(quantities[-7:]) / min(7, len(quantities))
        
        # Predict for days ahead
        predicted = moving_avg * days_ahead
        
        return int(predicted)
