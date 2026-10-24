"""
BookLeaf Publishing - Role-Based Access Control (RBAC) Middleware
Enforces author and admin permissions on protected routes.
"""

from functools import wraps
from flask import g
from app.utils.errors import AuthorizationError, AuthenticationError

def require_role(*allowed_roles: str):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(g, "current_user") or not g.current_user:
                raise AuthenticationError("Authentication required before authorization check.")

            user_role = g.current_user.get("role")
            if user_role not in allowed_roles:
                raise AuthorizationError(
                    f"Access denied. Requires one of roles: {', '.join(allowed_roles)}. Your role is '{user_role}'."
                )

            return f(*args, **kwargs)

        return decorated_function

    return decorator

# Convenience decorators
def require_admin(f):
    return require_role("admin")(f)

def require_author(f):
    return require_role("author", "admin")(f)
