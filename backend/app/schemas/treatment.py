from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.treatment import TreatmentType

class TreatmentRecordBase(BaseModel):
    visit_id: int
    treatment_type: TreatmentType
    notes: Optional[str] = None

class TreatmentRecordCreate(TreatmentRecordBase):
    pass

class TreatmentRecord(TreatmentRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
