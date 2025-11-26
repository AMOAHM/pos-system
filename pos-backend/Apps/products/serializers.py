# apps/products/serializers.py
from rest_framework import serializers
from .models import Product, Supplier, SupplierInfo, InventoryMovement
from decimal import Decimal


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'contact_person', 'email', 'phone',
            'address', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SupplierInfoSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    
    class Meta:
        model = SupplierInfo
        fields = [
            'id', 'supplier', 'supplier_name', 'supplier_sku',
            'cost_price', 'is_primary', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    supplier_info = SupplierInfoSerializer(
        source='supplierinfo_set',
        many=True,
        read_only=True
    )
    is_low_stock = serializers.BooleanField(read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'name', 'description', 'unit_price',
            'current_stock', 'reorder_level', 'shop', 'shop_name',
            'is_active', 'is_low_stock', 'supplier_info',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'current_stock', 'created_by', 'created_at', 'updated_at']
    
    def validate(self, data):
        # Ensure user has access to the shop
        request = self.context.get('request')
        if request and request.user:
            user = request.user
            shop = data.get('shop')
            
            if not user.is_admin and shop not in user.assigned_shops.all():
                raise serializers.ValidationError(
                    "You don't have permission to create products in this shop."
                )
        
        return data


class ProductCreateWithStockSerializer(serializers.Serializer):
    """Create or update product with initial stock"""
    sku = serializers.CharField(max_length=100)
    name = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))
    reorder_level = serializers.IntegerField(min_value=0, default=10)
    shop_id = serializers.IntegerField()
    
    # Stock addition fields
    quantity = serializers.IntegerField(min_value=1)
    supplier_id = serializers.IntegerField()
    supplier_sku = serializers.CharField(max_length=100, required=False, allow_blank=True)
    cost_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))


class InventoryMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = InventoryMovement
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'quantity',
            'movement_type', 'reference_id', 'notes', 'created_by',
            'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']

