from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.treatment import TreatmentRecord as TreatmentModel
from app.schemas.treatment import TreatmentRecord, TreatmentRecordCreate

router = APIRouter()

@router.get("/", response_model=List[TreatmentRecord])
def read_treatments(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve treatment records.
    """
    treatments = db.query(TreatmentModel).offset(skip).limit(limit).all()
    return treatments

@router.post("/", response_model=TreatmentRecord)
def create_treatment(
    *,
    db: Session = Depends(deps.get_db),
    treatment_in: TreatmentRecordCreate,
) -> Any:
    """
    Create new treatment record.
    """
    treatment = TreatmentModel(**treatment_in.model_dump())
    db.add(treatment)
    db.commit()
    db.refresh(treatment)
    return treatment

@router.get("/visit/{visit_id}", response_model=List[TreatmentRecord])
def read_treatments_by_visit(
    visit_id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Get treatments for a specific visit.
    """
    return db.query(TreatmentModel).filter(TreatmentModel.visit_id == visit_id).all()
