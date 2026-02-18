from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.models.appointment import AppointmentStatus
from .patient import Patient

class AppointmentBase(BaseModel):
    patient_id: Optional[str] = None
    appointment_date: Optional[datetime] = None
    reason_for_visit: Optional[str] = None
    status: Optional[AppointmentStatus] = AppointmentStatus.SCHEDULED
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    patient_id: str
    appointment_date: datetime

class AppointmentUpdate(AppointmentBase):
    pass

class AppointmentInDBBase(AppointmentBase):
    id: Optional[int] = None

    class Config:
        from_attributes = True

class Appointment(AppointmentInDBBase):
    patient: Optional[Patient] = None

class AppointmentPage(BaseModel):
    items: list[Appointment]
    total: int
    page: int
    size: int
