# apps/analytics/serializers.py
from rest_framework import serializers
from .models import AnalyticsSnapshot, PredictiveMetric


class AnalyticsSnapshotSerializer(serializers.ModelSerializer):
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    
    class Meta:
        model = AnalyticsSnapshot
        fields = [
            'id', 'shop', 'shop_name', 'period_type', 'date',
            'total_revenue', 'total_transactions', 'average_transaction_value',
            'total_items_sold', 'cash_revenue', 'card_revenue',
            'mobile_money_revenue', 'unique_customers', 'new_customers',
            'returning_customers', 'top_products', 'low_stock_items',
            'out_of_stock_items', 'cashier_performance', 'peak_hour',
            'peak_day', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PredictiveMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictiveMetric
        fields = [
            'id', 'shop', 'metric_type', 'target_id', 'target_type',
            'predicted_value', 'confidence_score', 'prediction_date',
            'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


