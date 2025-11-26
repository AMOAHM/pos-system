from rest_framework import permissions

class HasShopAccess(permissions.BasePermission):
    """
    Permission to check if user has access to the shop
    """
    def has_permission(self, request, view):
        user = request.user
        
        # Admins have access to everything
        if user.role == 'admin':
            return True
        
        # For POST/PUT/PATCH, check shop_id in request data
        if request.method in ['POST', 'PUT', 'PATCH']:
            shop_id = request.data.get('shop_id') or request.data.get('shop')
            if shop_id:
                return user.assigned_shops.filter(id=shop_id).exists()
        
        # For GET requests, will be filtered in queryset
        return True
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Admins have access to everything
        if user.role == 'admin':
            return True
        
        # Check if user has access to the object's shop
        if hasattr(obj, 'shop'):
            return user.assigned_shops.filter(id=obj.shop.id).exists()
        
        return False