# apps/products/models.py
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal


from suppliers.models import Supplier  # Import from suppliers app


# Local Supplier model removed - using suppliers.models.Supplier instead


class Product(models.Model):
    """Product model with shop isolation"""
    
    sku = models.CharField(max_length=100, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    current_stock = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    reorder_level = models.IntegerField(default=10, validators=[MinValueValidator(0)])
    shop = models.ForeignKey(
        'shops.Shop',
        on_delete=models.CASCADE,
        related_name='products'
    )
    suppliers = models.ManyToManyField(
        Supplier,
        through='SupplierInfo',
        related_name='products'
    )
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_products'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        unique_together = [['sku', 'shop']]
        indexes = [
            models.Index(fields=['shop', 'sku']),
            models.Index(fields=['shop', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.sku}) - {self.shop.name}"
    
    @property
    def is_low_stock(self):
        return self.current_stock <= self.reorder_level


class SupplierInfo(models.Model):
    """Through model for Product-Supplier relationship"""
    
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    supplier_sku = models.CharField(max_length=100, blank=True)
    cost_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = [['supplier', 'product']]
    
    def __str__(self):
        return f"{self.supplier.name} - {self.product.name}"


class InventoryMovement(models.Model):
    """Track all stock movements"""
    
    MOVEMENT_TYPES = (
        ('purchase', 'Purchase'),
        ('sale', 'Sale'),
        ('adjustment', 'Adjustment'),
        ('return', 'Return'),
    )
    
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='movements'
    )
    quantity = models.IntegerField()  # Positive for in, negative for out
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    reference_id = models.CharField(max_length=100, blank=True)  # Sale ID, PO number, etc.
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='inventory_movements'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.product.name}: {self.quantity} ({self.movement_type})"

