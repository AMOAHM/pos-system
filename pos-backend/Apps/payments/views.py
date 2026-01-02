# apps/payments/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from .paystack import PaystackClient
from sales.models import Sale
import json
import logging
from django.utils import timezone
from datetime import timedelta
from .models import Subscription
from .serializers import SubscriptionSerializer

logger = logging.getLogger(__name__)


@api_view(['GET'])
def paystack_callback(request):
    """Handle Paystack payment callback"""
    from django.shortcuts import redirect
    from django.conf import settings

    reference = request.query_params.get('reference')
    frontend_url = settings.FRONTEND_URL

    if not reference:
        # Redirect to frontend with error
        return redirect(f'{frontend_url}/payment-success?payment=error&message=No+reference+provided')

    # Verify transaction with Paystack
    paystack = PaystackClient()
    transaction_data = paystack.verify_transaction(reference)

    if not transaction_data:
        # Redirect to frontend with error
        return redirect(f'{frontend_url}/payment-success?payment=error&message=Transaction+verification+failed')

    # Update sale status
    try:
        sale = Sale.objects.get(id=reference)

        if transaction_data['status'] == 'success':
            sale.status = 'completed'
            sale.paystack_response = transaction_data
            sale.save()

            # Redirect to frontend with success and sale ID
            return redirect(f'{frontend_url}/payment-success?payment=success&saleId={sale.id}')
        else:
            sale.status = 'failed'
            sale.paystack_response = transaction_data
            sale.save()

            # Redirect to frontend with failure
            return redirect(f'{frontend_url}/payment-success?payment=failed&saleId={sale.id}')

    except Sale.DoesNotExist:
        # Redirect to frontend with error
        return redirect(f'{frontend_url}/payment-success?payment=error&message=Sale+not+found')


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def paystack_webhook(request):
    """Handle Paystack webhook events"""

    # Verify webhook signature
    signature = request.headers.get('X-Paystack-Signature')

    if not signature:
        logger.warning("Webhook received without signature")
        return HttpResponse(status=400)

    paystack = PaystackClient()

    if not paystack.verify_webhook_signature(request.body, signature):
        logger.warning("Invalid webhook signature")
        return HttpResponse(status=400)

    # Process webhook event
    try:
        event_data = json.loads(request.body)
        event_type = event_data.get('event')

        if event_type == 'charge.success':
            data = event_data.get('data', {})
            reference = data.get('reference')

            if reference:
                try:
                    sale = Sale.objects.get(id=reference)
                    sale.status = 'completed'
                    sale.paystack_response = data
                    sale.save()

                    logger.info(f"Payment completed for sale {reference}")
                except Sale.DoesNotExist:
                    logger.error(f"Sale not found for reference {reference}")

        return HttpResponse(status=200)

    except json.JSONDecodeError:
        logger.error("Invalid JSON in webhook payload")
        return HttpResponse(status=400)


@api_view(['GET'])
@permission_classes([AllowAny])
def plans_list(request):
    """Return available subscription plans."""
    # In a real app you'd store plans in DB or come from payment provider
    plans = [
        {"id": "trial", "name": "Free Trial", "description": "Try the product for 7 days.", "amount": "0.00", "currency": "GHS", "interval": "trial"},
        {"id": "weekly", "name": "Weekly", "description": "Weekly subscription", "amount": "50.00", "currency": "GHS", "interval": "weekly"},
        {"id": "monthly", "name": "Monthly", "description": "Monthly subscription", "amount": "150.00", "currency": "GHS", "interval": "monthly"},
        {"id": "yearly", "name": "Yearly", "description": "Yearly subscription (Save 17%)", "amount": "1500.00", "currency": "GHS", "interval": "yearly"},
    ]
    return Response(plans)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_subscription(request):
    """Create a subscription record for the authenticated user.

    NOTE: This endpoint is simplified and assumes payment is successful.
    In production, you should create a payment session and verify webhooks.
    """
    plan = request.data.get('plan')
    user = request.user

    if not plan:
        return Response({"detail": "plan is required"}, status=status.HTTP_400_BAD_REQUEST)

    now = timezone.now()

    if plan == Subscription.PLAN_TRIAL or plan == 'trial':
        trial_ends = now + timedelta(days=7)
        sub = Subscription.objects.create(
            user=user,
            plan=Subscription.PLAN_TRIAL,
            trial_ends_at=trial_ends,
            is_active=True,
            amount=0,
            currency='GHS'
        )
    else:
        # For paid plans, simulate immediate activation and set ends_at
        if plan == Subscription.PLAN_WEEKLY or plan == 'weekly':
            ends = now + timedelta(days=7)
            amt = 50
        elif plan == Subscription.PLAN_MONTHLY or plan == 'monthly':
            ends = now + timedelta(days=30)
            amt = 150
        elif plan == Subscription.PLAN_YEARLY or plan == 'yearly':
            ends = now + timedelta(days=365)
            amt = 1500
        else:
            return Response({"detail": "invalid plan"}, status=status.HTTP_400_BAD_REQUEST)

        sub = Subscription.objects.create(
            user=user,
            plan=plan,
            ends_at=ends,
            is_active=True,
            amount=amt,
            currency='GHS'
        )

    serializer = SubscriptionSerializer(sub)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_subscription(request):
    """Get the current active subscription for the authenticated user."""
    user = request.user
    sub = Subscription.objects.filter(user=user, is_active=True).order_by('-started_at').first()
    if not sub:
        return Response({"subscription": None}, status=status.HTTP_200_OK)
    serializer = SubscriptionSerializer(sub)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_subscription(request):
    """Cancel the active subscription for the authenticated user."""
    user = request.user
    sub = Subscription.objects.filter(user=user, is_active=True).order_by('-started_at').first()
    if not sub:
        return Response({"detail": "no active subscription"}, status=status.HTTP_400_BAD_REQUEST)
    sub.is_active = False
    sub.ends_at = timezone.now()
    sub.save()
    return Response({"detail": "subscription cancelled"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upgrade_subscription(request):
    """Upgrade or change the subscription plan for the authenticated user."""
    plan = request.data.get('plan')
    user = request.user
    if not plan:
        return Response({"detail": "plan is required"}, status=status.HTTP_400_BAD_REQUEST)

    # Deactivate existing active subscriptions
    Subscription.objects.filter(user=user, is_active=True).update(is_active=False, ends_at=timezone.now())

    # Create new subscription (simulate activation)
    now = timezone.now()
    if plan == Subscription.PLAN_WEEKLY or plan == 'weekly':
        ends = now + timedelta(days=7)
        amt = 5000
    elif plan == Subscription.PLAN_MONTHLY or plan == 'monthly':
        ends = now + timedelta(days=30)
        amt = 15000
    elif plan == Subscription.PLAN_YEARLY or plan == 'yearly':
        ends = now + timedelta(days=365)
        amt = 150000
    else:
        return Response({"detail": "invalid plan"}, status=status.HTTP_400_BAD_REQUEST)

    sub = Subscription.objects.create(
        user=user,
        plan=plan,
        ends_at=ends,
        is_active=True,
        amount=amt,
        currency='GHS'
    )

    serializer = SubscriptionSerializer(sub)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initialize_subscription(request):
    """Initialize Paystack payment for subscription."""
    plan_id = request.data.get('plan')
    user = request.user
    
    if not plan_id:
        return Response({"detail": "plan is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get plan details
    plans = {
        'trial': {"amount": 0, "name": "Free Trial"},
        'weekly': {"amount": 50, "name": "Weekly"},
        'monthly': {"amount": 150, "name": "Monthly"},
        'yearly': {"amount": 1500, "name": "Yearly"},
    }
    
    plan_info = plans.get(plan_id)
    if not plan_info:
        return Response({"detail": "invalid plan"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Free trial doesn't need payment
    if plan_id == 'trial':
        return Response({
            "detail": "Trial plan doesn't require payment",
            "skip_payment": True
        })
    
    # Generate unique reference
    import uuid
    reference = f"sub_{user.id}_{plan_id}_{uuid.uuid4().hex[:8]}"
    
    # Initialize Paystack transaction
    paystack = PaystackClient()
    # Amount in pesewas (GHS smallest unit: 1 GHS = 100 pesewas)
    amount_in_pesewas = int(plan_info['amount'] * 100)
    
    from django.conf import settings
    callback_url = f"{settings.FRONTEND_URL}/payment-success"
    
    payment_data = paystack.initialize_transaction(
        email=user.email,
        amount=amount_in_pesewas,
        reference=reference,
        callback_url=callback_url,
        metadata={
            "user_id": user.id,
            "plan": plan_id,
            "type": "subscription"
        }
    )
    
    if not payment_data:
        return Response(
            {"detail": "Failed to initialize payment"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return Response({
        "authorization_url": payment_data.get('authorization_url'),
        "access_code": payment_data.get('access_code'),
        "reference": reference
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_subscription_payment(request):
    """Verify Paystack payment and create subscription."""
    reference = request.data.get('reference')
    user = request.user
    
    if not reference:
        return Response({"detail": "reference is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify transaction with Paystack
    paystack = PaystackClient()
    transaction_data = paystack.verify_transaction(reference)
    
    if not transaction_data:
        return Response(
            {"detail": "Payment verification failed"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if transaction_data.get('status') != 'success':
        return Response(
            {"detail": "Payment was not successful"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Extract plan from metadata or reference
    metadata = transaction_data.get('metadata', {})
    plan_id = metadata.get('plan')
    
    if not plan_id:
        # Try to extract from reference
        ref_parts = reference.split('_')
        if len(ref_parts) >= 3:
            plan_id = ref_parts[2]
        else:
            return Response({"detail": "Invalid reference"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create subscription
    now = timezone.now()
    
    if plan_id == 'weekly':
        ends = now + timedelta(days=7)
        amt = 50
    elif plan_id == 'monthly':
        ends = now + timedelta(days=30)
        amt = 150
    elif plan_id == 'yearly':
        ends = now + timedelta(days=365)
        amt = 1500
    else:
        return Response({"detail": "invalid plan"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Deactivate any existing active subscriptions
    Subscription.objects.filter(user=user, is_active=True).update(
        is_active=False,
        ends_at=now
    )
    
    # Create new subscription
    sub = Subscription.objects.create(
        user=user,
        plan=plan_id,
        ends_at=ends,
        is_active=True,
        amount=amt,
        currency='GHS'
    )
    
    serializer = SubscriptionSerializer(sub)
    return Response({
        "subscription": serializer.data,
        "message": "Subscription activated successfully"
    }, status=status.HTTP_201_CREATED)

