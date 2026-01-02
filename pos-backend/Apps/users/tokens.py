# apps/users/tokens.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer that includes user role in the JWT payload"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims to the token
        token['role'] = user.role
        token['username'] = user.username
        token['email'] = user.email
        return token


def get_tokens_for_user(user):
    """Generate custom tokens for a user"""
    refresh = RefreshToken.for_user(user)
    # Add role to access token
    refresh.access_token['role'] = user.role
    refresh.access_token['username'] = user.username
    refresh.access_token['email'] = user.email
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }
