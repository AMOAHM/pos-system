# apps/loyalty/models.py
from django.db import models
from django.conf import settings
from decimal import Decimal


class Customer(models.Model):
    """Customer model for loyalty program"""
    
    TIER_CHOICES = (
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
        ('platinum', 'Platinum'),
    )
    
    # Basic info
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, unique=True)
    
    # Loyalty info
    loyalty_points = models.IntegerField(default=0)
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='bronze')
    
    # Statistics
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    visits_count = models.IntegerField(default=0)
    last_visit = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    date_of_birth = models.DateField(null=True, blank=True)
    preferences = models.JSONField(default=dict)
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-total_spent']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
            models.Index(fields=['tier']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.email})"
    
    def calculate_tier(self):
        """Auto-calculate tier based on total spent"""
        if self.total_spent >= 10000:
            return 'platinum'
        elif self.total_spent >= 5000:
            return 'gold'
        elif self.total_spent >= 2000:
            return 'silver'
        else:
            return 'bronze'
    
    def earn_points(self, amount):
        """Earn points based on purchase amount"""
        # Base rate: 1 point per 10 spent
        base_points = int(amount / 10)
        
        # Tier multiplier
        multipliers = {
            'bronze': 1.0,
            'silver': 1.2,
            'gold': 1.5,
            'platinum': 2.0,
        }
        
        points = int(base_points * multipliers.get(self.tier, 1.0))
        self.loyalty_points += points
        self.save()
        
        return points


class LoyaltyTransaction(models.Model):
    """Track loyalty points transactions"""
    
    TRANSACTION_TYPES = (
        ('earned', 'Points Earned'),
        ('redeemed', 'Points Redeemed'),
        ('expired', 'Points Expired'),
        ('adjusted', 'Manual Adjustment'),
    )
    
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='loyalty_transactions'
    )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    points = models.IntegerField()  # Positive for earned, negative for redeemed
    
    # Reference to sale if applicable
    sale = models.ForeignKey(
        'sales.Sale',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='loyalty_transactions'
    )
    
    # Reference to reward if redeemed
    reward = models.ForeignKey(
        'LoyaltyReward',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    description = models.TextField(blank=True)
    balance_after = models.IntegerField()  # Points balance after transaction
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_loyalty_transactions'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.customer.name} - {self.transaction_type}: {self.points} points"


class LoyaltyReward(models.Model):
    """Define rewards that customers can redeem"""
    
    DISCOUNT_TYPES = (
        ('percentage', 'Percentage Discount'),
        ('fixed', 'Fixed Amount'),
        ('free_item', 'Free Item'),
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    points_required = models.IntegerField()
    
    # Discount details
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Constraints
    min_purchase = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Minimum purchase amount to use this reward"
    )
    max_uses_per_customer = models.IntegerField(
        default=0,
        help_text="0 = unlimited"
    )
    
    # Validity
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['points_required']
    
    def __str__(self):
        return f"{self.name} ({self.points_required} points)"
    
    def can_redeem(self, customer, purchase_amount=0):
        """Check if customer can redeem this reward"""
        # Check points
        if customer.loyalty_points < self.points_required:
            return False, "Insufficient points"
        
        # Check minimum purchase
        if purchase_amount < self.min_purchase:
            return False, f"Minimum purchase of {self.min_purchase} required"
        
        # Check validity dates
        from django.utils import timezone
        now = timezone.now()
        
        if self.valid_from and now < self.valid_from:
            return False, "Reward not yet valid"
        
        if self.valid_until and now > self.valid_until:
            return False, "Reward expired"
        
        # Check usage limit
        if self.max_uses_per_customer > 0:
            usage_count = LoyaltyTransaction.objects.filter(
                customer=customer,
                reward=self,
                transaction_type='redeemed'
            ).count()
            
            if usage_count >= self.max_uses_per_customer:
                return False, "Maximum usage limit reached"
        
        return True, "OK"


class LoyaltyRule(models.Model):
    """Define rules for earning/spending points"""
    
    RULE_TYPES = (
        ('purchase_points', 'Points per Purchase'),
        ('signup_bonus', 'Signup Bonus'),
        ('birthday_bonus', 'Birthday Bonus'),
        ('referral_bonus', 'Referral Bonus'),
        ('tier_multiplier', 'Tier Multiplier'),
    )
    
    rule_type = models.CharField(max_length=50, choices=RULE_TYPES)
    name = models.CharField(max_length=200)
    description = models.TextField()
    
    # Rule parameters (stored as JSON)
    parameters = models.JSONField(default=dict)
    # Example: {'points_per_currency': 1, 'min_purchase': 10}
    
    # Applicability
    applicable_tiers = models.JSONField(
        default=list,
        help_text="Empty list = all tiers"
    )
    
    is_active = models.BooleanField(default=True)
    priority = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-priority', 'rule_type']
    
    def __str__(self):
        return self.name