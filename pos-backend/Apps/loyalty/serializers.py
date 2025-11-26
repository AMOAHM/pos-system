# apps/loyalty/serializers.py
from rest_framework import serializers
from .models import Customer, LoyaltyTransaction, LoyaltyReward, LoyaltyRule


class CustomerSerializer(serializers.ModelSerializer):
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'email', 'phone', 'loyalty_points', 'tier',
            'tier_display', 'total_spent', 'visits_count', 'last_visit',
            'date_of_birth', 'preferences', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'loyalty_points', 'tier', 'total_spent', 
                           'visits_count', 'last_visit', 'created_at']


class LoyaltyTransactionSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    transaction_type_display = serializers.CharField(
        source='get_transaction_type_display',
        read_only=True
    )
    
    class Meta:
        model = LoyaltyTransaction
        fields = [
            'id', 'customer', 'customer_name', 'transaction_type',
            'transaction_type_display', 'points', 'sale', 'reward',
            'description', 'balance_after', 'created_by', 'created_at'
        ]
        read_only_fields = ['id', 'balance_after', 'created_by', 'created_at']


class LoyaltyRewardSerializer(serializers.ModelSerializer):
    discount_type_display = serializers.CharField(
        source='get_discount_type_display',
        read_only=True
    )
    
    class Meta:
        model = LoyaltyReward
        fields = [
            'id', 'name', 'description', 'points_required', 'discount_type',
            'discount_type_display', 'discount_value', 'min_purchase',
            'max_uses_per_customer', 'valid_from', 'valid_until',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class LoyaltyRuleSerializer(serializers.ModelSerializer):
    rule_type_display = serializers.CharField(
        source='get_rule_type_display',
        read_only=True
    )
    
    class Meta:
        model = LoyaltyRule
        fields = [
            'id', 'rule_type', 'rule_type_display', 'name', 'description',
            'parameters', 'applicable_tiers', 'is_active', 'priority',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

