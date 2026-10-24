"""
BookLeaf Publishing - Authentication Middleware
Validates Supabase JWT access tokens and injects authenticated user into request context.
"""

from functools import wraps
from flask import request, g
from app.utils.errors import AuthenticationError
from app.services.supabase_service import supabase_service

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            raise AuthenticationError("Authorization header is missing. Please provide a Bearer token.")

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise AuthenticationError("Invalid Authorization header format. Expected 'Bearer <token>'.")

        token = parts[1]
        user_profile = supabase_service.verify_auth_token(token)
        if not user_profile:
            raise AuthenticationError("Invalid or expired session token. Please log in again.")

        # Store authenticated profile in Flask context g
        g.current_user = user_profile
        return f(*args, **kwargs)

    return decorated_function
