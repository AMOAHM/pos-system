# apps/sales/serializers.py
from rest_framework import serializers
from .models import Sale, SaleItem
from products.models import Product
from decimal import Decimal


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    
    class Meta:
        model = SaleItem
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'quantity', 'unit_price', 'discount', 'subtotal'
        ]
        read_only_fields = ['id', 'subtotal']


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    cashier_name = serializers.CharField(source='cashier.username', read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    items_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Sale
        fields = [
            'id', 'shop', 'shop_name', 'cashier', 'cashier_name',
            'total_amount', 'payment_method', 'status',
            'paystack_reference', 'customer_name', 'customer_phone',
            'customer_email', 'notes', 'items', 'items_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'cashier', 'status', 'paystack_reference',
            'created_at', 'updated_at'
        ]


class CreateSaleSerializer(serializers.Serializer):
    """Serializer for creating a sale with items"""
    shop_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(
        choices=['cash', 'mobile_money', 'card']
    )
    
    # Customer info (optional)
    customer_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    customer_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    customer_email = serializers.EmailField(required=False, allow_blank=True)
    
    notes = serializers.CharField(required=False, allow_blank=True)
    
    # Line items
    items = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    
    def validate_items(self, items):
        """Validate sale items structure"""
        for item in items:
            if 'product_id' not in item:
                raise serializers.ValidationError("Each item must have a product_id")
            if 'quantity' not in item or item['quantity'] < 1:
                raise serializers.ValidationError("Each item must have a positive quantity")
            if 'unit_price' not in item:
                raise serializers.ValidationError("Each item must have a unit_price")
            
            # Validate discount
            discount = Decimal(str(item.get('discount', 0)))
            if discount < 0:
                raise serializers.ValidationError("Discount cannot be negative")
        
        return items
    
    def validate(self, data):
        """Validate shop access and stock availability"""
        request = self.context.get('request')
        user = request.user
        shop_id = data['shop_id']
        
        # Check shop access
        from shops.models import Shop
        try:
            shop = Shop.objects.get(id=shop_id)
        except Shop.DoesNotExist:
            raise serializers.ValidationError("Shop not found")
        
        if not user.is_admin and shop not in user.assigned_shops.all():
            raise serializers.ValidationError(
                "You don't have permission to create sales in this shop"
            )
        
        # Validate stock availability
        for item in data['items']:
            try:
                product = Product.objects.select_for_update().get(
                    id=item['product_id'],
                    shop=shop
                )
                if product.current_stock < item['quantity']:
                    raise serializers.ValidationError(
                        f"Insufficient stock for {product.name}. "
                        f"Available: {product.current_stock}, Requested: {item['quantity']}"
                    )
            except Product.DoesNotExist:
                raise serializers.ValidationError(
                    f"Product {item['product_id']} not found in this shop"
                )
        
        return data


class SaleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for sale lists"""
    cashier_name = serializers.CharField(source='cashier.username', read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    items_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Sale
        fields = [
            'id', 'shop_name', 'cashier_name', 'total_amount',
            'payment_method', 'status', 'items_count', 'created_at'
        ]