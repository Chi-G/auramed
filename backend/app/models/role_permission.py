from sqlalchemy import Column, Integer, String, Boolean, Enum
from app.db.base_class import Base
from app.models.user import UserRole

class RolePermission(Base):
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(50), nullable=False)
    permission_key = Column(String(100), nullable=False)
    is_enabled = Column(Boolean, default=False)
