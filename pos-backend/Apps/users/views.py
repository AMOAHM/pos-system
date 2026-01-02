# apps/users/views.py

from datetime import timedelta
import random
import string
import traceback
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, action, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserSettings
from .serializers import (
    UserSerializer,
    UserLoginSerializer,
    UserLoginResponseSerializer,
    UserSettingsSerializer,
)
from .permissions import IsAdmin
from shops.models import Shop
from payments.models import Subscription

User = get_user_model()

# ============================================================
# Helper Functions
# ============================================================

def generate_verification_code():
    """Generate a 6‑digit verification code"""
    return "".join(random.choices(string.digits, k=6))

def generate_reset_token():
    """Generate a secure alphanumeric reset token"""
    return "".join(random.choices(string.ascii_letters + string.digits, k=64))

# ============================================================
# Registration API
# ============================================================

@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def register_admin(request):
    """Register a new Admin user and start a free trial."""
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")
    first_name = request.data.get("first_name", "")
    last_name = request.data.get("last_name", "")

    if not all([username, email, password]):
        return Response({"error": "Username, email and password are required"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already taken"}, status=400)
    
    if User.objects.filter(email=email).exists():
        return Response({"error": "Email already registered"}, status=400)

    with transaction.atomic():
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role='admin'
        )
        
        # Create a free trial subscription
        Subscription.objects.create(
            user=user,
            plan=Subscription.PLAN_TRIAL,
            trial_ends_at=timezone.now() + timedelta(days=7),
            is_active=True,
            amount=0
        )

    refresh = RefreshToken.for_user(user)
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserSerializer(user).data,
        "message": "Admin registered successfully with 7-day free trial."
    }, status=201)

# ============================================================
# Login API
# ============================================================

@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def login_view(request):
    """Authenticate a user and return JWT tokens.

    Expected payload:
        {
            "username": "...",
            "password": "...",
            "role": "admin|manager|cashier",
            "shop_id": optional int (required for manager/cashier)
        }
    """
    print("DEBUG: login_view entered")
    try:
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]
        role = serializer.validated_data["role"]
        shop_id = serializer.validated_data.get("shop_id")

        user = authenticate(username=username, password=password)
        if not user:
            print("DEBUG: Authentication failed for: {}".format(username))
            return Response({"error": "Invalid credentials"}, status=401)

        print("DEBUG: User authenticated: {}, role: {}".format(user.username, user.role))
        if user.role != role:
            return Response({"error": f"User is not registered as {role}"}, status=403)

        # Determine allowed shops
        if user.role == "admin":
            # ONLY SHOW SHOPS CREATED BY THIS ADMIN
            allowed_shops = Shop.objects.filter(created_by=user, is_active=True)
        else:
            allowed_shops = user.assigned_shops.filter(is_active=True)
            if not allowed_shops.exists():
                return Response({"error": "No shops assigned to this user"}, status=403)

            if role in ["manager", "cashier"]:
                if not shop_id:
                    return Response(
                        {
                            "error": "Shop selection required",
                            "allowed_shops": [{"id": s.id, "name": s.name} for s in allowed_shops],
                        },
                        status=400,
                    )
                if not allowed_shops.filter(id=shop_id).exists():
                    return Response({"error": "You do not have access to this shop"}, status=403)

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
                "allowed_shops": [{"id": s.id, "name": s.name} for s in allowed_shops],
                "selected_shop_id": shop_id,
            }
        )
    except Exception:
        with open("login_error.log", "a", encoding="utf-8") as f:
            f.write(traceback.format_exc())
            f.write("\n")
        return Response({"error": "Server error"}, status=500)

# ============================================================
# Send Verification Code
# ============================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_verification_code(request):
    """Send a one‑time verification code to the user's email before password change."""
    user = request.user
    current_password = request.data.get("current_password")
    if not current_password:
        return Response({"error": "Current password required"}, status=400)
    if not check_password(current_password, user.password):
        return Response({"error": "Incorrect password"}, status=400)
    if not user.email:
        return Response({"error": "No email linked to account"}, status=400)

    code = generate_verification_code()
    user.verification_code = code
    user.verification_code_expires = timezone.now() + timedelta(minutes=10)
    user.save()
    try:
        send_mail(
            "Password Change Verification Code",
            f"Your verification code is: {code}\nThis code expires in 10 minutes.",
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
        )
    except Exception as e:
        print(f"Email error: {e}")
        return Response({"error": "Failed to send email"}, status=500)
    return Response({"message": "Verification code sent"})

# ============================================================
# Change Password with Code
# ============================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password_with_code(request):
    """Change the user's password using a previously sent verification code."""
    user = request.user
    current_password = request.data.get("current_password")
    new_password = request.data.get("new_password")
    verification_code = request.data.get("verification_code")
    if not all([current_password, new_password, verification_code]):
        return Response({"error": "All fields are required"}, status=400)
    if not check_password(current_password, user.password):
        return Response({"error": "Incorrect password"}, status=400)
    if not user.verification_code:
        return Response({"error": "No verification code found"}, status=400)
    if user.verification_code_expires < timezone.now():
        return Response({"error": "Verification code expired"}, status=400)
    if user.verification_code != verification_code:
        return Response({"error": "Invalid verification code"}, status=400)
    if len(new_password) < 8:
        return Response({"error": "Password must be at least 8 characters"}, status=400)
    user.password = make_password(new_password)
    user.verification_code = None
    user.verification_code_expires = None
    user.save()
    return Response({"message": "Password changed successfully"})

# ============================================================
# Forgot Password
# ============================================================

@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get("email")
    if not email:
        return Response({"error": "Email required"}, status=400)
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"message": "If email exists, a reset link was sent."})
    token = generate_reset_token()
    user.reset_token = token
    user.reset_token_expires = timezone.now() + timedelta(hours=1)
    user.save()
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    reset_link = f"{frontend_url}/reset-password?token={token}"
    try:
        send_mail(
            "Password Reset Request",
            f"Click to reset your password:\n{reset_link}\nExpires in 1 hour.",
            settings.DEFAULT_FROM_EMAIL,
            [email],
        )
    except Exception as e:
        print(f"Email error: {e}")
        return Response({"error": "Failed to send email"}, status=500)
    return Response({"message": "If email exists, a reset link was sent."})

# ============================================================
# Reset Password
# ============================================================

@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def reset_password(request):
    token = request.data.get("token")
    new_password = request.data.get("new_password")
    if not token or not new_password:
        return Response({"error": "Token and password required"}, status=400)
    try:
        user = User.objects.get(reset_token=token)
    except User.DoesNotExist:
        return Response({"error": "Invalid or expired token"}, status=400)
    if user.reset_token_expires < timezone.now():
        return Response({"error": "Reset token expired"}, status=400)
    if len(new_password) < 8:
        return Response({"error": "Password must be 8+ chars"}, status=400)
    user.password = make_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    user.save()
    return Response({"message": "Password reset successfully"})

# ============================================================
# USER VIEWSET
# ============================================================

class UserViewSet(viewsets.ModelViewSet):
    """Admin user management viewset"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsAdmin()]
        if self.action in ["update", "partial_update", "destroy", "assign_shops", "remove_shop"]:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Filter users based on role and ownership"""
        user = self.request.user
        
        if user.role == 'admin':
            # Admin can see themselves and anyone assigned to their shops
            my_shop_ids = Shop.objects.filter(created_by=user).values_list('id', flat=True)
            queryset = User.objects.filter(
                models.Q(id=user.id) | models.Q(assigned_shops__id__in=my_shop_ids)
            ).distinct().prefetch_related('assigned_shops')
        else:
            # Non-admins can only see themselves (or managers seeing their staff - simplified for now)
            queryset = User.objects.filter(id=user.id).prefetch_related('assigned_shops')
        
        # Optionally filter by role
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        # Search by username, email, or full_name (assuming full_name exists, but it doesn't in models.py, let's fix that)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(username__icontains=search) | 
                models.Q(email__icontains=search) |
                models.Q(first_name__icontains=search) |
                models.Q(last_name__icontains=search)
            )
        
        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        """Create user with optional shop assignments"""
        user = serializer.save()
        
        # Handle shop assignments
        shop_ids = self.request.data.get('shop_ids', [])
        if shop_ids:
            shops = Shop.objects.filter(id__in=shop_ids, is_active=True)
            user.assigned_shops.set(shops)

    @transaction.atomic
    def perform_update(self, serializer):
        """Update user with shop assignments"""
        user = serializer.save()
        
        # Handle shop assignments if provided
        if 'shop_ids' in self.request.data:
            shop_ids = self.request.data.get('shop_ids', [])
            shops = Shop.objects.filter(id__in=shop_ids, is_active=True)
            user.assigned_shops.set(shops)

    # ------------------------------
    # Assign Shops to User
    # ------------------------------
    @action(detail=True, methods=["post"])
    def assign_shops(self, request, pk=None):
        """
        Assign one or more shops to a user.
        
        Payload:
        {
            "shop_ids": [1, 2, 3],
            "replace": false  # If true, replace all shops; if false, add to existing
        }
        """
        user = self.get_object()
        shop_ids = request.data.get("shop_ids", [])
        replace = request.data.get("replace", False)
        
        if not shop_ids:
            return Response({"error": "shop_ids required"}, status=400)
        
        # Validate shop IDs
        shops = Shop.objects.filter(id__in=shop_ids, is_active=True)
        if shops.count() != len(shop_ids):
            invalid_ids = set(shop_ids) - set(shops.values_list('id', flat=True))
            return Response(
                {"error": f"Invalid or inactive shop IDs: {list(invalid_ids)}"}, 
                status=400
            )
        
        if replace:
            user.assigned_shops.set(shops)
            message = f"Replaced shops for {user.username}"
        else:
            user.assigned_shops.add(*shops)
            message = f"Added {shops.count()} shop(s) to {user.username}"
        
        return Response({
            "message": message,
            "user": UserSerializer(user).data,
            "assigned_shops": [{"id": s.id, "name": s.name} for s in user.assigned_shops.all()]
        })

    # ------------------------------
    # Remove Shop from User
    # ------------------------------
    @action(detail=True, methods=["post"])
    def remove_shop(self, request, pk=None):
        """
        Remove a shop from a user's assigned shops.
        
        Payload:
        {
            "shop_id": 1
        }
        """
        user = self.get_object()
        shop_id = request.data.get("shop_id")
        
        if not shop_id:
            return Response({"error": "shop_id required"}, status=400)
        
        try:
            shop = Shop.objects.get(id=shop_id)
        except Shop.DoesNotExist:
            return Response({"error": "Shop not found"}, status=404)
        
        if shop not in user.assigned_shops.all():
            return Response({"error": "User is not assigned to this shop"}, status=400)
        
        user.assigned_shops.remove(shop)
        
        return Response({
            "message": f"Removed {shop.name} from {user.username}",
            "user": UserSerializer(user).data,
            "assigned_shops": [{"id": s.id, "name": s.name} for s in user.assigned_shops.all()]
        })

    # ------------------------------
    # Get User's Assigned Shops
    # ------------------------------
    @action(detail=True, methods=["get"])
    def assigned_shops_list(self, request, pk=None):
        """Get all shops assigned to a user"""
        user = self.get_object()
        shops = user.assigned_shops.filter(is_active=True)
        
        return Response({
            "user_id": user.id,
            "username": user.username,
            "role": user.role,
            "assigned_shops": [
                {
                    "id": s.id,
                    "name": s.name,
                    "location": s.location,
                    "is_active": s.is_active
                } 
                for s in shops
            ]
        })

    # ------------------------------
    # Profile Picture Upload
    # ------------------------------
    @action(detail=True, methods=["patch"], parser_classes=[MultiPartParser, FormParser])
    def profile_picture(self, request, pk=None):
        """Upload user profile picture"""
        user = self.get_object()
        if "profile_picture" not in request.FILES:
            return Response({"error": "No image provided"}, status=400)
        if user.profile_picture:
            user.profile_picture.delete()
        user.profile_picture = request.FILES["profile_picture"]
        user.save()
        return Response(UserSerializer(user).data)

    # ------------------------------
    # Change Password
    # ------------------------------
    @action(detail=True, methods=["post"])
    def change_password(self, request, pk=None):
        """Change user password from settings page"""
        user = self.get_object()
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")
        if not current_password or not new_password:
            return Response({"error": "Current and new password required"}, status=400)
        if not check_password(current_password, user.password):
            return Response({"error": "Current password incorrect"}, status=400)
        if len(new_password) < 8:
            return Response({"error": "Password must be at least 8 characters"}, status=400)
        user.password = make_password(new_password)
        user.save()
        return Response({"message": "Password changed successfully"})

    # ------------------------------
    # User Settings
    # ------------------------------
    @action(detail=True, methods=["patch"])
    def update_settings(self, request, pk=None):
        """Update user preferences"""
        user = self.get_object()
        settings_obj, _ = UserSettings.objects.get_or_create(user=user)
        serializer = UserSettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)