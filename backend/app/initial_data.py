from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def init_db():
    db = SessionLocal()
    # Check if admin already exists
    admin = db.query(User).filter(User.email == "admin@auramed.com").first()
    if not admin:
        admin_user = User(
            email="admin@auramed.com",
            hashed_password=get_password_hash("admin123"),
            full_name="AuraMed Administrator",
            role=UserRole.ADMIN,
            is_superuser=True,
        )
        db.add(admin_user)
        db.commit()
        print("Admin user created: admin@auramed.com / admin123")
    else:
        print("Admin user already exists.")

    # Check if super admin already exists
    super_admin = db.query(User).filter(User.email == "superadmin@auramed.com").first()
    if not super_admin:
        super_admin_user = User(
            email="superadmin@auramed.com",
            hashed_password=get_password_hash("superadmin123"),
            full_name="Super Administrator",
            role=UserRole.SUPER_ADMIN,
            is_superuser=True,
        )
        db.add(super_admin_user)
        db.commit()
        print("Super Admin user created: superadmin@auramed.com / superadmin123")
    # Adding more roles
    roles_to_seed = [
        ("doctor@auramed.com", "doctor123", "Dr. Opeyemi", UserRole.DOCTOR),
        ("nurse@auramed.com", "nurse123", "Nurse Chiji", UserRole.NURSE),
        ("receptionist@auramed.com", "reception123", "Receptionist Nia", UserRole.RECEPTIONIST),
    ]

    for email, password, name, role in roles_to_seed:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            new_user = User(
                email=email,
                hashed_password=get_password_hash(password),
                full_name=name,
                role=role,
                is_superuser=False,
            )
            db.add(new_user)
            db.commit()
            print(f"{role} user created: {email} / {password}")
        else:
            print(f"{role} user already exists.")

if __name__ == "__main__":
    init_db()
