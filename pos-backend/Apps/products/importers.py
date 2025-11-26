# apps/products/importers.py
import csv
import pandas as pd
from decimal import Decimal
from django.db import transaction
from .models import Product, Supplier, SupplierInfo
from shops.models import Shop


class ProductImporter:
    """Handle batch product import from CSV/Excel"""
    
    REQUIRED_FIELDS = ['sku', 'name', 'unit_price', 'shop_id']
    OPTIONAL_FIELDS = [
        'description', 'reorder_level', 'current_stock',
        'supplier_id', 'supplier_sku', 'cost_price'
    ]
    
    def __init__(self, file_path, user):
        self.file_path = file_path
        self.user = user
        self.errors = []
        self.success_count = 0
        self.update_count = 0
        self.skip_count = 0
    
    def import_from_csv(self):
        """Import products from CSV file"""
        try:
            df = pd.read_csv(self.file_path)
            return self._process_dataframe(df)
        except Exception as e:
            self.errors.append(f"Failed to read CSV: {str(e)}")
            return False
    
    def import_from_excel(self):
        """Import products from Excel file"""
        try:
            df = pd.read_excel(self.file_path)
            return self._process_dataframe(df)
        except Exception as e:
            self.errors.append(f"Failed to read Excel: {str(e)}")
            return False
    
    def _process_dataframe(self, df):
        """Process pandas dataframe"""
        
        # Validate columns
        missing_fields = set(self.REQUIRED_FIELDS) - set(df.columns)
        if missing_fields:
            self.errors.append(
                f"Missing required columns: {', '.join(missing_fields)}"
            )
            return False
        
        # Process each row
        for index, row in df.iterrows():
            try:
                self._process_row(row, index + 2)  # +2 for header and 0-index
            except Exception as e:
                self.errors.append(f"Row {index + 2}: {str(e)}")
                self.skip_count += 1
        
        return True
    
    @transaction.atomic
    def _process_row(self, row, row_number):
        """Process a single row"""
        
        # Validate required fields
        for field in self.REQUIRED_FIELDS:
            if pd.isna(row[field]) or str(row[field]).strip() == '':
                raise ValueError(f"Missing required field: {field}")
        
        # Get or validate shop
        try:
            shop = Shop.objects.get(id=int(row['shop_id']))
        except Shop.DoesNotExist:
            raise ValueError(f"Shop not found: {row['shop_id']}")
        
        # Check user permission
        if self.user.role != 'admin' and shop not in self.user.assigned_shops.all():
            raise ValueError(f"No permission to import to shop: {shop.name}")
        
        # Prepare product data
        product_data = {
            'sku': str(row['sku']).strip(),
            'name': str(row['name']).strip(),
            'description': str(row.get('description', '')).strip(),
            'unit_price': Decimal(str(row['unit_price'])),
            'reorder_level': int(row.get('reorder_level', 10)),
            'shop': shop,
            'created_by': self.user
        }
        
        # Create or update product
        product, created = Product.objects.update_or_create(
            sku=product_data['sku'],
            shop=shop,
            defaults=product_data
        )
        
        # Update stock if provided
        if 'current_stock' in row and not pd.isna(row['current_stock']):
            stock = int(row['current_stock'])
            if created:
                product.current_stock = stock
            else:
                # Add to existing stock
                product.current_stock += stock
            product.save()
        
        # Handle supplier info
        if 'supplier_id' in row and not pd.isna(row['supplier_id']):
            try:
                supplier = Supplier.objects.get(id=int(row['supplier_id']))
                
                supplier_data = {
                    'supplier_sku': str(row.get('supplier_sku', '')).strip(),
                    'cost_price': Decimal(str(row.get('cost_price', row['unit_price'])))
                }
                
                SupplierInfo.objects.update_or_create(
                    supplier=supplier,
                    product=product,
                    defaults=supplier_data
                )
            except Supplier.DoesNotExist:
                self.errors.append(
                    f"Row {row_number}: Supplier not found: {row['supplier_id']}"
                )
        
        if created:
            self.success_count += 1
        else:
            self.update_count += 1
    
    def get_summary(self):
        """Get import summary"""
        return {
            'success_count': self.success_count,
            'update_count': self.update_count,
            'skip_count': self.skip_count,
            'errors': self.errors,
            'total_processed': self.success_count + self.update_count + self.skip_count
        }


class ProductExporter:
    """Handle batch product export to CSV/Excel"""
    
    def __init__(self, queryset):
        self.queryset = queryset
    
    def export_to_csv(self, file_path):
        """Export products to CSV"""
        import csv
        
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = [
                'id', 'sku', 'name', 'description', 'unit_price',
                'current_stock', 'reorder_level', 'shop_id', 'shop_name',
                'is_active', 'created_at'
            ]
            
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for product in self.queryset:
                writer.writerow({
                    'id': product.id,
                    'sku': product.sku,
                    'name': product.name,
                    'description': product.description,
                    'unit_price': float(product.unit_price),
                    'current_stock': product.current_stock,
                    'reorder_level': product.reorder_level,
                    'shop_id': product.shop.id,
                    'shop_name': product.shop.name,
                    'is_active': product.is_active,
                    'created_at': product.created_at.isoformat()
                })
    
    def export_to_excel(self, file_path):
        """Export products to Excel"""
        data = []
        
        for product in self.queryset:
            # Get supplier info
            supplier_info = product.supplierinfo_set.filter(
                is_primary=True
            ).first()
            
            data.append({
                'ID': product.id,
                'SKU': product.sku,
                'Name': product.name,
                'Description': product.description,
                'Unit Price': float(product.unit_price),
                'Current Stock': product.current_stock,
                'Reorder Level': product.reorder_level,
                'Shop ID': product.shop.id,
                'Shop Name': product.shop.name,
                'Supplier': supplier_info.supplier.name if supplier_info else '',
                'Supplier SKU': supplier_info.supplier_sku if supplier_info else '',
                'Cost Price': float(supplier_info.cost_price) if supplier_info else '',
                'Is Active': product.is_active,
                'Created At': product.created_at.isoformat()
            })
        
        df = pd.DataFrame(data)
        df.to_excel(file_path, index=False, engine='openpyxl')
