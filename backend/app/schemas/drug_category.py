from typing import Optional
from pydantic import BaseModel

class DrugCategoryBase(BaseModel):
    name: str

class DrugCategoryCreate(DrugCategoryBase):
    pass

class DrugCategoryUpdate(DrugCategoryBase):
    pass

class DrugCategory(DrugCategoryBase):
    id: int

    class Config:
        from_attributes = True
