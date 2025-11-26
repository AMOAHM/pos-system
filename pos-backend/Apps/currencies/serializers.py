# apps/currencies/serializers.py
from rest_framework import serializers
from .models import Currency


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = [
            'id', 'code', 'name', 'symbol', 
            'exchange_rate', 'is_default', 'is_active',
            'last_updated', 'created_at'
        ]
        read_only_fields = ['id', 'last_updated', 'created_at']