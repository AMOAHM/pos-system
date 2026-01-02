from rest_framework import serializers
from .models import Subscription


class PlanSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField()
    interval = serializers.CharField()


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_display = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = ['id', 'user', 'plan', 'plan_display', 'started_at', 'trial_ends_at', 'ends_at', 'is_active', 'amount', 'currency', 'external_id']
        read_only_fields = ['id', 'user', 'started_at']

    def get_plan_display(self, obj):
        return dict(Subscription.PLAN_CHOICES).get(obj.plan, obj.plan)
