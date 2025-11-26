# apps/analytics/models.py
from django.db import models
from django.conf import settings
from django.contrib.postgres.fields import JSONField
from decimal import Decimal


class AnalyticsSnapshot(models.Model):
    """Daily analytics snapshot for each shop"""
    
    PERIOD_CHOICES = (
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    )
    
    shop = models.ForeignKey(
        'shops.Shop',
        on_delete=models.CASCADE,
        related_name='analytics_snapshots'
    )
    period_type = models.CharField(max_length=20, choices=PERIOD_CHOICES, default='daily')
    date = models.DateField(db_index=True)
    
    # Sales Metrics
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_transactions = models.IntegerField(default=0)
    average_transaction_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_items_sold = models.IntegerField(default=0)
    
    # Payment Method Breakdown
    cash_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    card_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    mobile_money_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Customer Metrics
    unique_customers = models.IntegerField(default=0)
    new_customers = models.IntegerField(default=0)
    returning_customers = models.IntegerField(default=0)
    
    # Product Performance
    top_products = models.JSONField(default=list)  # [{id, name, quantity, revenue}, ...]
    low_stock_items = models.IntegerField(default=0)
    out_of_stock_items = models.IntegerField(default=0)
    
    # Staff Performance
    cashier_performance = models.JSONField(default=dict)  # {cashier_id: {transactions, revenue}}
    
    # Additional Metrics
    peak_hour = models.IntegerField(null=True, blank=True)  # 0-23
    peak_day = models.CharField(max_length=10, blank=True)  # monday, tuesday, etc.
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        unique_together = [['shop', 'date', 'period_type']]
        indexes = [
            models.Index(fields=['shop', 'date']),
            models.Index(fields=['date', 'period_type']),
        ]
    
    def __str__(self):
        return f"{self.shop.name} - {self.date} ({self.period_type})"


class PredictiveMetric(models.Model):
    """Store predictive analytics data"""
    
    METRIC_TYPES = (
        ('demand_forecast', 'Demand Forecast'),
        ('stock_recommendation', 'Stock Recommendation'),
        ('revenue_prediction', 'Revenue Prediction'),
        ('churn_risk', 'Churn Risk'),
    )
    
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE)
    metric_type = models.CharField(max_length=50, choices=METRIC_TYPES)
    
    # Target (e.g., product_id, customer_id, or null for shop-wide)
    target_id = models.IntegerField(null=True, blank=True)
    target_type = models.CharField(max_length=50, blank=True)  # product, customer, shop
    
    # Prediction data
    predicted_value = models.DecimalField(max_digits=12, decimal_places=2)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=4)  # 0.0 to 1.0
    
    # Time range
    prediction_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Additional data
    metadata = models.JSONField(default=dict)
    
    class Meta:
        ordering = ['-prediction_date']
        indexes = [
            models.Index(fields=['shop', 'metric_type', 'prediction_date']),
        ]

