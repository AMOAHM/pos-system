# apps/shifts/serializers.py
from rest_framework import serializers
from .models import Shift, ShiftActivity


class ShiftActivitySerializer(serializers.ModelSerializer):
    activity_type_display = serializers.CharField(
        source='get_activity_type_display',
        read_only=True
    )
    
    class Meta:
        model = ShiftActivity
        fields = [
            'id', 'shift', 'activity_type', 'activity_type_display',
            'amount', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ShiftSerializer(serializers.ModelSerializer):
    cashier_name = serializers.CharField(source='cashier.username', read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    duration_minutes = serializers.SerializerMethodField()
    
    class Meta:
        model = Shift
        fields = [
            'id', 'cashier', 'cashier_name', 'shop', 'shop_name',
            'start_time', 'end_time', 'opening_cash', 'closing_cash',
            'expected_cash', 'cash_difference', 'total_sales',
            'cash_sales', 'card_sales', 'mobile_money_sales',
            'transactions_count', 'status', 'status_display',
            'opening_notes', 'closing_notes', 'closed_by',
            'duration_minutes', 'created_at'
        ]
        read_only_fields = [
            'id', 'expected_cash', 'cash_difference', 'total_sales',
            'cash_sales', 'card_sales', 'mobile_money_sales',
            'transactions_count', 'closed_by', 'created_at'
        ]
    
    def get_duration_minutes(self, obj):
        duration = obj.duration
        return int(duration.total_seconds() / 60) if duration else None

