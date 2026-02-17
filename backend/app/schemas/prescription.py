from __future__ import annotations
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from pydantic import BaseModel

if TYPE_CHECKING:
    from .drug import Drug
    from .patient import Patient

class PrescriptionBase(BaseModel):
    visit_id: Optional[int] = None
    patient_id: Optional[str] = None
    drug_id: int
    dosage: str
    quantity: int
    instructions: Optional[str] = None
    is_dispensed: Optional[bool] = False

class PrescriptionCreate(PrescriptionBase):
    patient_id: str

class PrescriptionUpdate(PrescriptionBase):
    pass

class PrescriptionInDBBase(PrescriptionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Prescription(PrescriptionInDBBase):
    drug: Optional[Drug] = None
    patient: Optional[Patient] = None

from .drug import Drug
from .patient import Patient
Prescription.model_rebuild()

class DispenseRequest(BaseModel):
    patient_id: str
    drug_id: int
    quantity: int
    dosage: Optional[str] = "As prescribed"
    instructions: Optional[str] = None
