# apps/currencies/models.py
from django.db import models
from django.utils import timezone


class Currency(models.Model):
    code = models.CharField(max_length=3, unique=True)  # USD, EUR, GBP, etc.
    name = models.CharField(max_length=50)
    symbol = models.CharField(max_length=10)
    exchange_rate = models.DecimalField(
        max_digits=10, 
        decimal_places=4,
        default=1.0000,
        help_text="Exchange rate relative to base currency (USD)"
    )
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['code']
        verbose_name_plural = 'Currencies'
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    def save(self, *args, **kwargs):
        # Ensure only one default currency
        if self.is_default:
            Currency.objects.filter(is_default=True).update(is_default=False)
        super().save(*args, **kwargs)