from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class ClinicalVisit(Base):
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(36), ForeignKey("patient.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    visit_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Vitals
    height_cm = Column(Float)
    weight_kg = Column(Float)
    glucose_level = Column(Float)
    bp_systolic = Column(Integer)
    bp_diastolic = Column(Integer)
    bmi = Column(Float)
    
    # Clinical Data
    complaints = Column(Text)
    diagnosis = Column(Text)
    notes = Column(Text)
    follow_up_date = Column(DateTime)

    patient = relationship("Patient", backref="visits")
    doctor = relationship("User")
