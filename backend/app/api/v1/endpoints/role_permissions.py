from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.role_permission import RolePermission
from app.models.user import UserRole
from app import schemas

router = APIRouter()

@router.get("/diagnostic", response_model=Dict[str, Any])
def get_permission_diagnostic(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Diagnostic tool to trace why a user has certain permissions.
    """
    role_raw = current_user.role or ""
    role_normalized = str(role_raw).lower().replace("_", "").replace(" ", "")

    from sqlalchemy import func
    db_perms = db.query(RolePermission).filter(
        func.lower(RolePermission.role) == str(role_raw).lower()
    ).all()
    
    db_result = {p.permission_key: p.is_enabled for p in db_perms}
    
    # Calculate final permissions using the same logic as /my
    final_perms = get_my_permissions(db=db, current_user=current_user)
    
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "role_raw": role_raw,
        "role_normalized": role_normalized,
        "is_superuser": current_user.is_superuser,
        "db_permissions": db_result,
        "final_permissions": final_perms,
        "logic_summary": "Superuser Bypass" if current_user.is_superuser else "Standard Role Logic + Additive Fallbacks"
    }

@router.get("/my", response_model=Dict[str, bool])
def get_my_permissions(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get permissions for the current logged in user.
    """

    if current_user.is_superuser or current_user.role == UserRole.SUPER_ADMIN:

        all_perms_query = db.query(RolePermission.permission_key).distinct().all()
        all_perms = [p[0] for p in all_perms_query]

        default_keys = [
            "view_dashboard", "manage_patients", "manage_appointments", 
            "manage_clinical_visits", "manage_pharmacy", "manage_billing", 
            "manage_settings", "manage_roles", "view_reports", "manage_doctors",
            "delete_patient", "delete_appointment", "delete_visit"
        ]

        keys = list(set(all_perms + default_keys))
        return {k: True for k in keys}

    from sqlalchemy import func
    permissions = db.query(RolePermission).filter(
        func.lower(RolePermission.role) == current_user.role.lower()
    ).all()
    
    result = {p.permission_key: p.is_enabled for p in permissions}
    
    # NORMALIZATION & FALLBACKS
    # This ensures that even if DB is missing rows, staff can still function.
    role_name = str(current_user.role).lower().replace("_", "").replace(" ", "")
    
    # Mandated Permissions for Staff (Always True even if False in DB)
    mandated_perms = []
    if role_name in ['admin', 'superadmin']:
        mandated_perms = [
            "view_dashboard", "manage_patients", "manage_appointments", 
            "manage_clinical_visits", "manage_pharmacy", "manage_billing", 
            "manage_settings", "manage_roles", "view_reports", "manage_doctors"
        ]
    elif role_name == 'doctor':
        mandated_perms = [
            "view_dashboard", "manage_appointments", "manage_patients", 
            "manage_clinical_visits", "manage_pharmacy", "view_reports"
        ]
    elif role_name == 'nurse':
        mandated_perms = [
            "view_dashboard", "manage_appointments", "manage_patients", 
            "manage_clinical_visits", "view_reports"
        ]
    elif role_name == 'receptionist':
        mandated_perms = [
            "view_dashboard", "manage_appointments", "manage_patients", 
            "manage_clinical_visits", "manage_billing"
        ]
    elif role_name == 'cashier':
        mandated_perms = [
            "view_dashboard", "manage_patients", "manage_pharmacy", "manage_billing"
        ]
    
    # Apply mandated defaults IF the permission is not already True in DB (Additive)
    for p_key in mandated_perms:
        if p_key not in result or not result[p_key]:
            result[p_key] = True

    return result

@router.get("/", response_model=Dict[str, Dict[str, bool]])
def get_role_permissions(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all role permissions. Superusers or users with manage_roles can access this.
    Returns a matrix: { role: { permission_key: is_enabled } }
    """
    # Check if user has manage_roles permission
    user_perms = db.query(RolePermission).filter(RolePermission.role == current_user.role).all()
    has_manage_roles = any(p.permission_key == 'manage_roles' and p.is_enabled for p in user_perms)
    
    if not current_user.is_superuser and not has_manage_roles:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    permissions = db.query(RolePermission).all()
    matrix = {}
    
    # Initialize matrix for all roles
    for role in UserRole:
        matrix[role.value] = {}
        
    for p in permissions:
        # p.role is now a string, not an enum member
        role_key = p.role
        if role_key in matrix:
            matrix[role_key][p.permission_key] = p.is_enabled
        
    return matrix




@router.put("/{role}", response_model=Dict[str, bool])
def update_role_permissions(
    role: UserRole,
    permissions_update: Dict[str, bool],
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update permissions for a specific role. Superusers can update all.
    Admins with manage_roles can update non-admin roles.
    """
    # Check permissions
    user_perms = db.query(RolePermission).filter(RolePermission.role == current_user.role).all()
    has_manage_roles = any(p.permission_key == 'manage_roles' and p.is_enabled for p in user_perms)
    
    can_update = False
    if current_user.is_superuser:
        can_update = True
    elif has_manage_roles:
        # Admins can only update permissions for roles they can create
        if role in [UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.CASHIER]:
            can_update = True
            
    if not can_update:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    for key, enabled in permissions_update.items():
        permission = db.query(RolePermission).filter(
            RolePermission.role == role.value if isinstance(role, UserRole) else role,
            RolePermission.permission_key == key
        ).first()
        
        if permission:
            permission.is_enabled = enabled
        else:
            permission = RolePermission(
                role=role,
                permission_key=key,
                is_enabled=enabled
            )
            db.add(permission)
            
    db.commit()
    
    # Return updated permissions for this role
    updated = db.query(RolePermission).filter(RolePermission.role == role).all()
    return {p.permission_key: p.is_enabled for p in updated}
