from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
import enum
from app.db.base_class import Base

class TreatmentType(str, enum.Enum):
    NUTRITIONAL = "Nutritional Medicine"
    ACUPUNCTURE = "Acupuncture/Acupressure Therapy"
    CHIROPRACTIC = "Chiropractic Therapy"
    CUPPING = "Cupping Therapy"
    AROMATHERAPY = "Aromatherapy"
    MANUAL = "Manual Therapy"
    PHYTOREMEDIES = "Phytoremedies"
    RECIPES = "Nutritional Recipes"

class TreatmentRecord(Base):
    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("clinicalvisit.id", ondelete="CASCADE"), nullable=False)
    treatment_type = Column(Enum(TreatmentType), nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    visit = relationship("ClinicalVisit", backref=backref("treatment_records", cascade="all, delete-orphan"))
