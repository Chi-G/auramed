from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.api import deps
from app.models.bill import Bill as BillModel, PaymentStatus
from app.models.visit import ClinicalVisit
from app.models.patient import Patient
from app.schemas.bill import Bill, BillCreate, BillUpdate, BillPage

router = APIRouter()

@router.get("/", response_model=BillPage)
def read_bills(
    db: Session = Depends(deps.get_db),
    page: int = 1,
    size: int = 10,
    q: Optional[str] = None,
    status: Optional[PaymentStatus] = None,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve bills with filters.
    """
    skip = (page - 1) * size
    query = db.query(BillModel).join(ClinicalVisit).join(Patient)
    
    if q:
        search = f"%{q}%"
        # Search by Invoice ID (Bill.id) or Patient Name
        try:
            bill_id = int(q)
            id_filter = BillModel.id == bill_id
        except ValueError:
            id_filter = False

        query = query.filter(
            or_(
                id_filter,
                func.concat(Patient.first_name, " ", Patient.last_name).ilike(search),
                Patient.patient_id.ilike(search)
            )
        )
    
    if status:
        query = query.filter(BillModel.status == status)

    total = query.count()
    bills = query.order_by(BillModel.created_at.desc()).offset(skip).limit(size).all()
    
    return {
        "items": bills,
        "total": total,
        "page": page,
        "size": size
    }

@router.post("/", response_model=Bill)
def create_bill(
    *,
    db: Session = Depends(deps.get_db),
    bill_in: BillCreate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new bill for a clinical visit.
    """
    bill = BillModel(**bill_in.model_dump())
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return bill

@router.get("/{id}", response_model=Bill)
def read_bill(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get bill by ID.
    """
    bill = db.query(BillModel).filter(BillModel.id == id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill

@router.put("/{id}", response_model=Bill)
def update_bill(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    bill_in: BillUpdate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a bill (e.g., record payment).
    """
    bill = db.query(BillModel).filter(BillModel.id == id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    update_data = bill_in.model_dump(exclude_unset=True)
    
    # Recalculate balance if amount_paid is updated
    if "amount_paid" in update_data:
        new_amount_paid = update_data["amount_paid"]
        update_data["balance"] = bill.total_amount - new_amount_paid
        if update_data["balance"] <= 0:
            update_data["status"] = "paid"
        elif update_data["balance"] < bill.total_amount:
            update_data["status"] = "partial"

    for field in update_data:
        setattr(bill, field, update_data[field])
    
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return bill

@router.delete("/{id}", response_model=Bill)
def delete_bill(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a bill.
    """
    bill = db.query(BillModel).filter(BillModel.id == id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    db.delete(bill)
    db.commit()
    return bill
