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
        perms = permissions_matrix.get(role, {k: False for k in ["view_dashboard", "manage_doctors", "manage_appointments", "manage_patients", "manage_clinical_visits", "manage_pharmacy", "manage_billing", "manage_settings", "manage_roles", "view_reports", "delete_patient", "delete_appointment", "delete_visit"]})
        for key, enabled in perms.items():
            exists = db.query(RolePermission).filter(
                RolePermission.role == role,
                RolePermission.permission_key == key
            ).first()
            if not exists:
                new_perm = RolePermission(role=role, permission_key=key, is_enabled=enabled)
                db.add(new_perm)
            else:
                exists.is_enabled = enabled
    
    db.commit()
    print("Default permissions seeded successfully.")

if __name__ == "__main__":
    init_db()
