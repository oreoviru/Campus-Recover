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
        # 2. Seed Campus Locations (Rishihood University, Sonipat)
        # ----------------------------------------------------
        loc_count = db.query(CampusLocation).count()
        if loc_count == 0:
            print("📍 Seeding Rishihood University campus locations...")
            locations = [
                CampusLocation(
                    name="Ashok Goyal Central Library",
                    description="Central university library, reading rooms, quiet study pods, book stacks, and digital resources.",
                    latitude=28.9833,
                    longitude=77.0912,
                    building="Central Library",
                    floor="Main Reading Floor",
                    is_active=True,
                ),
                CampusLocation(
                    name="Block A",
                    description="Main academic building, core lecture halls, executive seminar rooms, and faculty chambers.",
                    latitude=28.9836,
                    longitude=77.0904,
                    building="Block A",
                    floor="Lecture Theatres & Classrooms",
                    is_active=True,
                ),
                CampusLocation(
                    name="Block B",
                    description="Academic Block B housing computing labs, smart classrooms, and faculty offices.",
                    latitude=28.9840,
                    longitude=77.0903,
                    building="Block B",
                    floor="Classrooms & Computing Labs",
                    is_active=True,
                ),
                CampusLocation(
                    name="Block C",
                    description="Academic Block C housing design studios, workshops, and creative learning spaces.",
                    latitude=28.9844,
                    longitude=77.0902,
                    building="Block C",
                    floor="Design Studios & Workshops",
                    is_active=True,
                ),
                CampusLocation(
                    name="Residency 1 (R1)",
                    description="Student residential hostel R1 and ground floor common recreation area.",
                    latitude=28.9822,
                    longitude=77.0915,
                    building="Residency 1",
                    floor="Hostel Block",
                    is_active=True,
                ),
                CampusLocation(
                    name="Residency 2 (R2)",
                    description="Student residential hostel R2 and student lounge.",
                    latitude=28.9820,
                    longitude=77.0918,
                    building="Residency 2",
                    floor="Hostel Block",
                    is_active=True,
                ),
                CampusLocation(
                    name="Residency 3 (R3)",
                    description="Student residential hostel R3 and study area.",
                    latitude=28.9824,
                    longitude=77.0919,
                    building="Residency 3",
                    floor="Hostel Block",
                    is_active=True,
                ),
                CampusLocation(
                    name="Residency 4 (R4)",
                    description="Student residential hostel R4 and recreation rooms.",
                    latitude=28.9826,
                    longitude=77.0921,
                    building="Residency 4",
                    floor="Hostel Block",
                    is_active=True,
                ),
                CampusLocation(
                    name="DOSAI (Food Stall)",
                    description="Popular campus South Indian food stall, snacks counter, and outdoor seating.",
                    latitude=28.9829,
                    longitude=77.0909,
                    building="Food Court Kiosk",
                    floor="Ground Floor",
                    is_active=True,
                ),
                CampusLocation(
                    name="ChaiAdda",
                    description="ChaiAdda tea, coffee, and snack stall, active student gathering hub.",
                    latitude=28.9831,
                    longitude=77.0907,
                    building="Cafeteria Promenade",
                    floor="Ground Floor",
                    is_active=True,
                ),
                CampusLocation(
                    name="Learners Arena",
                    description="Open-air amphitheatre, collaborative forum, and student cultural events arena.",
                    latitude=28.9835,
                    longitude=77.0909,
                    building="Learners Arena",
                    floor="Open Amphitheatre",
                    is_active=True,
                ),
                CampusLocation(
                    name="Gym",
                    description="Modern fitness gymnasium, strength training machines, and cardio area.",
                    latitude=28.9843,
                    longitude=77.0915,
                    building="Sports & Fitness Center",
                    floor="Indoor Gym",
                    is_active=True,
                ),
                CampusLocation(
                    name="Badminton Court",
                    description="Indoor wooden badminton courts and sports changing facilities.",
                    latitude=28.9845,
                    longitude=77.0913,
                    building="Indoor Sports Arena",
                    floor="Ground Floor",
                    is_active=True,
                ),
                CampusLocation(
                    name="Nescafe",
                    description="Nescafe coffee kiosk, quick beverages and grab-and-go counter.",
                    latitude=28.9834,
                    longitude=77.0905,
                    building="Academic Plaza Kiosk",
                    floor="Ground Floor",
                    is_active=True,
                ),
                CampusLocation(
                    name="Laundry Collection Point",
                    description="Campus student laundry drop-off and collection service point.",
                    latitude=28.9821,
                    longitude=77.0913,
                    building="Hostel Utility Hub",
                    floor="Ground Floor",
                    is_active=True,
                ),
                CampusLocation(
                    name="Pushpa Devi Dining Hall",
                    description="Main student and faculty central dining mess hall.",
                    latitude=28.9827,
                    longitude=77.0906,
                    building="Dining Complex",
                    floor="Main Mess Hall",
                    is_active=True,
                ),
                CampusLocation(
                    name="Old Mess",
                    description="Old mess dining hall and multi-purpose student gathering space.",
                    latitude=28.9825,
                    longitude=77.0904,
                    building="Old Dining Hall",
                    floor="Ground Floor",
                    is_active=True,
                ),
                CampusLocation(
                    name="Basketball Court",
                    description="Full-size outdoor synthetic basketball court with floodlights.",
                    latitude=28.9846,
                    longitude=77.0917,
                    building="Outdoor Sports Arena",
                    floor="Outdoor Court",
                    is_active=True,
                ),
                CampusLocation(
                    name="Tennis Court",
                    description="Regulation outdoor lawn tennis court.",
                    latitude=28.9848,
                    longitude=77.0919,
                    building="Outdoor Sports Arena",
                    floor="Outdoor Court",
                    is_active=True,
                ),
                CampusLocation(
                    name="Other (Campus Grounds / Unlisted)",
                    description="Any other campus area, outdoor lawns, walkways, parking zones, open amphitheatre, or unlisted spots.",
                    latitude=28.9832,
                    longitude=77.0908,
                    building="Other / Campus Grounds",
                    floor="Open Area",
                    is_active=True,
                ),
            ]
            db.add_all(locations)
            db.commit()
            print("   ✅ Created 20 official Rishihood University campus landmark locations")
        else:
            print("   ℹ️ Campus locations already exist, skipping location seeding.")

        # Re-fetch locations
        library = db.query(CampusLocation).filter(CampusLocation.name.ilike("%Library%")).first()
        dining_hall = db.query(CampusLocation).filter(CampusLocation.name.ilike("%Pushpa%")).first()
        academic_a = db.query(CampusLocation).filter(CampusLocation.name == "Block A").first()
        gym_loc = db.query(CampusLocation).filter(CampusLocation.name == "Gym").first()

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
                    latitude=28.9833,
                    longitude=77.0912,
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
                    latitude=28.9832,
                    longitude=77.0911,
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
                    location_name="Pushpa Devi Dining Hall Area",
                    campus_location_id=dining_hall.id if dining_hall else None,
                    latitude=28.9827,
                    longitude=77.0907,
                    date_time=now - timedelta(days=2),
                    status=ItemStatus.ACTIVE,
                ),
                Item(
                    user_id=None,
                    type=ItemType.FOUND,
                    title="Blue insulated metal water bottle",
                    description="Recovered a blue vacuum-insulated water bottle from a table in the Pushpa Devi dining area.",
                    category=ItemCategory.ACCESSORIES,
                    subcategory="Bottle",
                    color="Blue",
                    brand="Hydro Flask",
                    location_name="Pushpa Devi Dining Hall",
                    campus_location_id=dining_hall.id if dining_hall else None,
                    latitude=28.9828,
                    longitude=77.0906,
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
                    location_name="Gym Changing Rooms",
                    campus_location_id=gym_loc.id if gym_loc else None,
                    latitude=28.9843,
                    longitude=77.0915,
                    date_time=now - timedelta(hours=14),
                    status=ItemStatus.ACTIVE,
                ),
                Item(
                    user_id=None,
                    type=ItemType.FOUND,
                    title="Student ID Card - CS Department",
                    description="Turned in a student ID card found on the stairs leading to Block A room 204.",
                    category=ItemCategory.DOCUMENTS,
                    subcategory="ID Card",
                    color="White / Blue",
                    location_name="Block A Stairwell",
                    campus_location_id=academic_a.id if academic_a else None,
                    latitude=28.9836,
                    longitude=77.0904,
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
