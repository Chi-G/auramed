from pydantic import BaseModel
from app.models.user import UserRole

class RolePermissionBase(BaseModel):
    role: UserRole
    permission_key: str
    is_enabled: bool

class RolePermissionCreate(RolePermissionBase):
    pass

class RolePermissionUpdate(BaseModel):
    is_enabled: bool

class RolePermission(RolePermissionBase):
    id: int

    class Config:
        from_attributes = True
