# apps/users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import FileExtensionValidator


class User(AbstractUser):
    """Extended user model with role-based access and shop assignments"""
    
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('cashier', 'Cashier'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='cashier')
    profile_picture = models.ImageField(
        upload_to='profiles/',
        null=True,
        blank=True,
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png'])]
    )
    assigned_shops = models.ManyToManyField(
        'shops.Shop',
        related_name='users',
        blank=True
    )
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(unique=True)  # Make email required and unique
    
    # Password change verification fields
    verification_code = models.CharField(max_length=6, null=True, blank=True)
    verification_code_expires = models.DateTimeField(null=True, blank=True)
    
    # Password reset fields
    reset_token = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    reset_token_expires = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Fix for groups and user_permissions conflict
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
        verbose_name='groups',
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True,
        verbose_name='user permissions',
        help_text='Specific permissions for this user.'
    )
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_admin(self):
        return self.role == 'admin'
    
    @property
    def is_manager(self):
        return self.role == 'manager'
    
    @property
    def is_cashier(self):
        return self.role == 'cashier'


class UserSettings(models.Model):
    """User-specific application settings"""
    
    FONT_SIZE_CHOICES = (
        ('small', 'Small'),
        ('medium', 'Medium'),
        ('large', 'Large'),
    )
    
    LANGUAGE_CHOICES = (
        ('en', 'English'),
        ('fr', 'French'),
        ('es', 'Spanish'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    font_size = models.CharField(max_length=10, choices=FONT_SIZE_CHOICES, default='medium')
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en')
    dark_mode = models.BooleanField(default=False)
    
    class Meta:
        verbose_name_plural = "User settings"
    
    def __str__(self):
        return f"Settings for {self.user.username}"