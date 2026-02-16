from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.models.bill import PaymentStatus
from .visit import ClinicalVisit

class BillBase(BaseModel):
    visit_id: Optional[int] = None
    consultation_fee: Optional[float] = 0.0
    drug_cost: Optional[float] = 0.0
    total_amount: Optional[float] = 0.0
    amount_paid: Optional[float] = 0.0
    balance: Optional[float] = 0.0
    status: Optional[PaymentStatus] = "unpaid"
    payment_date: Optional[datetime] = None

class BillCreate(BillBase):
    visit_id: int
    total_amount: float

class BillUpdate(BillBase):
    pass

class BillInDBBase(BillBase):
    id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Bill(BillInDBBase):
    visit: Optional[ClinicalVisit] = None

class BillPage(BaseModel):
    items: List[Bill]
    total: int
    page: int
    size: int
