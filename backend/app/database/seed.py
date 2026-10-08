"""
Campus Recover — Development Database Seed Script

Populates the database with realistic initial users, campus locations,
and lost/found items for local development and testing.

Run via:
    python -m app.database.seed
"""

import sys
from datetime import datetime, timezone, timedelta

from app.database.session import engine, SessionLocal, Base
from app.models import (
    User,
    CampusLocation,
    Item,
    UserRole,
    ItemType,
    ItemStatus,
    ItemCategory,
)
from app.auth.password import hash_password, hash_verification_answer


def seed_database():
    """Create tables if missing and insert initial seed records."""
    print("🌱 Connecting to database and creating tables if not present...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)

        # ----------------------------------------------------
        # 1. Seed Users
        # ----------------------------------------------------
        admin_email = "admin@university.edu"
        existing_admin = db.query(User).filter(User.email == admin_email).first()

        if not existing_admin:
            print("👤 Seeding initial users...")
            admin_user = User(
                name="Campus Admin",
                email=admin_email,
                password_hash=hash_password("Admin@12345"),
                role=UserRole.ADMIN,
                student_id=None,
                is_active=True,
            )
            student_1 = User(
                name="Jane Doe",
                email="jane.doe@student.university.edu",
                password_hash=hash_password("Student@12345"),
                role=UserRole.STUDENT,
                student_id="STU-98421",
                is_active=True,
            )
            student_2 = User(
                name="John Smith",
                email="john.smith@student.university.edu",
                password_hash=hash_password("Student@12345"),
                role=UserRole.STUDENT,
                student_id="STU-88219",
                is_active=True,
            )
            staff_user = User(
                name="Campus Security & Lost Desk",
                email="security@university.edu",
                password_hash=hash_password("Staff@12345"),
                role=UserRole.STAFF,
                student_id=None,
                is_active=True,
            )
            db.add_all([admin_user, student_1, student_2, staff_user])
            db.commit()
            print("   ✅ Created 4 users (Admin, 2 Students, Staff)")
        else:
            print("   ℹ️ Users already exist, skipping user seeding.")

        # Re-fetch users for foreign keys
        jane = db.query(User).filter(User.email == "jane.doe@student.university.edu").first()
        john = db.query(User).filter(User.email == "john.smith@student.university.edu").first()

        # ----------------------------------------------------
        # 2. Seed Campus Locations
        # ----------------------------------------------------
        loc_count = db.query(CampusLocation).count()
        if loc_count == 0:
            print("📍 Seeding campus locations...")
            locations = [
                CampusLocation(
                    name="Main Campus Library",
                    description="Central university library building, study spaces, and computer labs",
                    latitude=40.7128,
                    longitude=-74.0060,
                    building="W.E.B. Library Tower",
                    floor="2nd Floor",
                    is_active=True,
                ),
                CampusLocation(
                    name="Student Union & Commons",
                    description="Student lounge, cafeterias, clubs office, and bookstore",
                    latitude=40.7135,
                    longitude=-74.0055,
                    building="Student Center Building",
                    floor="1st Floor Atrium",
                    is_active=True,
                ),
                CampusLocation(
                    name="Hall of Sciences & Engineering",
                    description="Classrooms, physics labs, and computer science study lounge",
                    latitude=40.7142,
                    longitude=-74.0070,
                    building="Science Hall North",
                    floor="Ground Floor",
                    is_active=True,
                ),
                CampusLocation(
                    name="Campus Recreation & Athletic Complex",
                    description="Gymnasium, fitness rooms, basketball courts, and locker rooms",
                    latitude=40.7115,
                    longitude=-74.0040,
                    building="Athletic Complex",
                    floor="Locker Concourse",
                    is_active=True,
                ),
                CampusLocation(
                    name="Central Dining Commons",
                    description="Main campus dining cafeteria and cafe terrace",
                    latitude=40.7130,
                    longitude=-74.0045,
                    building="Dining Center",
                    floor="Main Hall",
                    is_active=True,
                ),
            ]
            db.add_all(locations)
            db.commit()
            print("   ✅ Created 5 primary campus landmark locations")
        else:
            print("   ℹ️ Campus locations already exist, skipping location seeding.")

        # Re-fetch locations
        library = db.query(CampusLocation).filter(CampusLocation.name == "Main Campus Library").first()
        student_union = db.query(CampusLocation).filter(CampusLocation.name == "Student Union & Commons").first()
        science_hall = db.query(CampusLocation).filter(CampusLocation.name == "Hall of Sciences & Engineering").first()
        gym = db.query(CampusLocation).filter(CampusLocation.name == "Campus Recreation & Athletic Complex").first()

        # ----------------------------------------------------
        # 3. Seed Realistic Items (Lost & Found)
        # ----------------------------------------------------
        items_count = db.query(Item).count()
        if items_count == 0:
            print("📦 Seeding realistic lost & found item reports...")
            items = [
                # Pair 1: Potential High Match (AirPods Case)
                Item(
                    user_id=jane.id if jane else None,
                    type=ItemType.LOST,
                    title="Black AirPods Pro 2 Case",
                    description="I lost my matte black silicone sleeve AirPods Pro case near the 2nd floor library study tables yesterday afternoon.",
                    category=ItemCategory.ELECTRONICS,
                    subcategory="Audio Accessories",
                    color="Black",
                    brand="Apple",
                    distinguishing_marks="Small white scratch on the bottom right corner",
                    location_name="Library 2nd Floor Study Tables",
                    campus_location_id=library.id if library else None,
                    latitude=40.7129,
                    longitude=-74.0061,
                    date_time=now - timedelta(days=1, hours=3),
                    status=ItemStatus.ACTIVE,
                ),
                Item(
                    user_id=john.id if john else None,
                    type=ItemType.FOUND,
                    title="Black wireless earbud charging case",
                    description="Found a black protective wireless earbud charging case on a chair near the library quiet study section.",
                    category=ItemCategory.ELECTRONICS,
                    subcategory="Audio",
                    color="Black",
                    brand="Apple",
                    location_name="Library Quiet Study Tables",
                    campus_location_id=library.id if library else None,
                    latitude=40.7128,
                    longitude=-74.0059,
                    date_time=now - timedelta(days=1),
                    status=ItemStatus.ACTIVE,
                    verification_question="What is the color of the inner shell or what scratch mark is present?",
                    verification_answer_hash=hash_verification_answer("white scratch on bottom corner"),
                ),

                # Pair 2: Water Bottle near Student Union
                Item(
                    user_id=jane.id if jane else None,
                    type=ItemType.LOST,
                    title="Cobalt Blue Hydro Flask 32oz",
                    description="Left my blue Hydro Flask bottle with stickers at the Student Union food court around lunch.",
                    category=ItemCategory.ACCESSORIES,
                    subcategory="Drinkware",
                    color="Blue",
                    brand="Hydro Flask",
                    distinguishing_marks="Has a National Park sticker and a university robotics club sticker",
                    location_name="Student Union Food Court",
                    campus_location_id=student_union.id if student_union else None,
                    latitude=40.7136,
                    longitude=-74.0054,
                    date_time=now - timedelta(days=2),
                    status=ItemStatus.ACTIVE,
                ),
                Item(
                    user_id=None,
                    type=ItemType.FOUND,
                    title="Blue insulated metal water bottle",
                    description="Recovered a blue vacuum-insulated water bottle from a table in the Student Union dining area.",
                    category=ItemCategory.ACCESSORIES,
                    subcategory="Bottle",
                    color="Blue",
                    brand="Hydro Flask",
                    location_name="Student Union Dining Area",
                    campus_location_id=student_union.id if student_union else None,
                    latitude=40.7135,
                    longitude=-74.0055,
                    date_time=now - timedelta(days=2, hours=-1),
                    status=ItemStatus.ACTIVE,
                    verification_question="Name two stickers on the bottle",
                    verification_answer_hash=hash_verification_answer("national park robotics"),
                ),

                # Single Reports
                Item(
                    user_id=john.id if john else None,
                    type=ItemType.LOST,
                    title="Dark Gray North Face Backpack",
                    description="Left my backpack in the athletic locker hallway lockers. Contains notebooks and a mechanical engineering textbook.",
                    category=ItemCategory.BAGS,
                    subcategory="Backpack",
                    color="Gray",
                    brand="The North Face",
                    location_name="Athletic Complex Locker Hallway",
                    campus_location_id=gym.id if gym else None,
                    latitude=40.7116,
                    longitude=-74.0041,
                    date_time=now - timedelta(hours=14),
                    status=ItemStatus.ACTIVE,
                ),
                Item(
                    user_id=None,
                    type=ItemType.FOUND,
                    title="Student ID Card - CS Department",
                    description="Turned in a student ID card found on the stairs leading to Science Hall room 204.",
                    category=ItemCategory.DOCUMENTS,
                    subcategory="ID Card",
                    color="White / Blue",
                    location_name="Science Hall North Stairwell",
                    campus_location_id=science_hall.id if science_hall else None,
                    latitude=40.7143,
                    longitude=-74.0071,
                    date_time=now - timedelta(hours=6),
                    status=ItemStatus.ACTIVE,
                    verification_question="What is the student ID number or name on the card?",
                    verification_answer_hash=hash_verification_answer("98421"),
                ),
            ]
            db.add_all(items)
            db.commit()
            print("   ✅ Created 6 realistic lost & found items")
        else:
            print("   ℹ️ Items already exist, skipping item seeding.")

        print("\n✨ Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during database seeding: {e}", file=sys.stderr)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
