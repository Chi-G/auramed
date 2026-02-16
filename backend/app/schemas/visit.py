from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from .patient import Patient

class VisitBase(BaseModel):
    patient_id: Optional[int] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    glucose_level: Optional[float] = None
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    bmi: Optional[float] = None
    complaints: Optional[str] = None
    diagnosis: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[datetime] = None

class VisitCreate(VisitBase):
    patient_id: int

class VisitInDBBase(VisitBase):
    id: Optional[int] = None
    doctor_id: Optional[int] = None
    visit_date: Optional[datetime] = None

    class Config:
        from_attributes = True

class ClinicalVisit(VisitInDBBase):
    patient: Optional[Patient] = None

class ClinicalVisitPage(BaseModel):
    items: list[ClinicalVisit]
    total: int
    page: int
    size: int
