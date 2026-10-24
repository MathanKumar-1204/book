"""
BookLeaf Publishing - Flask Application Factory
"""

from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.utils.errors import register_error_handlers
from app.routes.health import health_bp
from app.routes.author import author_bp
from app.routes.admin import admin_bp

def create_app(config_class=Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configure CORS with explicit frontend origin allowlist
    CORS(
        app,
        resources={r"/api/*": {"origins": config_class.CORS_ORIGINS}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
        methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
    )

    # Register centralized error handlers
    register_error_handlers(app)

    # Register API blueprints under /api/v1
    app.register_blueprint(health_bp, url_prefix="/api/v1")
    app.register_blueprint(author_bp, url_prefix="/api/v1")
    app.register_blueprint(admin_bp, url_prefix="/api/v1/admin")

    return app
