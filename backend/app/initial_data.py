from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def init_db():
    from app.db.session import engine
    from app.db.base import Base
    Base.metadata.create_all(bind=engine)
    
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

    # Seed Default Permissions
    from app.models.role_permission import RolePermission
    
    permissions_matrix = {
        UserRole.SUPER_ADMIN: {
            "view_dashboard": True, "manage_doctors": True, "manage_appointments": True, 
            "manage_patients": True, "manage_clinical_visits": True, "manage_pharmacy": True, 
            "manage_billing": True, "manage_settings": True, "manage_roles": True, "view_reports": True,
            "delete_patient": True, "delete_appointment": True, "delete_visit": True
        },
        UserRole.ADMIN: {
            "view_dashboard": True, "manage_doctors": True, "manage_appointments": True, 
            "manage_patients": True, "manage_clinical_visits": True, "manage_pharmacy": True, 
            "manage_billing": True, "manage_settings": True, "manage_roles": True, "view_reports": True,
            "delete_patient": True, "delete_appointment": True, "delete_visit": True
        },
        UserRole.DOCTOR: {
            "view_dashboard": True, "manage_doctors": False, "manage_appointments": True, 
            "manage_patients": True, "manage_clinical_visits": True, "manage_pharmacy": True, 
            "manage_billing": False, "manage_settings": False, "manage_roles": False, "view_reports": True,
            "delete_patient": False, "delete_appointment": False, "delete_visit": False
        },
        UserRole.NURSE: {
            "view_dashboard": True, "manage_doctors": False, "manage_appointments": True, 
            "manage_patients": True, "manage_clinical_visits": True, "manage_pharmacy": False, 
            "manage_billing": False, "manage_settings": False, "manage_roles": False, "view_reports": True,
            "delete_patient": False, "delete_appointment": False, "delete_visit": False
        },
        UserRole.RECEPTIONIST: {
            "view_dashboard": False, "manage_doctors": False, "manage_appointments": True, 
            "manage_patients": True, "manage_clinical_visits": True, "manage_pharmacy": False, 
            "manage_billing": True, "manage_settings": False, "manage_roles": False, "view_reports": False,
            "delete_patient": False, "delete_appointment": False, "delete_visit": False
        },
        UserRole.CASHIER: {
            "view_dashboard": False, "manage_doctors": False, "manage_appointments": False,
            "manage_patients": True, "manage_clinical_visits": False, "manage_pharmacy": True,
            "manage_billing": True, "manage_settings": False, "manage_roles": False, "view_reports": False,
            "delete_patient": False, "delete_appointment": False, "delete_visit": False
        }
    }

    # Seed for all UserRole or existing in permissions_matrix
    for role in UserRole:
        role_value = role.value if hasattr(role, 'value') else str(role)
        perms = permissions_matrix.get(role, {})
        
        # Ensure we also give Superusers/Admins is_superuser = True if they already exist
        if role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
            users = db.query(User).filter(User.role == role_value).all()
            for u in users:
                if not u.is_superuser:
                    u.is_superuser = True
                    db.add(u)
        for key, enabled in perms.items():
            exists = db.query(RolePermission).filter(
                RolePermission.role == role_value,
                RolePermission.permission_key == key
            ).first()
            if not exists:
                new_perm = RolePermission(role=role_value, permission_key=key, is_enabled=enabled)
                db.add(new_perm)
            else:
                exists.is_enabled = enabled
    
    db.commit()
    print("Default permissions seeded and superuser flags fixed.")
    
    # 2. Seed Pharmacy Data
    seed_pharmacy_data(db)

def seed_pharmacy_data(db):
    from app.models.drug import Drug
    from app.models.drug_category import DrugCategory
    
    categories = [
        "Antibiotics", "Analgesics", "Antidiabetics", "Cardiovascular",
        "Antimalarials", "Gastrointestinal", "Antihistamines", "Supplements", "Respiratory"
    ]
    
    specialized_drugs = [
        ("Liver Detox", "Supplements", 4500.0, 50),
        ("Kidney Detox", "Supplements", 4500.0, 40),
        ("Anti-Viral", "Antivirals", 7500.0, 20),
        ("Gbd(General Body Detox)", "Supplements", 5500.0, 30),
        ("Anti-Obstructive", "Respiratory", 6000.0, 25),
        ("Immune Booster", "Supplements", 3500.0, 100),
        ("Cardio-Solution", "Cardiovascular", 8500.0, 15),
        ("CNM", "Specialized", 12000.0, 10),
        ("CNS", "Specialized", 15000.0, 10),
        ("Psa(Prostate Solution)", "Specialized", 9500.0, 15),
        ("Staph Cleanser", "Antibiotics", 5000.0, 45),
        ("Clove Extract", "Supplements", 2500.0, 120),
        ("Fertility Booster", "Supplements", 18000.0, 20),
        ("Infection Flusher", "Antibiotics", 6500.0, 35),
        ("Anti Inflammation", "Analgesics", 3000.0, 80),
        ("Natural Water & Milk", "Supplements", 500.0, 200),
        ("Garlic+", "Supplements", 2000.0, 150),
        ("Activated Charcoal", "Gastrointestinal", 1500.0, 100)
    ]

    print("\nPopulating pharmacy categories...")
    for cat_name in categories + ["Antivirals", "Specialized"]:
        exists = db.query(DrugCategory).filter(DrugCategory.name == cat_name).first()
        if not exists:
            new_cat = DrugCategory(name=cat_name)
            db.add(new_cat)
            print(f"Added category: {cat_name}")
    
    db.commit()

    print("Populating specialized drugs...")
    for name, cat, price, stock in specialized_drugs:
        exists = db.query(Drug).filter(Drug.name == name).first()
        if not exists:
            new_drug = Drug(
                name=name,
                category=cat,
                unit_price=price,
                stock_quantity=stock,
                low_stock_threshold=10
            )
            db.add(new_drug)
            print(f"Added drug: {name}")
    
    db.commit()
    print("Pharmacy data seeded successfully.")

if __name__ == "__main__":
    init_db()
