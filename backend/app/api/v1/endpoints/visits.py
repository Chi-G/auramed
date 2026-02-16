from typing import Any, List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.api import deps
from app.models.visit import ClinicalVisit as VisitModel
from app.models.bill import Bill as BillModel, PaymentStatus
from app.models.patient import Patient
from app.schemas.visit import ClinicalVisit, VisitCreate, ClinicalVisitPage

router = APIRouter()

@router.get("/", response_model=ClinicalVisitPage)
def read_visits(
    db: Session = Depends(deps.get_db),
    page: int = 1,
    size: int = 10,
    q: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve visits with filters.
    """
    skip = (page - 1) * size
    query = db.query(VisitModel).join(Patient)
    
    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                func.concat(Patient.first_name, " ", Patient.last_name).ilike(search),
                VisitModel.diagnosis.ilike(search),
                VisitModel.complaints.ilike(search),
                Patient.patient_id.ilike(search)
            )
        )
        
    if start_date:
        query = query.filter(VisitModel.visit_date >= start_date)
        
    if end_date:
        # Include the entire end date
        query = query.filter(func.date(VisitModel.visit_date) <= end_date)

    total = query.count()
    visits = query.order_by(VisitModel.visit_date.desc()).offset(skip).limit(size).all()
    
    return {
        "items": visits,
        "total": total,
        "page": page,
        "size": size
    }

@router.post("/", response_model=ClinicalVisit)
def create_visit(
    *,
    db: Session = Depends(deps.get_db),
    visit_in: VisitCreate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Record a new clinical visit.
    """
    visit = VisitModel(
        **visit_in.model_dump(),
        doctor_id=current_user.id
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)

    # Automatically trigger billing
    # For now, we'll use a flat consultation fee of 50.0
    new_bill = BillModel(
        visit_id=visit.id,
        consultation_fee=50.0,
        total_amount=50.0,
        balance=50.0,
        status=PaymentStatus.UNPAID
    )
    db.add(new_bill)
    db.commit()

    return visit

@router.get("/{id}", response_model=ClinicalVisit)
def read_visit(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get clinical visit by ID.
    """
    visit = db.query(VisitModel).filter(VisitModel.id == id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return visit

@router.put("/{id}", response_model=ClinicalVisit)
def update_visit(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    visit_in: ClinicalVisit, # Reusing ClinicalVisit schema for update or I should create VisitUpdate
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a clinical visit.
    """
    visit = db.query(VisitModel).filter(VisitModel.id == id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    update_data = visit_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(visit, field, update_data[field])
    
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return visit

@router.delete("/{id}", response_model=ClinicalVisit)
def delete_visit(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a clinical visit.
    """
    visit = db.query(VisitModel).filter(VisitModel.id == id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    db.delete(visit)
    db.commit()
    return visit
