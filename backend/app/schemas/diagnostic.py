from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.diagnostic import DiagnosticType

class SpecializedDiagnosticBase(BaseModel):
    visit_id: int
    diagnostic_type: DiagnosticType
    findings: Optional[str] = None
    recommendations: Optional[str] = None

class SpecializedDiagnosticCreate(SpecializedDiagnosticBase):
    pass

class SpecializedDiagnostic(SpecializedDiagnosticBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
