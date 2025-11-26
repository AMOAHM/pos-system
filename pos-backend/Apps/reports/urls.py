# apps/reports/urls.py
from django.urls import path
from .views import SalesReportView, InventoryReportView

app_name = 'reports'

urlpatterns = [
    path('reports/sales/', SalesReportView.as_view(), name='sales-report'),
    path('reports/inventory/', InventoryReportView.as_view(), name='inventory-report'),
    path('reports/export/sales/', SalesReportView.as_view(), name='report-export-sales'),
]