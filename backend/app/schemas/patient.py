from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import date, datetime

# Shared properties
class PatientBase(BaseModel):
    patient_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    medical_history: Optional[str] = None
    next_of_kin_name: Optional[str] = None
    next_of_kin_relation: Optional[str] = None
    next_of_kin_phone: Optional[str] = None

# Properties to receive on creation
class PatientCreate(PatientBase):
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str

# Properties to receive on update
class PatientUpdate(PatientBase):
    pass

class PatientInDBBase(PatientBase):
    id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Additional properties to return via API
# Additional properties to return via API
class Patient(PatientInDBBase):
    pass

class PatientPage(BaseModel):
    items: list[Patient]
    total: int
    page: int
    size: int
