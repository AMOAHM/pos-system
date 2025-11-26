from django.urls import path
from .views import SupplierListCreateView
from . import views
urlpatterns = [
    path('suppliers/', views.SupplierListCreateView.as_view(), name='supplier-list-create'),
]

