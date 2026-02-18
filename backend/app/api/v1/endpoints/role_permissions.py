from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.role_permission import RolePermission
from app.models.user import UserRole
from app import schemas

router = APIRouter()

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

@router.get("/my", response_model=Dict[str, bool])
def get_my_permissions(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get permissions for the current logged in user.
    """
    permissions = db.query(RolePermission).filter(RolePermission.role == current_user.role).all()
    return {p.permission_key: p.is_enabled for p in permissions}

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
