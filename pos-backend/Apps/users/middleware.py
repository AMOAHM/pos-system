# apps/users/middleware.py
import logging

logger = logging.getLogger(__name__)


class AuthDebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/api/'):
            logger.info("=" * 50)
            logger.info(f"REQUEST: {request.method} {request.path}")
            logger.info(f"User: {request.user}")
            logger.info(f"Is Authenticated: {request.user.is_authenticated if hasattr(request.user, 'is_authenticated') else 'N/A'}")
            
            auth_header = request.META.get('HTTP_AUTHORIZATION', None)
            logger.info(f"Authorization Header: {auth_header[:50] + '...' if auth_header else 'MISSING'}")
            
            if auth_header:
                parts = auth_header.split()
                if len(parts) == 2 and parts[0] == 'Bearer':
                    logger.info(f"Token present: {parts[1][:20]}...")
                else:
                    logger.warning(f"Malformed auth header: {auth_header}")
        
        response = self.get_response(request)
        
        if request.path.startswith('/api/'):
            logger.info(f"RESPONSE: {response.status_code}")
            logger.info("=" * 50)
        
        return response