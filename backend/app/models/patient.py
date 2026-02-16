import uuid
from sqlalchemy import Column, Integer, String, Date, Text, DateTime
from sqlalchemy.sql import func
from app.db.base_class import Base

class Patient(Base):
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(50), unique=True, index=True) # Serial number/ID
    first_name = Column(String(255), index=True, nullable=False)
    last_name = Column(String(255), index=True, nullable=False)
    middle_name = Column(String(255), nullable=True)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(20), nullable=False)
    phone_number = Column(String(50), index=True)
    email = Column(String(255), index=True)
    address = Column(Text)
    medical_history = Column(Text, nullable=True)
    
    # Next of Kin
    next_of_kin_name = Column(String(255), nullable=True)
    next_of_kin_relation = Column(String(100), nullable=True)
    next_of_kin_phone = Column(String(50), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
