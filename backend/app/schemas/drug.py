from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime

class DrugBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    unit_price: Optional[float] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(0, ge=0)
    low_stock_threshold: Optional[int] = Field(10, ge=0)
    expiry_date: Optional[datetime] = None

class DrugCreate(DrugBase):
    name: str = Field(..., min_length=2)
    category: str = Field(...)
    unit_price: float = Field(..., gt=0)
    stock_quantity: int = Field(..., ge=0)
    low_stock_threshold: int = Field(..., ge=0)
    expiry_date: datetime = Field(...)

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
