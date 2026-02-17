from typing import Any, List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.api import deps
from app.models.patient import Patient as PatientModel
from app.models.visit import ClinicalVisit as ClinicalVisitModel
from app.models.treatment import TreatmentRecord as TreatmentModel
from app.models.diagnostic import SpecializedDiagnostic as DiagnosticModel
from app.models.bill import Bill as BillModel, PaymentStatus
from app.models.clinic_settings import ClinicSettings as ClinicSettingsModel
from app.schemas.visit import ClinicalVisit, VisitCreate, VisitUpdate, ClinicalVisitPage
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=ClinicalVisitPage)
def read_visits(
    db: Session = Depends(deps.get_db),
    page: int = 1,
    size: int = Query(default=10),
    q: Optional[str] = None,
    patient_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve visits with filters.
    """
    skip = (page - 1) * size
    query = db.query(ClinicalVisitModel).join(PatientModel)
    
    if patient_id:
        query = query.filter(ClinicalVisitModel.patient_id == patient_id)
    
    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                func.concat(PatientModel.first_name, " ", PatientModel.last_name).ilike(search),
                ClinicalVisitModel.diagnosis.ilike(search),
                ClinicalVisitModel.complaints.ilike(search),
                PatientModel.patient_id.ilike(search)
            )
        )
        
    if start_date:
        query = query.filter(ClinicalVisitModel.visit_date >= start_date)
        
    if end_date:
        # Include the entire end date
        query = query.filter(func.date(ClinicalVisitModel.visit_date) <= end_date)

    total = query.count()
    visits = query.order_by(ClinicalVisitModel.visit_date.desc()).offset(skip).limit(size).all()
    
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
    with open("debug_log.txt", "a") as f:
        f.write(f"DEBUG: create_visit called\n")
        f.write(f"DEBUG: visit_in treatments: {visit_in.treatments}\n")
        f.write(f"DEBUG: visit_in diagnostics: {visit_in.diagnostics}\n")
    
    visit_data = visit_in.model_dump(exclude={"treatments", "diagnostics"})
    visit = ClinicalVisitModel(
        **visit_data,
        doctor_id=current_user.id
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    
    # Create Treatment Records
    if visit_in.treatments:
        for treatment in visit_in.treatments:
            db_treatment = TreatmentRecord(
                visit_id=visit.id,
                treatment_type=TreatmentType(treatment.treatment_type),
                notes=treatment.notes
            )
            db.add(db_treatment)
            
    # Create Diagnostic Records
    if visit_in.diagnostics:
        for diagnostic in visit_in.diagnostics:
            db_diagnostic = SpecializedDiagnostic(
                visit_id=visit.id,
                diagnostic_type=DiagnosticType(diagnostic.diagnostic_type),
                findings=diagnostic.findings,
                recommendations=diagnostic.recommendations
            )
            db.add(db_diagnostic)
    
    db.commit()
    db.refresh(visit)

    # Automatically trigger billing
    # Fetch consultation fee from settings
    settings = db.query(ClinicSettingsModel).first()
    fee = settings.consultation_fee if settings else 50.0

    new_bill = BillModel(
        visit_id=visit.id,
        patient_id=visit.patient_id,
        consultation_fee=fee,
        total_amount=fee,
        balance=fee,
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
    visit = db.query(ClinicalVisitModel).filter(ClinicalVisitModel.id == id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return visit

@router.put("/{id}", response_model=ClinicalVisit)
def update_visit(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    visit_in: VisitUpdate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a clinical visit.
    """
    visit = db.query(ClinicalVisitModel).filter(ClinicalVisitModel.id == id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    # Update flat fields
    # print statements are more reliable for capturing output in some environments
    print(f"DEBUG: Updating visit {id}")
    print(f"DEBUG: visit_in: {visit_in.model_dump()}")
    
    update_data = visit_in.model_dump(exclude={"treatments", "diagnostics"}, exclude_unset=True)
    print(f"DEBUG: update_data to apply: {update_data}")
    for field in update_data:
        old_val = getattr(visit, field)
        new_val = update_data[field]
        print(f"DEBUG: Changing {field} from {old_val} to {new_val}")
        setattr(visit, field, new_val)
    
    # Update Treatments: Clear and add new
    if visit_in.treatments is not None:
        print(f"DEBUG: Updating treatments: {visit_in.treatments}")
        visit.treatment_records = [] # This works because of cascade="all, delete-orphan"
        for treatment in visit_in.treatments:
            db_treatment = TreatmentRecord(
                treatment_type=TreatmentType(treatment.treatment_type),
                notes=treatment.notes
            )
            visit.treatment_records.append(db_treatment)
            
    # Update Diagnostics: Clear and add new
    if visit_in.diagnostics is not None:
        print(f"DEBUG: Updating diagnostics: {visit_in.diagnostics}")
        visit.specialized_diagnostics = [] # This works because of cascade="all, delete-orphan"
        for diagnostic in visit_in.diagnostics:
            db_diagnostic = SpecializedDiagnostic(
                diagnostic_type=DiagnosticType(diagnostic.diagnostic_type),
                findings=diagnostic.findings,
                recommendations=diagnostic.recommendations
            )
            visit.specialized_diagnostics.append(db_diagnostic)
    
    print(f"DEBUG: About to commit changes for visit {id}")
    db.add(visit)
    db.commit()
    db.refresh(visit)
    print(f"DEBUG: Update complete for visit {id}")
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
    visit = db.query(ClinicalVisitModel).filter(ClinicalVisitModel.id == id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    visit_schema = ClinicalVisit.model_validate(visit)
    db.delete(visit)
    db.commit()
    return visit_schema
