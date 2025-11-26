# apps/users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from shops.models import Shop
from .models import UserSettings

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model with shop assignments"""
    assigned_shops = serializers.PrimaryKeyRelatedField(
        many=True,
        read_only=False,
        queryset=Shop.objects.all(),
        required=False
    )
    profile_picture = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'profile_picture', 'assigned_shops',
            'is_active', 'created_at', 'updated_at', 'password'
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
        """Create user with hashed password"""
        assigned_shops = validated_data.pop('assigned_shops', [])
        password = validated_data.pop('password', None)
        
        # Create user instance
        user = User(**validated_data)
        
        # Hash password properly
        if password:
            user.set_password(password)
        else:
            # Set a default password if none provided (should be changed)
            user.set_password('temporarypassword123')
        
        user.save()
        
        # Assign shops
        if assigned_shops:
            user.assigned_shops.set(assigned_shops)
        
        return user
    
    def update(self, instance, validated_data):
        """Update user with optional password change"""
        assigned_shops = validated_data.pop('assigned_shops', None)
        password = validated_data.pop('password', None)
        
        # Update regular fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update password if provided
        if password:
            instance.set_password(password)
        
        instance.save()
        
        # Update shop assignments
        if assigned_shops is not None:
            instance.assigned_shops.set(assigned_shops)
        
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