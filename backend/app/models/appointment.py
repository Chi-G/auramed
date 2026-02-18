from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
import enum
from app.db.base_class import Base

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    ARRIVED = "arrived"
    IN_CONSULTATION = "in_consultation"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class Appointment(Base):
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(36), ForeignKey("patient.id", ondelete="CASCADE"), nullable=False)
    appointment_date = Column(DateTime, nullable=False)
    reason_for_visit = Column(Text)
    status = Column(
        Enum(AppointmentStatus, values_callable=lambda x: [e.value for e in x]), 
        default=AppointmentStatus.SCHEDULED
    )
    notes = Column(Text, nullable=True)

    patient = relationship("Patient", backref="appointments")
