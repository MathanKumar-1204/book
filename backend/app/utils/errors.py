"""
BookLeaf Publishing - Centralized Error Handling & Custom Exceptions
Ensures consistent HTTP error schemas across all API endpoints.
"""

from typing import Any, Optional, Dict
from flask import jsonify, Response

class AppError(Exception):
    status_code: int = 500
    error_code: str = "INTERNAL_SERVER_ERROR"

    def __init__(self, message: str, details: Optional[Any] = None, status_code: Optional[int] = None, error_code: Optional[str] = None):
        super().__init__(message)
        self.message = message
        self.details = details
        if status_code is not None:
            self.status_code = status_code
        if error_code is not None:
            self.error_code = error_code

    def to_dict(self) -> Dict[str, Any]:
        rv: Dict[str, Any] = {
            "success": False,
            "error": {
                "code": self.error_code,
                "message": self.message,
            }
        }
        if self.details is not None:
            rv["error"]["details"] = self.details
        return rv

class ValidationError(AppError):
    status_code = 400
    error_code = "VALIDATION_ERROR"

class AuthenticationError(AppError):
    status_code = 401
    error_code = "AUTHENTICATION_REQUIRED"

class AuthorizationError(AppError):
    status_code = 403
    error_code = "FORBIDDEN"

class NotFoundError(AppError):
    status_code = 404
    error_code = "NOT_FOUND"

class ConflictError(AppError):
    status_code = 409
    error_code = "CONFLICT"

class AIServiceError(AppError):
    status_code = 503
    error_code = "AI_SERVICE_UNAVAILABLE"

def register_error_handlers(app):
    @app.errorhandler(AppError)
    def handle_app_error(error: AppError) -> tuple[Response, int]:
        return jsonify(error.to_dict()), error.status_code

    @app.errorhandler(400)
    def handle_bad_request(error) -> tuple[Response, int]:
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": str(error.description if hasattr(error, 'description') else "Bad request"),
            }
        }), 400

    @app.errorhandler(404)
    def handle_not_found(error) -> tuple[Response, int]:
        return jsonify({
            "success": False,
            "error": {
                "code": "ENDPOINT_NOT_FOUND",
                "message": "The requested API endpoint was not found.",
            }
        }), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(error) -> tuple[Response, int]:
        return jsonify({
            "success": False,
            "error": {
                "code": "METHOD_NOT_ALLOWED",
                "message": "The HTTP method is not allowed for this resource.",
            }
        }), 405

    @app.errorhandler(500)
    def handle_server_error(error) -> tuple[Response, int]:
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred. Please try again later.",
            }
        }), 500
