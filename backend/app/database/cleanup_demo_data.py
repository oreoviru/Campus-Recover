"""
Campus Recover — Purge Demo & Bot Data Script

Removes all demo users, bot accounts, demo items, matches, claims,
and demo notifications while preserving official campus locations
and legitimate user accounts.
"""

import os
from pathlib import Path
from app.database.session import SessionLocal
from app.models import User, Item, Claim, Match, Notification, CampusLocation
from app.config import settings

DEMO_EMAILS = [
    "admin@university.edu",
    "jane.doe@student.university.edu",
    "john.smith@student.university.edu",
    "security@university.edu",
    "phase7_student@student.university.edu",
]


def purge_demo_data():
    db = SessionLocal()
    try:
        print("🧹 Starting cleanup of demo data...")

        # 1. Delete all matches (all were generated from demo items)
        matches_deleted = db.query(Match).delete()
        print(f"   🗑️  Deleted {matches_deleted} demo matches")

        # 2. Delete all claims
        claims_deleted = db.query(Claim).delete()
        print(f"   🗑️  Deleted {claims_deleted} demo claims")

        # 3. Delete all notifications
        notifs_deleted = db.query(Notification).delete()
        print(f"   🗑️  Deleted {notifs_deleted} demo notifications")

        # 4. Delete all items
        items_deleted = db.query(Item).delete()
        print(f"   🗑️  Deleted {items_deleted} demo items")

        # 5. Delete demo users
        users_deleted = 0
        for email in DEMO_EMAILS:
            user = db.query(User).filter(User.email == email).first()
            if user:
                db.delete(user)
                users_deleted += 1
                print(f"   👤 Deleted demo bot user: {email}")

        db.commit()
        print(f"\n✅ Database cleared: {users_deleted} demo users and {items_deleted} demo items removed.")

        # 6. Clean demo upload images from uploads directory
        upload_path = Path(settings.upload_dir).resolve()
        cleaned_files = 0
        if upload_path.exists():
            for file in upload_path.iterdir():
                if file.is_file() and file.name != ".gitkeep":
                    file.unlink()
                    cleaned_files += 1
        print(f"   🖼️  Cleaned {cleaned_files} demo uploaded files from {settings.upload_dir}")

        # Summary of remaining records
        remaining_users = db.query(User).all()
        loc_count = db.query(CampusLocation).count()
        print(f"\n📊 Remaining clean state:")
        print(f"   📍 Campus Locations: {loc_count} (Rishihood University landmarks preserved)")
        print(f"   👥 Real Users: {len(remaining_users)}")
        for u in remaining_users:
            print(f"      - {u.name} ({u.email}) [Role: {u.role.value}]")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during demo data cleanup: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    purge_demo_data()
