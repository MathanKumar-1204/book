"""
BookLeaf Publishing - Vercel Serverless Entrypoint
Exports the Flask WSGI application instance for Vercel Python runtime.
"""

import sys
import os

# Ensure backend root directory is on sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from app import create_app

# Instantiate Flask application
app = create_app()
app.debug = False
