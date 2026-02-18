from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User as UserModel, UserRole
from app.models.role_permission import RolePermission
from app.schemas.user import User, UserCreate, UserUpdate
from app.core.security import get_password_hash

router = APIRouter()

@router.get("/me", response_model=User)
def read_user_me(
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.get("/", response_model=List[User])
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    role: Optional[UserRole] = None,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve users. Only users with manage_roles or manage_users permission can list users.
    """
    # Check permissions
    permissions = db.query(RolePermission).filter(RolePermission.role == current_user.role).all()
    perm_dict = {p.permission_key: p.is_enabled for p in permissions}
    
    # Base restriction: Only users with manage_roles or manage_users can list users generally.
    can_list = current_user.is_superuser or perm_dict.get('manage_roles') or perm_dict.get('manage_users')
    
    # Exception: Allow listing specifically DOCTORS if the user can manage patients or appointments
    # This is needed for Receptionists and Nurses to handle assignments.
    if not can_list and role == UserRole.DOCTOR:
        if perm_dict.get('manage_patients') or perm_dict.get('manage_appointments'):
            can_list = True

    if not can_list:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    
    query = db.query(UserModel)
    if role:
        query = query.filter(UserModel.role == role)
        
    users = query.offset(skip).limit(limit).all()
    return users

@router.post("/", response_model=User)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new user (clinic staff).
    Enforces role hierarchy:
    - Super Admin can create any role.
    - Admin can only create Doctor, Nurse, and Receptionist.
    """
    # Permission check
    can_create = False
    if current_user.is_superuser or current_user.role == UserRole.SUPER_ADMIN:
        can_create = True
    elif current_user.role == UserRole.ADMIN:
        # Admins can only create non-admin, non-superuser staff
        if user_in.role in [UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST]:
            can_create = True
        else:
            raise HTTPException(
                status_code=403,
                detail="Admins can only create Doctors, Nurses, or Receptionists."
            )
    
    if not can_create:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )

    user = db.query(UserModel).filter(UserModel.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    
    new_user = UserModel(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        is_superuser=False, # Only Super Admins can set this, but we force False for simplicity here
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/me", response_model=User)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserUpdate,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update own user.
    """
    if user_in.email and user_in.email != current_user.email:
        user = db.query(UserModel).filter(UserModel.email == user_in.email).first()
        if user:
            raise HTTPException(
                status_code=400,
                detail="The user with this username already exists in the system.",
            )
            
    user_data = user_in.model_dump(exclude_unset=True)
    if "password" in user_data and user_data["password"]:
        from app.core.security import get_password_hash
        hashed_password = get_password_hash(user_data["password"])
        del user_data["password"]
        user_data["hashed_password"] = hashed_password

    for field in user_data:
        setattr(current_user, field, user_data[field])

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
@router.get("/{user_id}", response_model=User)
def read_user_by_id(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a specific user by ID. Only Admins and SuperAdmins can view other users.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN] and not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=User)
def update_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a user. Only Admins and SuperAdmins can update other users.
    Enforces role hierarchy (same as creation).
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN] and not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent self-deactivation
    if user_id == current_user.id and user_in.is_active is False:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")

    # If updating role, check hierarchy
    if user_in.role and user_in.role != user.role:
        if not (current_user.is_superuser or current_user.role == UserRole.SUPER_ADMIN):
            if current_user.role == UserRole.ADMIN:
                if user_in.role not in [UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST]:
                    raise HTTPException(status_code=403, detail="Admins cannot promote users to Admin or SuperAdmin")
            else:
                raise HTTPException(status_code=403, detail="Not enough privileges to change role")

    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data["password"])
        del update_data["password"]

    for field in update_data:
        setattr(user, field, update_data[field])

    db.add(user)
    db.commit()
    db.refresh(user)
    return user
