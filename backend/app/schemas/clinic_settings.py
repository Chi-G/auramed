from typing import Optional
from pydantic import BaseModel

class ClinicSettingsBase(BaseModel):
    name: Optional[str] = "AuraMed Clinical Management"
    contact_number: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    consultation_fee: Optional[float] = 50.0
    currency_symbol: Optional[str] = "₦"
    currency_name: Optional[str] = "Naira"
    logo_url: Optional[str] = None
    drug_categories: Optional[str] = "General,Antibiotics,Painkillers,Antimalarials,Vitamins"

class ClinicSettingsCreate(ClinicSettingsBase):
    pass

class ClinicSettingsUpdate(ClinicSettingsBase):
    pass

class ClinicSettings(ClinicSettingsBase):
    id: int

    class Config:
        from_attributes = True
