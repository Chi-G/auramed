from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.diagnostic import SpecializedDiagnostic as DiagnosticModel
from app.schemas.diagnostic import SpecializedDiagnostic, SpecializedDiagnosticCreate

router = APIRouter()

@router.get("/", response_model=List[SpecializedDiagnostic])
def read_diagnostics(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve specialized diagnostic records.
    """
    diagnostics = db.query(DiagnosticModel).offset(skip).limit(limit).all()
    return diagnostics

@router.post("/", response_model=SpecializedDiagnostic)
def create_diagnostic(
    *,
    db: Session = Depends(deps.get_db),
    diagnostic_in: SpecializedDiagnosticCreate,
) -> Any:
    """
    Create new specialized diagnostic record.
    """
    diagnostic = DiagnosticModel(**diagnostic_in.model_dump())
    db.add(diagnostic)
    db.commit()
    db.refresh(diagnostic)
    return diagnostic

@router.get("/visit/{visit_id}", response_model=List[SpecializedDiagnostic])
def read_diagnostics_by_visit(
    visit_id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Get diagnostics for a specific visit.
    """
    return db.query(DiagnosticModel).filter(DiagnosticModel.visit_id == visit_id).all()
