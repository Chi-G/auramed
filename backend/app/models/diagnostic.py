from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base_class import Base

class DiagnosticType(str, enum.Enum):
    LABORATORY = "Laboratory Test"
    IRIDOLOGY = "Iridology Diagnosis"
    SCLEROLOGY = "Sclerology Diagnosis"
    QRMBA = "Qrmba"
    MANUAL = "Manual Diagnosis"
    REFLEXOLOGY = "Reflexology Diagnosis"
    ACUPUNCTURE = "Acupuncture Diagnosis"

class SpecializedDiagnostic(Base):
    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("clinicalvisit.id"), nullable=False)
    diagnostic_type = Column(Enum(DiagnosticType), nullable=False)
    findings = Column(Text)
    recommendations = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    visit = relationship("ClinicalVisit", backref="specialized_diagnostics")
