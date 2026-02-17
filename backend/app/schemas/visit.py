from __future__ import annotations
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING, Any
from pydantic import BaseModel
from .patient import Patient
from .prescription import Prescription

if TYPE_CHECKING:
    from .bill import Bill, BillInDBBase
    from .prescription import Prescription

class VisitBase(BaseModel):
    patient_id: Optional[str] = None
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

# Treatment Schemas
class TreatmentRecordBase(BaseModel):
    treatment_type: str
    notes: Optional[str] = None

class TreatmentRecordCreate(TreatmentRecordBase):
    pass

class TreatmentRecord(TreatmentRecordBase):
    id: int
    visit_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Diagnostic Schemas
class SpecializedDiagnosticBase(BaseModel):
    diagnostic_type: str
    findings: Optional[str] = None
    recommendations: Optional[str] = None

class SpecializedDiagnosticCreate(SpecializedDiagnosticBase):
    pass

class SpecializedDiagnostic(SpecializedDiagnosticBase):
    id: int
    visit_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class VisitCreate(VisitBase):
    patient_id: str
    treatments: Optional[List[TreatmentRecordCreate]] = None
    diagnostics: Optional[List[SpecializedDiagnosticCreate]] = None

class VisitUpdate(VisitBase):
    treatments: Optional[List[TreatmentRecordCreate]] = None
    diagnostics: Optional[List[SpecializedDiagnosticCreate]] = None

class VisitInDBBase(VisitBase):
    id: Optional[int] = None
    doctor_id: Optional[int] = None
    visit_date: Optional[datetime] = None
    patient: Optional[Patient] = None # Added back to fix billing display
    prescriptions: List[Prescription] = []

    class Config:
        from_attributes = True

class ClinicalVisit(VisitInDBBase):
    treatment_records: List[TreatmentRecord] = []
    specialized_diagnostics: List[SpecializedDiagnostic] = []
    prescriptions: List[Prescription] = []
    bill: Optional[BillInDBBase] = None

class ClinicalVisitPage(BaseModel):
    items: list[ClinicalVisit]
    total: int
    page: int
    size: int

# Rebuild model
from .bill import BillInDBBase
from .prescription import Prescription
VisitInDBBase.model_rebuild()
ClinicalVisit.model_rebuild()
