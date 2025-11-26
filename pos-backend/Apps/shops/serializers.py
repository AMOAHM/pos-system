# apps/shops/serializers.py
from rest_framework import serializers
from .models import Shop
from django.contrib.auth import get_user_model

User = get_user_model()


class ShopSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    users_count = serializers.SerializerMethodField()
    products_count = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = [
            'id', 'name', 'code', 'address', 'phone', 'email', 'timezone',
            'is_active', 'created_by', 'created_by_name',
            'users_count', 'products_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'code', 'created_by', 'created_by_name',
            'users_count', 'products_count',
            'created_at', 'updated_at'
        ]

    # -------------------------
    # VALIDATION
    # -------------------------
    def validate_phone(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Phone number is too short.")
        return value

    def validate_name(self, value):
        if len(value.strip()) == 0:
            raise serializers.ValidationError("Name cannot be empty.")
        return value

    # -------------------------
    # AUTO SET created_by
    # -------------------------
    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        return super().create(validated_data)

    # -------------------------
    # COUNTS
    # -------------------------
    def get_users_count(self, obj):
        return obj.users.count() if hasattr(obj, 'users') else 0

    def get_products_count(self, obj):
        if hasattr(obj, 'products'):
            return obj.products.filter(is_active=True).count()
        return 0
