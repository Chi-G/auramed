from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from app.db.base_class import Base

class Drug(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    description = Column(Text)
    category = Column(String(100))
    unit_price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, default=0)
    low_stock_threshold = Column(Integer, default=10)
    expiry_date = Column(DateTime, nullable=True)
