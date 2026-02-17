from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
from app.db.base_class import Base

class Prescription(Base):
    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("clinicalvisit.id", ondelete="CASCADE"), nullable=True)
    patient_id = Column(String(36), ForeignKey("patient.id", ondelete="CASCADE"), nullable=False)
    drug_id = Column(Integer, ForeignKey("drug.id"), nullable=False)
    dosage = Column(String(255), nullable=False) # e.g., 5ml twice daily
    quantity = Column(Integer, nullable=False)
    instructions = Column(Text)
    is_dispensed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    visit = relationship("ClinicalVisit", backref=backref("prescriptions", cascade="all, delete-orphan"))
    patient = relationship("Patient", backref="prescriptions")
    drug = relationship("Drug")
