# apps/payments/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from .paystack import PaystackClient
from sales.models import Sale
import json
import logging

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
