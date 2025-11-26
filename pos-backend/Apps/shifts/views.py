# apps/shifts/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Shift, ShiftActivity
from .serializers import ShiftSerializer, ShiftActivitySerializer
from users.permissions import IsManagerOrAdmin


class ShiftViewSet(viewsets.ReadOnlyModelViewSet):
    """Shift management"""
    serializer_class = ShiftSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Shift.objects.select_related('cashier', 'shop')
        
        # Filter by user role
        if user.role == 'cashier':
            queryset = queryset.filter(cashier=user)
        elif user.role == 'manager':
            queryset = queryset.filter(shop__in=user.assigned_shops.all())
        
        # Filter by shop
        shop_id = self.request.query_params.get('shop')
        if shop_id:
            queryset = queryset.filter(shop_id=shop_id)
        
        # Filter by cashier
        cashier_id = self.request.query_params.get('cashier')
        if cashier_id:
            queryset = queryset.filter(cashier_id=cashier_id)
        
        # Filter by status
        shift_status = self.request.query_params.get('status')
        if shift_status:
            queryset = queryset.filter(status=shift_status)
        
        return queryset.order_by('-start_time')
    
    @action(detail=True, methods=['get'])
    def report(self, request, pk=None):
        """Get detailed shift report"""
        shift = self.get_object()
        
        # Get activities
        activities = ShiftActivity.objects.filter(shift=shift)
        
        return Response({
            'shift': ShiftSerializer(shift).data,
            'activities': ShiftActivitySerializer(activities, many=True).data
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def clock_in(request):
    """Clock in and start shift"""
    shop_id = request.data.get('shop_id')
    opening_cash = request.data.get('opening_cash')
    notes = request.data.get('notes', '')
    
    from shops.models import Shop
    try:
        shop = Shop.objects.get(id=shop_id)
    except Shop.DoesNotExist:
        return Response(
            {'error': 'Shop not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if user already has open shift
    existing_shift = Shift.objects.filter(
        cashier=request.user,
        status='open'
    ).first()
    
    if existing_shift:
        return Response(
            {'error': 'You already have an open shift'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create shift
    shift = Shift.objects.create(
        cashier=request.user,
        shop=shop,
        opening_cash=opening_cash,
        opening_notes=notes,
        status='open'
    )
    
    # Create activity
    ShiftActivity.objects.create(
        shift=shift,
        activity_type='clock_in',
        notes=notes
    )
    
    return Response(
        ShiftSerializer(shift).data,
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def clock_out(request, shift_id):
    """Clock out and close shift"""
    closing_cash = request.data.get('closing_cash')
    notes = request.data.get('notes', '')
    
    try:
        shift = Shift.objects.get(id=shift_id, cashier=request.user)
    except Shift.DoesNotExist:
        return Response(
            {'error': 'Shift not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if shift.status != 'open':
        return Response(
            {'error': 'Shift is not open'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Close shift
    shift = shift.close_shift(closing_cash, request.user, notes)
    
    # Create activity
    ShiftActivity.objects.create(
        shift=shift,
        activity_type='clock_out',
        amount=closing_cash,
        notes=notes
    )
    
    return Response(ShiftSerializer(shift).data)
