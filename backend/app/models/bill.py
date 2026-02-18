from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
import enum
from app.db.base_class import Base

class PaymentStatus(str, enum.Enum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"

class Bill(Base):
    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("clinicalvisit.id", ondelete="CASCADE"), nullable=True)
    patient_id = Column(String(36), ForeignKey("patient.id", ondelete="CASCADE"), nullable=False)
    consultation_fee = Column(Float, default=0.0)
    drug_cost = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0.0)
    balance = Column(Float, default=0.0)
    status = Column(Enum(PaymentStatus, values_callable=lambda x: [e.value for e in x]), default=PaymentStatus.UNPAID)
    payment_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    visit = relationship("ClinicalVisit", backref=backref("bill", cascade="all, delete-orphan", uselist=False))
    patient = relationship("Patient", backref="bills")
