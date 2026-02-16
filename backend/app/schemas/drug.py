from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class DrugBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    unit_price: Optional[float] = None
    stock_quantity: Optional[int] = 0
    low_stock_threshold: Optional[int] = 10
    expiry_date: Optional[datetime] = None

class DrugCreate(DrugBase):
    name: str
    unit_price: float

class DrugUpdate(DrugBase):
    pass

class DrugInDBBase(DrugBase):
    id: Optional[int] = None

    class Config:
        from_attributes = True

class Drug(DrugInDBBase):
    pass

class DrugPage(BaseModel):
    items: list[Drug]
    total: int
    page: int
    size: int
