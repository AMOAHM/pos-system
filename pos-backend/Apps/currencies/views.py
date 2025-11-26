# apps/currencies/views.py (or wherever your currency views are)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from .models import Currency
from .serializers import CurrencySerializer


class CurrencyListView(APIView):
    permission_classes = [AllowAny]  # Allow unauthenticated access
    
    def get(self, request):
        currencies = Currency.objects.all()
        serializer = CurrencySerializer(currencies, many=True)
        return Response(serializer.data)


class DefaultCurrencyView(APIView):
    permission_classes = [AllowAny]  # Allow unauthenticated access
    
    def get(self, request):
        try:
            default_currency = Currency.objects.get(is_default=True)
            serializer = CurrencySerializer(default_currency)
            return Response(serializer.data)
        except Currency.DoesNotExist:
            # Return a fallback default currency
            return Response({
                'code': 'USD',
                'name': 'US Dollar',
                'symbol': '$',
                'is_default': True
            })


class CurrencyConvertView(APIView):
    permission_classes = [AllowAny]  # Or IsAuthenticated if you want auth required
    
    def post(self, request):
        amount = request.data.get('amount')
        from_currency = request.data.get('from_currency')
        to_currency = request.data.get('to_currency')
        
        if not all([amount, from_currency, to_currency]):
            return Response(
                {'error': 'amount, from_currency, and to_currency are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from_curr = Currency.objects.get(code=from_currency)
            to_curr = Currency.objects.get(code=to_currency)
            
            # Convert through base currency (usually USD)
            amount_in_base = float(amount) / from_curr.exchange_rate
            converted_amount = amount_in_base * to_curr.exchange_rate
            
            return Response({
                'amount': amount,
                'from_currency': from_currency,
                'to_currency': to_currency,
                'converted_amount': round(converted_amount, 2),
                'exchange_rate': round(to_curr.exchange_rate / from_curr.exchange_rate, 4)
            })
        except Currency.DoesNotExist:
            return Response(
                {'error': 'Invalid currency code'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UpdateRatesView(APIView):
    # Keep authentication for this one - only authenticated users should update rates
    
    def post(self, request):
        # Check if user has permission (admin or manager)
        if not request.user.is_admin and not request.user.is_manager:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Your logic to update exchange rates
            # This might call an external API
            Currency.objects.all().update(last_updated=timezone.now())
            
            return Response({
                'message': 'Exchange rates updated successfully'
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )