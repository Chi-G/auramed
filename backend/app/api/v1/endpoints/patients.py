from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.api import deps
from app.models.patient import Patient as PatientModel
from app.schemas.patient import Patient, PatientCreate, PatientUpdate, PatientPage

router = APIRouter()

@router.get("/", response_model=PatientPage)
def read_patients(
    db: Session = Depends(deps.get_db),
    page: int = 1,
    size: int = Query(default=10),
    q: Optional[str] = None,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve patients with search and pagination.
    """
    skip = (page - 1) * size
    query = db.query(PatientModel)
    
    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                func.concat(PatientModel.first_name, " ", PatientModel.last_name).ilike(search),
                PatientModel.patient_id.ilike(search),
                PatientModel.first_name.ilike(search),
                PatientModel.last_name.ilike(search),
                PatientModel.phone_number.ilike(search)
            )
        )
    
    total = query.count()
    patients = query.offset(skip).limit(size).all()
    
    return {
        "items": patients,
        "total": total,
        "page": page,
        "size": size
    }

@router.post("/", response_model=Patient)
def create_patient(
    *,
    db: Session = Depends(deps.get_db),
    patient_in: PatientCreate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new patient.
    """
    patient_data = patient_in.model_dump()
    if not patient_data.get("patient_id"):
        max_id = db.query(func.max(PatientModel.patient_id)).filter(PatientModel.patient_id.like("AURAMED%")).scalar()
        if max_id:
            try:
                # Extract number from AURAMED001
                num_part = max_id.replace("AURAMED", "")
                next_num = int(num_part) + 1
            except (ValueError, TypeError):
                next_num = 1
        else:
            next_num = 1
        patient_data["patient_id"] = f"AURAMED{str(next_num).zfill(3)}"
        
    patient = PatientModel(**patient_data)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@router.get("/{id}", response_model=Patient)
def read_patient(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get patient by ID.
    """
    patient = db.query(PatientModel).filter(PatientModel.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.put("/{id}", response_model=Patient)
def update_patient(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    patient_in: PatientUpdate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a patient.
    """
    patient = db.query(PatientModel).filter(PatientModel.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = patient_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(patient, field, update_data[field])
    
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@router.delete("/{id}", response_model=Patient)
def delete_patient(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a patient.
    """
    patient = db.query(PatientModel).filter(PatientModel.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    db.delete(patient)
    db.commit()
    return patient
