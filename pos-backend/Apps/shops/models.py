# apps/shops/models.py
from django.db import models
from django.conf import settings
from django.utils.crypto import get_random_string


def generate_shop_code():
    """Generate a unique shop code"""
    return get_random_string(6).upper()   # e.g. "XA92KD"


class Shop(models.Model):
    """Shop / Store Model"""

    name = models.CharField(max_length=200)
    code = models.CharField(
        max_length=50,
        unique=True,
        default=generate_shop_code,
        help_text="Unique shop code"
    )
    address = models.TextField()
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)

    timezone = models.CharField(
        max_length=100,
        default="UTC",
        help_text="Shop timezone"
    )

    is_active = models.BooleanField(default=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_shops'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"
