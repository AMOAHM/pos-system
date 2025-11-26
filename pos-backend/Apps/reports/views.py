# apps/reports/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.authentication import JWTAuthentication

from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import timedelta
from django.http import HttpResponse
import csv


# =====================================================================
# SALES REPORT (FUNCTION BASED — SIMPLE PLACEHOLDER)
# =====================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sales_report(request):
    """
    Simple test endpoint (unused)
    """
    return Response({"status": "success", "data": []})


# =====================================================================
# =====================================================================
# SALES REPORT (CLASS BASED — MAIN ENDPOINT)
# =====================================================================

class SalesReportView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from sales.models import Sale
        from django.db.models.functions import TruncDate
        from django.db.models import F

        user = request.user

        # FILTER SALES BY SHOP
        if user.role == 'admin':
            sales = Sale.objects.filter(status='completed')
        else:
            shop_ids = user.assigned_shops.values_list('id', flat=True)
            sales = Sale.objects.filter(shop_id__in=shop_ids, status='completed')

        today = timezone.now().date()

        # PERIODS
        month_start = today.replace(day=1)
        week_ago = today - timedelta(days=7)
        days_30_ago = today - timedelta(days=30)

        # AGGREGATIONS FOR SUMMARY
        today_sales = sales.filter(created_at__date=today).aggregate(
            total=Sum('total_amount'),
            count=Count('id')
        )
        month_sales = sales.filter(created_at__date__gte=month_start).aggregate(
            total=Sum('total_amount'),
            count=Count('id')
        )
        week_sales = sales.filter(created_at__date__gte=week_ago).aggregate(
            total=Sum('total_amount'),
            count=Count('id')
        )

        # Build a summary for total revenue and transactions
        total_revenue = float(
            (today_sales['total'] or 0) +
            (month_sales['total'] or 0) +
            (week_sales['total'] or 0)
        )
        total_transactions = (
            (today_sales['count'] or 0) +
            (month_sales['count'] or 0) +
            (week_sales['count'] or 0)
        )
        
        summary = {
            'total_revenue': total_revenue,
            'total_transactions': total_transactions,
        }

        # DAILY SALES DATA (last 30 days for chart)
        daily_sales_data = (
            sales.filter(created_at__date__gte=days_30_ago)
            .annotate(sale_date=TruncDate('created_at'))
            .values('sale_date')
            .annotate(
                total_revenue=Sum('total_amount'),
                transaction_count=Count('id')
            )
            .order_by('sale_date')
        )
        
        daily_sales = [
            {
                'date': item['sale_date'].isoformat(),
                'total_revenue': float(item['total_revenue'] or 0),
                'transaction_count': item['transaction_count']
            }
            for item in daily_sales_data
        ]

        # CATEGORY BREAKDOWN (by product categories in sale items)
        from sales.models import SaleItem
        
        category_sales = (
            SaleItem.objects.filter(sale__in=sales, sale__status='completed')
            .values(category_name=F('product__name'))
            .annotate(
                total_revenue=Sum(F('quantity') * F('unit_price')),
                total_quantity=Sum('quantity')
            )
            .order_by('-total_revenue')[:6]  # Top 6 categories
        )
        
        category_breakdown = [
            {
                'category_name': item['category_name'] or 'Uncategorized',
                'total_revenue': float(item['total_revenue'] or 0),
                'total_quantity': item['total_quantity']
            }
            for item in category_sales
        ]

        # WEEKLY SALES DATA (last 7 days)
        weekly_sales_data = (
            sales.filter(created_at__date__gte=week_ago)
            .annotate(sale_date=TruncDate('created_at'))
            .values('sale_date')
            .annotate(
                total_revenue=Sum('total_amount'),
                transaction_count=Count('id')
            )
            .order_by('sale_date')
        )
        
        weekly_sales = [
            {
                'date': item['sale_date'].isoformat(),
                'total_revenue': float(item['total_revenue'] or 0),
                'transaction_count': item['transaction_count']
            }
            for item in weekly_sales_data
        ]
        
        return Response({
            'summary': summary,
            'today': {
                'revenue': float(today_sales['total'] or 0),
                'transactions': today_sales['count'] or 0,
            },
            'this_month': {
                'revenue': float(month_sales['total'] or 0),
                'transactions': month_sales['count'] or 0
            },
            'last_7_days': {
                'revenue': float(week_sales['total'] or 0),
                'transactions': week_sales['count'] or 0
            },
            'daily_sales': daily_sales,
            'category_breakdown': category_breakdown,
            'weekly_sales': weekly_sales,
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_sales_csv(request):
    from sales.models import Sale

    user = request.user

    # FILTER BY SHOP
    if user.role == 'admin':
        sales = Sale.objects.filter(status='completed')
    else:
        shop_ids = user.assigned_shops.values_list('id', flat=True)
        sales = Sale.objects.filter(shop_id__in=shop_ids, status='completed')

    # CSV RESPONSE
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="sales_report.csv"'

    writer = csv.writer(response)
    writer.writerow(['ID', 'Shop', 'Total Amount', 'Status', 'Date'])

    for sale in sales:
        writer.writerow([
            sale.id,
            sale.shop.name if sale.shop else 'N/A',
            float(sale.total_amount),
            sale.status,
            sale.created_at.strftime('%Y-%m-%d %H:%M:%S')
        ])

    return response


# =====================================================================
# INVENTORY REPORT (FUNCTION BASED – SIMPLE VERSION)
# =====================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inventory_report(request):
    return Response({"status": "success", "data": []})


# =====================================================================
# INVENTORY REPORT (CLASS BASED — MAIN ENDPOINT)
# =====================================================================

class InventoryReportView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from products.models import Product

        user = request.user

        # FILTER PRODUCTS BY SHOP
        if user.role == 'admin':
            products = Product.objects.filter(is_active=True)
        else:
            shop_ids = user.assigned_shops.values_list('id', flat=True)
            products = Product.objects.filter(shop_id__in=shop_ids, is_active=True)

        # AGGREGATIONS
        total_products = products.count()
        low_stock = products.filter(current_stock__lte=F('reorder_level')).count()
        out_of_stock = products.filter(current_stock=0).count()

        # FIXED: Use unit_price instead of price
        inventory_value = products.aggregate(
            total=Sum(F('current_stock') * F('unit_price'))
        )

        # Return data under a 'summary' key to align with frontend expectations
        summary = {
            'total_products': total_products,
            'low_stock_items': low_stock,
            'out_of_stock_items': out_of_stock,
            'total_inventory_value': float(inventory_value['total'] or 0),
        }
        return Response({'summary': summary})


# =====================================================================
# INVENTORY CSV EXPORT
# =====================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_inventory_csv(request):
    from products.models import Product

    user = request.user

    if user.role == 'admin':
        products = Product.objects.filter(is_active=True)
    else:
        shop_ids = user.assigned_shops.values_list('id', flat=True)
        products = Product.objects.filter(shop_id__in=shop_ids, is_active=True)

    # CSV RESPONSE
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="inventory_report.csv"'

    writer = csv.writer(response)
    writer.writerow([
        'ID', 'Name', 'SKU', 'Shop', 'Current Stock',
        'Reorder Level', 'Unit Price', 'Total Value'
    ])

    for product in products:
        unit_price = float(product.unit_price or 0)
        value = product.current_stock * unit_price

        writer.writerow([
            product.id,
            product.name,
            product.sku,
            product.shop.name if product.shop else 'N/A',
            product.current_stock,
            product.reorder_level,
            unit_price,
            value
        ])

    return response
