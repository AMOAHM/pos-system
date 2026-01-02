from django.db import models
from django.conf import settings
from django.utils import timezone


# Subscription model to track user plans, trials and billing
class Subscription(models.Model):
	PLAN_TRIAL = 'trial'
	PLAN_WEEKLY = 'weekly'
	PLAN_MONTHLY = 'monthly'
	PLAN_YEARLY = 'yearly'

	PLAN_CHOICES = (
		(PLAN_TRIAL, '7-day Trial'),
		(PLAN_WEEKLY, 'Weekly'),
		(PLAN_MONTHLY, 'Monthly'),
		(PLAN_YEARLY, 'Yearly'),
	)

	PLAN_LIMITS = {
		PLAN_TRIAL: 1,
		PLAN_WEEKLY: 5,
		PLAN_MONTHLY: 10,
		PLAN_YEARLY: 999999,  # Effectively unlimited
	}

	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name='subscriptions'
	)
	plan = models.CharField(max_length=20, choices=PLAN_CHOICES)
	started_at = models.DateTimeField(auto_now_add=True)
	trial_ends_at = models.DateTimeField(null=True, blank=True)
	ends_at = models.DateTimeField(null=True, blank=True)
	is_active = models.BooleanField(default=True)
	external_id = models.CharField(max_length=255, null=True, blank=True)
	amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
	currency = models.CharField(max_length=10, default='NGN')

	class Meta:
		ordering = ['-started_at']

	def __str__(self):
		return f"Subscription({self.user}, {self.plan}, active={self.is_active})"

	def in_trial(self):
		if self.plan != self.PLAN_TRIAL:
			return False
		if not self.trial_ends_at:
			return False
		return timezone.now() <= self.trial_ends_at

	def active(self):
		# Active if flagged active and not past ends_at, or still in trial
		if self.in_trial():
			return True
		if not self.is_active:
			return False
		if self.ends_at and timezone.now() > self.ends_at:
			return False
		return True

	@classmethod
	def active_for_user(cls, user):
		"""Return True if the user has any active subscription or trial."""
		now = timezone.now()
		subs = cls.objects.filter(user=user, is_active=True)
		for s in subs:
			if s.in_trial():
				return True
			if s.ends_at is None or s.ends_at >= now:
				return True
		return False

	@classmethod
	def get_shop_limit(cls, user):
		"""Return the shop limit based on the user's active subscription."""
		now = timezone.now()
		# Find the most permissive active subscription
		subs = cls.objects.filter(user=user, is_active=True).order_by('-amount')
		for s in subs:
			if s.in_trial() or s.ends_at is None or s.ends_at >= now:
				return cls.PLAN_LIMITS.get(s.plan, 1)
		return 0  # No active subscription

