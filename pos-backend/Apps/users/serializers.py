# apps/users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from shops.serializers import ShopSerializer
from shops.models import Shop
from .models import UserSettings

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model with nested shop data for profile views."""
    # Read nested shop objects (id, name, etc.)
    assigned_shops = ShopSerializer(many=True, read_only=True)
    # Accept shop IDs on write operations
    shop_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'profile_picture', 'assigned_shops',
            'shop_ids', 'is_active', 'created_at', 'updated_at', 'password'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
        }

    def get_profile_picture(self, obj):
        """Return full URL for profile picture"""
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

    def create(self, validated_data):
        """Create user with hashed password and assign shops from `shop_ids` if provided."""
        shop_ids = validated_data.pop('shop_ids', [])
        password = validated_data.pop('password', None)

        user = User(**validated_data)

        if password:
            user.set_password(password)
        else:
            user.set_password('temporarypassword123')

        user.save()

        if shop_ids:
            shops = Shop.objects.filter(id__in=shop_ids, is_active=True)
            user.assigned_shops.set(shops)

        return user

    def update(self, instance, validated_data):
        """Update user and handle optional password and shop assignments."""
        shop_ids = validated_data.pop('shop_ids', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if shop_ids is not None:
            shops = Shop.objects.filter(id__in=shop_ids, is_active=True)
            instance.assigned_shops.set(shops)

        return instance


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login request"""
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    role = serializers.ChoiceField(
        choices=['admin', 'manager', 'cashier'],
        required=True
    )
    shop_id = serializers.IntegerField(required=False, allow_null=True)


class UserLoginResponseSerializer(serializers.Serializer):
    """Serializer for login response"""
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()
    allowed_shops = serializers.ListField()
    selected_shop_id = serializers.IntegerField(allow_null=True)


class UserSettingsSerializer(serializers.ModelSerializer):
    """Serializer for user preferences and settings"""
    
    class Meta:
        model = UserSettings
        fields = ['font_size', 'language', 'dark_mode']