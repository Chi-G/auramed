from __future__ import annotations
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from pydantic import BaseModel
from app.models.bill import PaymentStatus

if TYPE_CHECKING:
    from .visit import ClinicalVisit, VisitInDBBase
    from .patient import Patient

class BillBase(BaseModel):
    visit_id: Optional[int] = None
    patient_id: Optional[str] = None
    consultation_fee: Optional[float] = 0.0
    drug_cost: Optional[float] = 0.0
    total_amount: Optional[float] = 0.0
    amount_paid: Optional[float] = 0.0
    balance: Optional[float] = 0.0
    status: Optional[PaymentStatus] = "unpaid"
    payment_date: Optional[datetime] = None

class BillCreate(BillBase):
    patient_id: str
    total_amount: float

class BillUpdate(BillBase):
    pass

class BillInDBBase(BillBase):
    id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Bill(BillInDBBase):
    visit: Optional[VisitInDBBase] = None # Use InDBBase to break recursion (no 'bill' field)
    patient: Optional[Patient] = None

class ConsultationRequest(BaseModel):
    patient_id: str

class BillPage(BaseModel):
    items: List[Bill]
    total: int
    page: int
    size: int

# Rebuild model to handle circular ref if any
from .visit import VisitInDBBase
from .patient import Patient
Bill.model_rebuild()
