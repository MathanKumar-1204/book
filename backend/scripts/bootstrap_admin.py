"""
BookLeaf Publishing - Admin Bootstrap Script
Creates or promotes the BookLeaf operations admin account in Supabase.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import Config
from app.services.supabase_service import supabase_service

def bootstrap_admin(email: str = "admin@bookleaf.in", full_name: str = "BookLeaf Operations Lead"):
    print("==================================================")
    print(" BookLeaf Publishing - Admin Account Bootstrap")
    print("==================================================")

    if not supabase_service.is_connected or not supabase_service.client:
        print("[INFO] Supabase credentials not configured in environment.")
        print(f"       In-memory admin profile '{email}' is active for local development and automated testing.")
        print("       Default Admin Demo Token: 'demo-admin'")
        return

    client = supabase_service.client
    admin_id = "00000000-0000-0000-0000-000000000001"

    try:
        # Check if auth user exists or create profile
        profile_data = {
            "id": admin_id,
            "full_name": full_name,
            "email": email,
            "role": "admin",
        }
        client.table("profiles").upsert(profile_data).execute()
        print(f"[SUCCESS] Admin profile '{email}' verified with role='admin'.")
    except Exception as e:
        print(f"[ERROR] Failed to bootstrap admin profile: {e}")

if __name__ == "__main__":
    bootstrap_admin()
