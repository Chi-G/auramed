from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.clinic_settings import ClinicSettings as ClinicSettingsModel
from app.schemas.clinic_settings import ClinicSettings, ClinicSettingsUpdate

router = APIRouter()

@router.get("/", response_model=ClinicSettings)
def read_settings(
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get clinic settings.
    """
    settings = db.query(ClinicSettingsModel).first()
    if not settings:
        settings = ClinicSettingsModel()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/", response_model=ClinicSettings)
def update_settings(
    *,
    db: Session = Depends(deps.get_db),
    settings_in: ClinicSettingsUpdate,
    current_user: Any = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Update clinic settings.
    """
    settings = db.query(ClinicSettingsModel).first()
    if not settings:
        settings = ClinicSettingsModel()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    update_data = settings_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(settings, field, update_data[field])
    
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings
