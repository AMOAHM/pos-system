# apps/shops/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Count, Sum, Q, F
from django.utils import timezone
from datetime import timedelta
from .models import Shop
from .serializers import ShopSerializer
from users.permissions import IsAdmin, HasShopAccess


class ShopViewSet(viewsets.ModelViewSet):
    """Shop management"""
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    authentication_classes = [JWTAuthentication]  # ADDED THIS
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'admin':
            return Shop.objects.filter(created_by=user)
        else:
            return user.assigned_shops.all()
    
    def get_permissions(self):
        """Only admins can create, update, delete shops"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        user = self.request.user
        
        try:
            from payments.models import Subscription
        except ImportError:
            Subscription = None

        if not Subscription:
            # Fallback if payments app is not integrated correctly
            serializer.save(created_by=user)
            return

        # Check subscription limit
        limit = Subscription.get_shop_limit(user)
        current_count = Shop.objects.filter(created_by=user).count()
        
        if current_count >= limit:
            from rest_framework.exceptions import PermissionDenied
            plan_name = "Trial" # Simplified
            raise PermissionDenied(f"Your current plan allows only {limit} shop(s). Please upgrade your subscription.")

        serializer.save(created_by=user)
    
    @action(detail=True, methods=['get'])
    def kpis(self, request, pk=None):
        """Get shop KPIs"""
        shop = self.get_object()
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        last_7_days = today - timedelta(days=7)
        
        from sales.models import Sale
        from products.models import Product
        
        # Today's sales
        today_sales = Sale.objects.filter(
            shop=shop,
            status='completed',
            created_at__date=today
        ).aggregate(
            total=Sum('total_amount'),
            count=Count('id')
        )
        
        # Yesterday's sales
        yesterday_sales = Sale.objects.filter(
            shop=shop,
            status='completed',
            created_at__date=yesterday
        ).aggregate(
            total=Sum('total_amount'),
            count=Count('id')
        )
        
        # Last 7 days
        week_sales = Sale.objects.filter(
            shop=shop,
            status='completed',
            created_at__date__gte=last_7_days
        ).aggregate(
            total=Sum('total_amount'),
            count=Count('id')
        )
        
        # Low stock products
        low_stock = Product.objects.filter(
            shop=shop,
            is_active=True,
            current_stock__lte=F('reorder_level')
        ).count()
        
        return Response({
            'today': {
                'revenue': today_sales['total'] or 0,
                'transactions': today_sales['count'] or 0
            },
            'yesterday': {
                'revenue': yesterday_sales['total'] or 0,
                'transactions': yesterday_sales['count'] or 0
            },
            'last_7_days': {
                'revenue': week_sales['total'] or 0,
                'transactions': week_sales['count'] or 0
            },
            'low_stock_count': low_stock
        })