# apps/users/permissions.py
from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Only admins can access"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsManagerOrAdmin(permissions.BasePermission):
    """Managers and admins can access"""
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'manager']
        )


class HasShopAccess(permissions.BasePermission):
    """Check if user has access to the shop"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins have access to all shops
        if request.user.role == 'admin':
            return True
        
        # For managers and cashiers, check shop assignment
        shop_id = request.data.get('shop_id') or request.query_params.get('shop')
        if shop_id:
            return request.user.assigned_shops.filter(id=shop_id).exists()
        
        return True  # Will be checked at object level
    
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        
        # Check if object has a shop attribute
        if hasattr(obj, 'shop'):
            return obj.shop in request.user.assigned_shops.all()
        
        return False

