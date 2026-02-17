from sqlalchemy import Column, Integer, String, Float, Text
from app.db.base_class import Base

class ClinicSettings(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), default="AuraMed Clinical Management")
    contact_number = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    consultation_fee = Column(Float, default=50.0)
    currency_symbol = Column(String(10), default="₦")
    currency_name = Column(String(50), default="Naira")
    logo_url = Column(String(255), nullable=True)
    drug_categories = Column(Text, default="General,Antibiotics,Painkillers,Antimalarials,Vitamins")
