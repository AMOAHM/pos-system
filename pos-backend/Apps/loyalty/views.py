# apps/loyalty/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Customer, LoyaltyTransaction, LoyaltyReward
from .serializers import (
    CustomerSerializer, LoyaltyTransactionSerializer, 
    LoyaltyRewardSerializer
)
from users.permissions import IsManagerOrAdmin


class CustomerViewSet(viewsets.ModelViewSet):
    """Customer management for loyalty program"""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]
    
    def get_queryset(self):
        queryset = Customer.objects.filter(is_active=True)
        
        # Filter by search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(email__icontains=search) |
                models.Q(phone__icontains=search)
            )
        
        return queryset.order_by('-total_spent')
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get customer loyalty transaction history"""
        customer = self.get_object()
        transactions = LoyaltyTransaction.objects.filter(
            customer=customer
        ).order_by('-created_at')
        
        serializer = LoyaltyTransactionSerializer(transactions, many=True)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def earn_points(request):
    """Award loyalty points to customer"""
    customer_id = request.data.get('customer_id')
    sale_id = request.data.get('sale_id')
    amount = request.data.get('amount')
    
    try:
        customer = Customer.objects.get(id=customer_id)
    except Customer.DoesNotExist:
        return Response(
            {'error': 'Customer not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Calculate points
    points = customer.earn_points(float(amount))
    
    # Update customer stats
    customer.total_spent += float(amount)
    customer.visits_count += 1
    customer.last_visit = timezone.now()
    customer.tier = customer.calculate_tier()
    customer.save()
    
    # Create transaction record
    from sales.models import Sale
    sale = None
    if sale_id:
        try:
            sale = Sale.objects.get(id=sale_id)
        except Sale.DoesNotExist:
            pass
    
    LoyaltyTransaction.objects.create(
        customer=customer,
        transaction_type='earned',
        points=points,
        sale=sale,
        description=f'Points earned from purchase of ₵{amount}',
        balance_after=customer.loyalty_points,
        created_by=request.user
    )
    
    return Response({
        'points_earned': points,
        'total_points': customer.loyalty_points,
        'tier': customer.tier
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def redeem_reward(request):
    """Redeem loyalty points for reward"""
    customer_id = request.data.get('customer_id')
    reward_id = request.data.get('reward_id')
    purchase_amount = float(request.data.get('purchase_amount', 0))
    
    try:
        customer = Customer.objects.get(id=customer_id)
        reward = LoyaltyReward.objects.get(id=reward_id)
    except (Customer.DoesNotExist, LoyaltyReward.DoesNotExist):
        return Response(
            {'error': 'Customer or reward not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if can redeem
    can_redeem, message = reward.can_redeem(customer, purchase_amount)
    
    if not can_redeem:
        return Response(
            {'error': message},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Deduct points
    customer.loyalty_points -= reward.points_required
    customer.save()
    
    # Create transaction
    LoyaltyTransaction.objects.create(
        customer=customer,
        transaction_type='redeemed',
        points=-reward.points_required,
        reward=reward,
        description=f'Redeemed: {reward.name}',
        balance_after=customer.loyalty_points,
        created_by=request.user
    )
    
    # Calculate discount
    if reward.discount_type == 'percentage':
        discount_amount = purchase_amount * (reward.discount_value / 100)
    else:
        discount_amount = float(reward.discount_value)
    
    return Response({
        'points_redeemed': reward.points_required,
        'remaining_points': customer.loyalty_points,
        'discount_amount': discount_amount
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def loyalty_stats(request):
    """Get loyalty program statistics"""
    
    stats = {
        'total_customers': Customer.objects.filter(is_active=True).count(),
        'total_points': Customer.objects.aggregate(
            total=Sum('loyalty_points')
        )['total'] or 0,
        'rewards_redeemed': LoyaltyTransaction.objects.filter(
            transaction_type='redeemed'
        ).count(),
        'active_members': Customer.objects.filter(
            is_active=True,
            last_visit__gte=timezone.now() - timedelta(days=30)
        ).count(),
    }
    
    # Tier distribution
    for tier in ['bronze', 'silver', 'gold', 'platinum']:
        stats[f'{tier}_count'] = Customer.objects.filter(
            tier=tier,
            is_active=True
        ).count()
    
    return Response(stats)


class LoyaltyRewardViewSet(viewsets.ModelViewSet):
    """Loyalty rewards management"""
    queryset = LoyaltyReward.objects.filter(is_active=True)
    serializer_class = LoyaltyRewardSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]
