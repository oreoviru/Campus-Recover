"""
Campus Recover — Admin Profile Creation & Promotion CLI

Usage:
  1. Promote an existing registered user to Admin:
     python -m app.database.create_admin --promote user@rishihood.edu.in

  2. Create a brand-new Admin account:
     python -m app.database.create_admin --email admin@rishihood.edu.in --name "Admin Name" --password "SecurePassword123"

  3. Interactive mode:
     python -m app.database.create_admin
"""

import sys
import argparse
import getpass
from app.database.session import SessionLocal, engine, Base
from app.models import User, UserRole
from app.auth.password import hash_password


def promote_user_to_admin(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email.strip().lower()).first()
        if not user:
            print(f"❌ User with email '{email}' not found.")
            print("   Available registered users:")
            for u in db.query(User).all():
                print(f"     - {u.email} ({u.name}) [Role: {u.role.value}]")
            return False

        old_role = user.role.value
        user.role = UserRole.ADMIN
        user.is_active = True
        db.commit()
        print(f"🎉 Success! User '{user.name}' ({user.email}) upgraded from {old_role} to ADMIN.")
        return True
    finally:
        db.close()


def create_new_admin(email: str, name: str, password: str):
    db = SessionLocal()
    try:
        email = email.strip().lower()
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            if existing.role == UserRole.ADMIN:
                print(f"ℹ️ User '{email}' is already an ADMIN.")
                return True
            existing.role = UserRole.ADMIN
            existing.is_active = True
            db.commit()
            print(f"🎉 User '{email}' already existed and has been promoted to ADMIN.")
            return True

        new_admin = User(
            name=name.strip(),
            email=email,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(new_admin)
        db.commit()
        print(f"🎉 Success! Created new Admin account:")
        print(f"   Name:  {new_admin.name}")
        print(f"   Email: {new_admin.email}")
        print(f"   Role:  {new_admin.role.value}")
        return True
    finally:
        db.close()


def main():
    Base.metadata.create_all(bind=engine)

    parser = argparse.ArgumentParser(description="Create or promote an Admin in Campus Recover")
    parser.add_argument("--promote", type=str, help="Email of existing user to promote to ADMIN")
    parser.add_argument("--email", type=str, help="Email for new admin profile")
    parser.add_argument("--name", type=str, help="Full name for new admin profile")
    parser.add_argument("--password", type=str, help="Password for new admin profile")

    args = parser.parse_args()

    if args.promote:
        promote_user_to_admin(args.promote)
        return

    if args.email:
        if not args.name or not args.password:
            print("❌ Both --name and --password are required when passing --email.")
            sys.exit(1)
        create_new_admin(args.email, args.name, args.password)
        return

    # Interactive mode
    print("========================================")
    print(" Campus Recover — Admin Account Setup")
    print("========================================")
    print("1. Promote an existing user to Admin")
    print("2. Create a brand-new Admin user")
    choice = input("Select an option (1 or 2): ").strip()

    if choice == "1":
        email = input("Enter email of user to promote: ").strip()
        promote_user_to_admin(email)
    elif choice == "2":
        email = input("Enter admin email: ").strip()
        name = input("Enter admin full name: ").strip()
        password = getpass.getpass("Enter secure password: ").strip()
        confirm = getpass.getpass("Confirm password: ").strip()
        if password != confirm:
            print("❌ Passwords do not match.")
            sys.exit(1)
        create_new_admin(email, name, password)
    else:
        print("❌ Invalid option selected.")


if __name__ == "__main__":
    main()
