from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.api import deps
from app.models.drug import Drug as DrugModel
from app.models.prescription import Prescription as PrescriptionModel
from app.models.bill import Bill as BillModel, PaymentStatus
from app.models.clinic_settings import ClinicSettings as ClinicSettingsModel
from app.models.drug_category import DrugCategory as DrugCategoryModel
from app.schemas.drug import Drug, DrugCreate, DrugUpdate, DrugPage
from app.schemas.prescription import Prescription, DispenseRequest
from app.schemas.drug_category import DrugCategory as DrugCategorySchema, DrugCategoryCreate

router = APIRouter()

@router.get("/dispense", response_model=List[Prescription])
def list_dispensed_drugs(
    *,
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    List recent dispensed drugs for history view.
    """
    prescriptions = db.query(PrescriptionModel).options(
        joinedload(PrescriptionModel.drug),
        joinedload(PrescriptionModel.patient)
    ).filter(
        PrescriptionModel.is_dispensed == True
    ).order_by(PrescriptionModel.id.desc()).limit(20).all()
    return prescriptions

@router.post("/dispense", response_model=Prescription)
def dispense_drug(
    *,
    db: Session = Depends(deps.get_db),
    dispense_in: DispenseRequest,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Dispense a drug to a patient and update billing.
    """
    drug = db.query(DrugModel).filter(DrugModel.id == dispense_in.drug_id).first()
    if not drug:
        raise HTTPException(status_code=404, detail="Drug not found")
    
    if drug.stock_quantity < dispense_in.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    # 1. Update stock
    drug.stock_quantity -= dispense_in.quantity
    db.add(drug)
    
    # 2. Create Prescription (as dispensed)
    prescription = PrescriptionModel(
        patient_id=dispense_in.patient_id,
        drug_id=dispense_in.drug_id,
        dosage=dispense_in.dosage,
        quantity=dispense_in.quantity,
        instructions=dispense_in.instructions,
        is_dispensed=True
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    
    # 3. Update or Create Bill
    drug_cost = drug.unit_price * dispense_in.quantity
    
    # Find the most recent unpaid or partial bill for this patient
    bill = db.query(BillModel).filter(
        BillModel.patient_id == dispense_in.patient_id,
        BillModel.status != PaymentStatus.PAID
    ).order_by(BillModel.created_at.desc()).first()
    
    if not bill:
        # Create a new bill if no active one exists
        # Fetch consultation fee from settings
        settings = db.query(ClinicSettingsModel).first()
        fee = settings.consultation_fee if settings else 0.0
        
        total = fee + drug_cost
        
        bill = BillModel(
            patient_id=dispense_in.patient_id,
            consultation_fee=fee,
            total_amount=total,
            drug_cost=drug_cost,
            balance=total,
            status=PaymentStatus.UNPAID
        )
    else:
        # Update existing bill
        bill.drug_cost += drug_cost
        bill.total_amount += drug_cost
        bill.balance += drug_cost
        if bill.status == PaymentStatus.PAID: # Should not happen based on filter above
            bill.status = PaymentStatus.PARTIAL
            
    db.add(bill)
    db.commit()
    
    return prescription

@router.get("/", response_model=DrugPage)
def read_drugs(
    db: Session = Depends(deps.get_db),
    page: int = 1,
    size: int = Query(default=10),
    q: Optional[str] = None,
    category: Optional[str] = None,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve drugs with filters.
    """
    skip = (page - 1) * size
    query = db.query(DrugModel)
    
    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                DrugModel.name.ilike(search),
                DrugModel.description.ilike(search),
                DrugModel.category.ilike(search)
            )
        )
    
    if category:
        query = query.filter(DrugModel.category == category)
    
    total = query.count()
    drugs = query.offset(skip).limit(size).all()
    
    return {
        "items": drugs,
        "total": total,
        "page": page,
        "size": size
    }

@router.post("/", response_model=Drug)
def create_drug(
    *,
    db: Session = Depends(deps.get_db),
    drug_in: DrugCreate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Add new drug to pharmacy.
    """
    drug = DrugModel(**drug_in.model_dump())
    db.add(drug)
    db.commit()
    db.refresh(drug)
    db.refresh(drug)
    return drug

@router.get("/{id}", response_model=Drug)
def read_drug(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get drug by ID.
    """
    drug = db.query(DrugModel).filter(DrugModel.id == id).first()
    if not drug:
        raise HTTPException(status_code=404, detail="Drug not found")
    return drug

@router.put("/{id}", response_model=Drug)
def update_drug(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    drug_in: DrugUpdate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a drug.
    """
    drug = db.query(DrugModel).filter(DrugModel.id == id).first()
    if not drug:
        raise HTTPException(status_code=404, detail="Drug not found")
    
    update_data = drug_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(drug, field, update_data[field])
    
    db.add(drug)
    db.commit()
    db.refresh(drug)
    return drug

@router.delete("/{id}", response_model=Drug)
def delete_drug(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a drug.
    """
    drug = db.query(DrugModel).filter(DrugModel.id == id).first()
    if not drug:
        raise HTTPException(status_code=404, detail="Drug not found")
    
    db.delete(drug)
    db.commit()
    return drug

@router.get("/categories", response_model=List[DrugCategorySchema])
def list_categories(
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    List all drug categories. Migrates from ClinicSettings if empty.
    """
    categories = db.query(DrugCategoryModel).all()
    
    if not categories:
        # Check if we have categories in ClinicSettings to migrate
        settings = db.query(ClinicSettingsModel).first()
        if settings and settings.drug_categories:
            cat_list = [c.strip() for c in settings.drug_categories.split(',') if c.strip()]
            for cat_name in cat_list:
                # Avoid duplicates just in case
                exists = db.query(DrugCategoryModel).filter(DrugCategoryModel.name == cat_name).first()
                if not exists:
                    new_cat = DrugCategoryModel(name=cat_name)
                    db.add(new_cat)
            db.commit()
            categories = db.query(DrugCategoryModel).all()
            
    return categories

@router.post("/categories", response_model=DrugCategorySchema)
def create_category(
    *,
    db: Session = Depends(deps.get_db),
    category_in: DrugCategoryCreate,
    current_user: Any = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Create a new drug category.
    """
    category = db.query(DrugCategoryModel).filter(DrugCategoryModel.name == category_in.name).first()
    if category:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    category = DrugCategoryModel(**category_in.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.delete("/categories/{id}", response_model=dict)
def delete_category(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Any = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Delete a drug category.
    """
    category = db.query(DrugCategoryModel).filter(DrugCategoryModel.id == id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(category)
    db.commit()
    return {"msg": "Category deleted successfully"}

@router.delete("/dispense/{id}", response_model=dict)
def cancel_dispense(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Cancel a dispense event, revert stock, and update bill.
    """
    prescription = db.query(PrescriptionModel).filter(PrescriptionModel.id == id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    if not prescription.is_dispensed:
        raise HTTPException(status_code=400, detail="Prescription was not dispensed")
    
    # 1. Revert Stock
    drug = db.query(DrugModel).filter(DrugModel.id == prescription.drug_id).first()
    if drug:
        drug.stock_quantity += prescription.quantity
        db.add(drug)
        
    # 2. Update Bill
    drug_cost = (drug.unit_price if drug else 0) * prescription.quantity
    
    bill = db.query(BillModel).filter(
        BillModel.patient_id == prescription.patient_id,
        BillModel.status != PaymentStatus.PAID
    ).order_by(BillModel.created_at.desc()).first()
    
    if bill:
        bill.drug_cost = max(0, bill.drug_cost - drug_cost)
        bill.total_amount = max(0, bill.total_amount - drug_cost)
        bill.balance = max(0, bill.balance - drug_cost)
        db.add(bill)
        
    # 3. Remove Prescription
    db.delete(prescription)
    db.commit()
    
    return {"msg": "Dispense cancelled successfully", "reverted_stock": drug.stock_quantity if drug else 0}
