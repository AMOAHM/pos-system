# apps/analytics/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Avg, F
from django.utils import timezone
from datetime import timedelta
from .models import AnalyticsSnapshot, PredictiveMetric
from .serializers import AnalyticsSnapshotSerializer
from .metrics import AnalyticsEngine
from users.permissions import IsManagerOrAdmin


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsManagerOrAdmin])
def analytics_dashboard(request):
    """Get comprehensive analytics dashboard"""
    shop_id = request.query_params.get('shop')
    
    if not shop_id:
        return Response(
            {'error': 'Shop ID required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    from shops.models import Shop
    try:
        shop = Shop.objects.get(id=shop_id)
    except Shop.DoesNotExist:
        return Response(
            {'error': 'Shop not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permission
    user = request.user
    if user.role != 'admin' and shop not in user.assigned_shops.all():
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get analytics engine
    engine = AnalyticsEngine(shop)
    
    # Get today's snapshot
    today_snapshot = engine.generate_daily_snapshot()
    
    # Get trends
    trends = engine.calculate_trends(days=30)
    
    return Response({
        'today': AnalyticsSnapshotSerializer(today_snapshot).data,
        'trends': trends,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsManagerOrAdmin])
def analytics_trends(request):
    """Get analytics trends over time"""
    shop_id = request.query_params.get('shop')
    days = int(request.query_params.get('days', 30))
    
    from shops.models import Shop
    shop = Shop.objects.get(id=shop_id)
    
    engine = AnalyticsEngine(shop)
    trends = engine.calculate_trends(days=days)
    
    return Response(trends)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsManagerOrAdmin])
def predict_demand(request):
    """Predict product demand"""
    product_id = request.query_params.get('product_id')
    days_ahead = int(request.query_params.get('days_ahead', 7))
    shop_id = request.query_params.get('shop')
    
    from shops.models import Shop
    shop = Shop.objects.get(id=shop_id)
    
    engine = AnalyticsEngine(shop)
    prediction = engine.predict_demand(product_id, days_ahead)
    
    return Response({
        'product_id': product_id,
        'days_ahead': days_ahead,
        'predicted_quantity': prediction
    })
