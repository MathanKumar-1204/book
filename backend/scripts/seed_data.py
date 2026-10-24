"""
BookLeaf Publishing - Database Seeder Script
Idempotently imports the official 10 authors and 18 books from bookleaf_sample_data.json into Supabase.
"""

import json
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import Config
from app.services.supabase_service import supabase_service

def seed_database():
    print("==================================================")
    print(" BookLeaf Publishing - Database Seeder")
    print("==================================================")

    # Locate sample data file
    possible_paths = [
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "bookleaf_sample_data.json"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "bookleaf_sample_data.json"),
    ]

    sample_file = None
    for p in possible_paths:
        if os.path.exists(p):
            sample_file = p
            break

    if not sample_file:
        print("[ERROR] bookleaf_sample_data.json was not found in project workspace.")
        sys.exit(1)

    print(f"[1/3] Reading official dataset from: {sample_file}")
    with open(sample_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    authors = data.get("authors", [])
    print(f"      Found {len(authors)} authors to process.")

    if not supabase_service.is_connected or not supabase_service.client:
        print("[WARN] Supabase credentials not configured in environment.")
        print("       In-memory store has been automatically populated for local testing.")
        print("       To seed a live Supabase PostgreSQL instance, configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.")
        return

    client = supabase_service.client
    print("[2/3] Seeding authors into Supabase profiles...")
    total_books_seeded = 0

    for idx, author in enumerate(authors, start=2):
        # Generate deterministic UUID for author mapping
        author_uuid = f"00000000-0000-0000-0000-{idx:012d}"
        profile_record = {
            "id": author_uuid,
            "full_name": author.get("name"),
            "email": author.get("email"),
            "phone": author.get("phone"),
            "city": author.get("city"),
            "role": "author",
        }

        try:
            # Upsert profile
            client.table("profiles").upsert(profile_record).execute()
            print(f"      [Author] Seeded: {author.get('name')} ({author.get('email')})")
        except Exception as e:
            print(f"      [Author] Failed to upsert {author.get('name')}: {e}")

        # Seed books for this author
        for book in author.get("books", []):
            book_record = {
                "id": book.get("book_id"),
                "author_id": author_uuid,
                "title": book.get("title"),
                "isbn": book.get("isbn"),
                "genre": book.get("genre"),
                "publication_date": book.get("publication_date"),
                "status": book.get("status"),
                "mrp": book.get("mrp"),
                "author_royalty_per_copy": book.get("author_royalty_per_copy"),
                "total_copies_sold": book.get("total_copies_sold", 0),
                "total_royalty_earned": book.get("total_royalty_earned", 0.0),
                "royalty_paid": book.get("royalty_paid", 0.0),
                "royalty_pending": book.get("royalty_pending", 0.0),
                "last_royalty_payout_date": book.get("last_royalty_payout_date"),
                "print_partner": book.get("print_partner"),
                "available_on": book.get("available_on", []),
            }

            try:
                client.table("books").upsert(book_record).execute()
                total_books_seeded += 1
            except Exception as e:
                print(f"      [Book] Failed to upsert {book.get('title')}: {e}")

    print("[3/3] Seeding completed!")
    print(f"      Successfully processed {len(authors)} authors and {total_books_seeded} books.")
    print("==================================================")

if __name__ == "__main__":
    seed_database()
