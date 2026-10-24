"""
BookLeaf Publishing - Server Entrypoint
"""

import os
from app import create_app
from app.config import Config

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", Config.PORT))
    print(f"[BookLeaf API] Starting server on port {port} (DEBUG={Config.DEBUG})...")
    app.run(host="0.0.0.0", port=port, debug=Config.DEBUG)
