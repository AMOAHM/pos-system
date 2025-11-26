# apps/sales/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Sum, Count, F
from .models import Sale, SaleItem
from .serializers import (
    SaleSerializer, CreateSaleSerializer, SaleListSerializer
)
from users.permissions import HasShopAccess
from products.models import Product, InventoryMovement
import uuid


class SaleViewSet(viewsets.ModelViewSet):
    """Sales management"""
    permission_classes = [IsAuthenticated, HasShopAccess]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateSaleSerializer
        elif self.action == 'list':
            return SaleListSerializer
        return SaleSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Sale.objects.select_related(
            'shop', 'cashier'
        ).prefetch_related('items')
        
        # Filter by shop access
        if user.role != 'admin':
            queryset = queryset.filter(shop__in=user.assigned_shops.all())
        
        # Filter by shop query param
        shop_id = self.request.query_params.get('shop')
        if shop_id:
            queryset = queryset.filter(shop_id=shop_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        
        # Filter by status
        sale_status = self.request.query_params.get('status')
        if sale_status:
            queryset = queryset.filter(status=sale_status)
        
        return queryset.order_by('-created_at')
    
    @transaction.atomic
    def create(self, request):
        """Create a sale with items and handle payment"""
        serializer = CreateSaleSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Calculate total
        total_amount = sum(
            (item['unit_price'] * item['quantity']) - item.get('discount', 0)
            for item in data['items']
        )
        
        # Create sale
        from shops.models import Shop
        shop = Shop.objects.get(id=data['shop_id'])
        
        sale = Sale.objects.create(
            shop=shop,
            cashier=request.user,
            total_amount=total_amount,
            payment_method=data['payment_method'],
            customer_name=data.get('customer_name', ''),
            customer_phone=data.get('customer_phone', ''),
            customer_email=data.get('customer_email', ''),
            notes=data.get('notes', ''),
            status='pending'
        )
        
        # Create sale items and update stock
        for item_data in data['items']:
            product = Product.objects.select_for_update().get(
                id=item_data['product_id']
            )
            
            # Deduct stock
            product.current_stock -= item_data['quantity']
            product.save()
            
            # Create sale item
            SaleItem.objects.create(
                sale=sale,
                product=product,
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                discount=item_data.get('discount', 0)
            )
            
            # Record inventory movement
            InventoryMovement.objects.create(
                product=product,
                quantity=-item_data['quantity'],
                movement_type='sale',
                reference_id=str(sale.id),
                notes=f"Sale transaction",
                created_by=request.user
            )
        
        # Handle payment based on method
        if data['payment_method'] == 'cash':
            # Cash payment - mark as completed immediately
            sale.status = 'completed'
            sale.save()
            
            return Response(
                SaleSerializer(sale).data,
                status=status.HTTP_201_CREATED
            )
        
        else:
            # Mobile money or card - initiate Paystack payment
            from payments.paystack import PaystackClient
            
            paystack = PaystackClient()
            
            payment_data = paystack.initialize_transaction(
                email=data.get('customer_email', request.user.email),
                amount=int(total_amount * 100),  # Convert to kobo
                reference=str(sale.id),
                callback_url=f"{request.build_absolute_uri('/api/payments/paystack/callback/')}",
                metadata={
                    'sale_id': str(sale.id),
                    'shop_id': shop.id,
                    'cashier_id': request.user.id
                }
            )
            
            if payment_data:
                sale.paystack_reference = payment_data['reference']
                sale.save()
                
                return Response({
                    'sale': SaleSerializer(sale).data,
                    'payment': {
                        'authorization_url': payment_data['authorization_url'],
                        'access_code': payment_data['access_code'],
                        'reference': payment_data['reference']
                    }
                }, status=status.HTTP_201_CREATED)
            else:
                # Payment initialization failed
                sale.status = 'failed'
                sale.save()
                
                return Response(
                    {'error': 'Payment initialization failed'},
                    status=status.HTTP_400_BAD_REQUEST
                )
    
    @action(detail=True, methods=['get'], url_path='print-receipt')
    def print_receipt(self, request, pk=None):
        """Generate and download PDF receipt for a sale"""
        from django.http import FileResponse
        from .receipt_generator import ReceiptGenerator
        
        sale = self.get_object()
        
        # Only allow receipt printing for completed sales
        if sale.status != 'completed':
            return Response(
                {'error': 'Receipt can only be printed for completed sales'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate PDF receipt
        generator = ReceiptGenerator(sale)
        pdf_buffer = generator.generate_pdf()
        
        # Return PDF as downloadable file
        response = FileResponse(
            pdf_buffer,
            content_type='application/pdf',
            as_attachment=True,
            filename=f'receipt_{str(sale.id)[:8]}.pdf'
        )
        
        return response