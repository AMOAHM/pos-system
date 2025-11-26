# apps/payments/paystack.py
import requests
import hashlib
import hmac
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class PaystackClient:
    """Paystack API integration client"""
    
    BASE_URL = "https://api.paystack.co"
    
    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.public_key = settings.PAYSTACK_PUBLIC_KEY
        
    def _get_headers(self):
        return {
            'Authorization': f'Bearer {self.secret_key}',
            'Content-Type': 'application/json'
        }
    
    def initialize_transaction(self, email, amount, reference, callback_url=None, metadata=None):
        """Initialize a payment transaction"""
        url = f"{self.BASE_URL}/transaction/initialize"
        
        payload = {
            'email': email,
            'amount': amount,  # Amount in kobo (smallest currency unit)
            'reference': reference,
        }
        
        if callback_url:
            payload['callback_url'] = callback_url
        
        if metadata:
            payload['metadata'] = metadata
        
        try:
            response = requests.post(
                url,
                json=payload,
                headers=self._get_headers(),
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            
            if data['status']:
                return data['data']
            else:
                logger.error(f"Paystack initialization failed: {data.get('message')}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack API error: {str(e)}")
            return None
    
    def verify_transaction(self, reference):
        """Verify a transaction"""
        url = f"{self.BASE_URL}/transaction/verify/{reference}"
        
        try:
            response = requests.get(
                url,
                headers=self._get_headers(),
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            
            if data['status']:
                return data['data']
            else:
                logger.error(f"Paystack verification failed: {data.get('message')}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack API error: {str(e)}")
            return None
    
    def verify_webhook_signature(self, payload, signature):
        """Verify webhook signature from Paystack"""
        webhook_secret = settings.PAYSTACK_WEBHOOK_SECRET
        
        computed_signature = hmac.new(
            webhook_secret.encode('utf-8'),
            payload,
            hashlib.sha512
        ).hexdigest()
        
        return hmac.compare_digest(computed_signature, signature)
