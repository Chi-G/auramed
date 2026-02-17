from typing import Any, List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.api import deps
from app.models.appointment import Appointment as AppointmentModel, AppointmentStatus
from app.models.patient import Patient
from app.schemas.appointment import Appointment, AppointmentCreate, AppointmentUpdate, AppointmentPage

router = APIRouter()

@router.get("/", response_model=AppointmentPage)
def read_appointments(
    db: Session = Depends(deps.get_db),
    page: int = 1,
    size: int = Query(default=10),
    q: Optional[str] = None,
    status: Optional[AppointmentStatus] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve appointments with filters.
    """
    skip = (page - 1) * size
    query = db.query(AppointmentModel).join(Patient)
    
    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                func.concat(Patient.first_name, " ", Patient.last_name).ilike(search),
                AppointmentModel.reason_for_visit.ilike(search),
                Patient.patient_id.ilike(search)
            )
        )
    
    if status:
        query = query.filter(AppointmentModel.status == status)
        
    if start_date:
        query = query.filter(AppointmentModel.appointment_date >= start_date)
        
    if end_date:
        # Include the entire end date
        import datetime as dt
        # Make end_date cover the whole day by adding 1 day or handling time
        # Simply using date comparison usually works if mapped to DateTime, but let's be safe
        query = query.filter(func.date(AppointmentModel.appointment_date) <= end_date)

    total = query.count()
    appointments = query.order_by(AppointmentModel.appointment_date.desc()).offset(skip).limit(size).all()
    
    return {
        "items": appointments,
        "total": total,
        "page": page,
        "size": size
    }

@router.post("/", response_model=Appointment)
def create_appointment(
    *,
    db: Session = Depends(deps.get_db),
    appointment_in: AppointmentCreate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new appointment.
    """
    appointment = AppointmentModel(**appointment_in.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment

@router.get("/{id}", response_model=Appointment)
def read_appointment(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get appointment by ID.
    """
    appointment = db.query(AppointmentModel).filter(AppointmentModel.id == id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment

@router.put("/{id}", response_model=Appointment)
def update_appointment(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    appointment_in: AppointmentUpdate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update an appointment.
    """
    appointment = db.query(AppointmentModel).filter(AppointmentModel.id == id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    update_data = appointment_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(appointment, field, update_data[field])
    
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment

@router.delete("/{id}", response_model=Appointment)
def delete_appointment(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete an appointment.
    """
    appointment = db.query(AppointmentModel).filter(AppointmentModel.id == id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    db.delete(appointment)
    db.commit()
    return appointment
