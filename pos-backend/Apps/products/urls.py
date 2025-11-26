from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, InventoryMovementViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'inventory-movements', InventoryMovementViewSet, basename='inventorymovement')


urlpatterns = [
    path('', include(router.urls)),
]