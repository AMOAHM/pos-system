# apps/shifts/models.py
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.utils import timezone


class Shift(models.Model):
    """Cashier shift tracking"""
    
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('closed', 'Closed'),
        ('suspended', 'Suspended'),
    )
    
    # Who and where
    cashier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='shifts'
    )
    shop = models.ForeignKey(
        'shops.Shop',
        on_delete=models.CASCADE,
        related_name='shifts'
    )
    
    # Timing
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)
    
    # Cash management
    opening_cash = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Cash in drawer at shift start"
    )
    closing_cash = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Cash in drawer at shift end"
    )
    expected_cash = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Expected cash based on transactions"
    )
    cash_difference = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Difference between expected and actual"
    )
    
    # Sales summary
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cash_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    card_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    mobile_money_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    transactions_count = models.IntegerField(default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    
    # Notes
    opening_notes = models.TextField(blank=True)
    closing_notes = models.TextField(blank=True)
    
    # Approvals
    closed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='closed_shifts'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['cashier', 'status']),
            models.Index(fields=['shop', 'start_time']),
        ]
    
    def __str__(self):
        return f"{self.cashier.username} - {self.start_time.date()} ({self.status})"
    
    @property
    def duration(self):
        """Calculate shift duration"""
        if self.end_time:
            return self.end_time - self.start_time
        return timezone.now() - self.start_time
    
    def close_shift(self, closing_cash, closed_by, notes=''):
        """Close the shift and calculate summary"""
        from sales.models import Sale
        
        self.end_time = timezone.now()
        self.closing_cash = closing_cash
        self.closing_notes = notes
        self.closed_by = closed_by
        self.status = 'closed'
        
        # Calculate sales during shift
        sales = Sale.objects.filter(
            shop=self.shop,
            cashier=self.cashier,
            created_at__range=(self.start_time, self.end_time),
            status='completed'
        )
        
        from django.db.models import Sum, Count
        
        summary = sales.aggregate(
            total=Sum('total_amount'),
            count=Count('id'),
            cash=Sum('total_amount', filter=models.Q(payment_method='cash')),
            card=Sum('total_amount', filter=models.Q(payment_method='card')),
            mobile=Sum('total_amount', filter=models.Q(payment_method='mobile_money'))
        )
        
        self.total_sales = summary['total'] or 0
        self.transactions_count = summary['count'] or 0
        self.cash_sales = summary['cash'] or 0
        self.card_sales = summary['card'] or 0
        self.mobile_money_sales = summary['mobile'] or 0
        
        # Calculate expected cash
        self.expected_cash = self.opening_cash + self.cash_sales
        self.cash_difference = self.closing_cash - self.expected_cash
        
        self.save()
        
        return self


class ShiftActivity(models.Model):
    """Track activities during shift"""
    
    ACTIVITY_TYPES = (
        ('clock_in', 'Clock In'),
        ('clock_out', 'Clock Out'),
        ('break_start', 'Break Start'),
        ('break_end', 'Break End'),
        ('cash_drop', 'Cash Drop'),
        ('cash_pickup', 'Cash Pickup'),
        ('note', 'Note'),
    )
    
    shift = models.ForeignKey(
        Shift,
        on_delete=models.CASCADE,
        related_name='activities'
    )
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
        verbose_name_plural = 'Shift activities'
    
    def __str__(self):
        return f"{self.shift.cashier.username} - {self.activity_type}"
