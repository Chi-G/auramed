from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api import deps
from app.models.drug import Drug as DrugModel
from app.schemas.drug import Drug, DrugCreate, DrugUpdate, DrugPage

router = APIRouter()

@router.get("/", response_model=DrugPage)
def read_drugs(
    db: Session = Depends(deps.get_db),
    page: int = 1,
    size: int = 10,
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
