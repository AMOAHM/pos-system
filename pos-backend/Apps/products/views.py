from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q, F
from django.http import HttpResponse
import os
import tempfile

#from users.permissions import HasShopAccess
from suppliers.models import Supplier  # Import from suppliers app
from .models import Product, InventoryMovement, SupplierInfo
from .serializers import (
    ProductSerializer,
    ProductCreateWithStockSerializer,
    InventoryMovementSerializer,
    SupplierInfoSerializer
    
)
from .importers import ProductImporter, ProductExporter


# ==============================
# Product Management
# ==============================
class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Product.objects.select_related('shop').prefetch_related('suppliers')

        # For non-admin users, filter by assigned shops
        if user.role != 'admin':
            queryset = queryset.filter(shop__in=user.assigned_shops.all())

        # Filter by query params - only for non-admin users
        shop_id = self.request.query_params.get('shop')
        if shop_id and user.role != 'admin':
            queryset = queryset.filter(shop_id=shop_id)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(sku__icontains=search) |
                Q(description__icontains=search)
            )

        low_stock = self.request.query_params.get('low_stock')
        if low_stock == 'true':
            queryset = queryset.filter(current_stock__lte=F('reorder_level'))

        # Admin sees all products (including inactive), others see only active
        if user.role == 'admin':
            return queryset
        return queryset.filter(is_active=True)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def add_with_stock(self, request):
        serializer = ProductCreateWithStockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Get or create product
        product, created = Product.objects.select_for_update().get_or_create(
            sku=data['sku'],
            shop_id=data['shop_id'],
            defaults={
                'name': data['name'],
                'description': data.get('description', ''),
                'unit_price': data['unit_price'],
                'reorder_level': data['reorder_level'],
                'created_by': request.user
            }
        )

        if not created:
            product.name = data['name']
            product.unit_price = data['unit_price']
            product.description = data.get('description', product.description)
            product.save()

        # Add stock
        product.current_stock += data['quantity']
        product.save()

        # Get supplier with error handling
        try:
            supplier = Supplier.objects.get(id=data['supplier_id'])
        except Supplier.DoesNotExist:
            return Response(
                {'error': f"Supplier with ID {data['supplier_id']} does not exist"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create supplier info
        SupplierInfo.objects.get_or_create(
            supplier=supplier,
            product=product,
            defaults={
                'supplier_sku': data.get('supplier_sku', ''),
                'cost_price': data['cost_price']
            }
        )

        # Record inventory movement
        InventoryMovement.objects.create(
            product=product,
            quantity=data['quantity'],
            movement_type='purchase',
            reference_id=f"SUP-{supplier.id}",
            notes=f"Stock added from {supplier.name}",
            created_by=request.user
        )

        return Response(
            ProductSerializer(product).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    # Import products from CSV/Excel
    @action(detail=False, methods=['post'])
    def import_products(self, request):
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES['file']
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.name)[1]) as tmp_file:
            for chunk in file.chunks():
                tmp_file.write(chunk)
            tmp_path = tmp_file.name

        try:
            importer = ProductImporter(tmp_path, request.user)
            if file.name.endswith('.csv'):
                success = importer.import_from_csv()
            elif file.name.endswith(('.xls', '.xlsx')):
                success = importer.import_from_excel()
            else:
                return Response({'error': 'Unsupported file format'}, status=status.HTTP_400_BAD_REQUEST)

            return Response({'success': success, 'summary': importer.get_summary()})
        finally:
            os.unlink(tmp_path)

    # Export products to CSV/Excel
    @action(detail=False, methods=['get'])
    def export_products(self, request):
        format_type = request.query_params.get('format', 'csv')
        queryset = self.filter_queryset(self.get_queryset())
        exporter = ProductExporter(queryset)

        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.csv' if format_type == 'csv' else '.xlsx')
        if format_type == 'csv':
            exporter.export_to_csv(tmp_file.name)
            content_type = 'text/csv'
            filename = 'products_export.csv'
        else:
            exporter.export_to_excel(tmp_file.name)
            content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            filename = 'products_export.xlsx'

        with open(tmp_file.name, 'rb') as f:
            response = HttpResponse(f.read(), content_type=content_type)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'

        os.unlink(tmp_file.name)
        return response


# ==============================
# Inventory Movements
# ==============================
class InventoryMovementViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InventoryMovementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = InventoryMovement.objects.select_related(
            'product', 'product__shop', 'created_by'
        )

        if user.role != 'admin':
            queryset = queryset.filter(product__shop__in=user.assigned_shops.all())

        # Optional filters
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)

        shop_id = self.request.query_params.get('shop')
        if shop_id:
            queryset = queryset.filter(product__shop_id=shop_id)

        return queryset
@action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
def test_auth(self, request):
    return Response({
        'user': str(request.user),
        'authenticated': request.user.is_authenticated,
        'message': 'Auth works!'
    })
