from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.api import deps
from app.models.bill import Bill as BillModel
from app.models.visit import ClinicalVisit as VisitModel
from app.models.drug import Drug as DrugModel

router = APIRouter()

@router.get("/summary")
def get_clinic_summary(
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a high-level summary for the dashboard.
    """
    total_revenue = db.query(func.sum(BillModel.amount_paid)).scalar() or 0
    pending_revenue = db.query(func.sum(BillModel.balance)).scalar() or 0
    visit_count = db.query(func.count(VisitModel.id)).scalar()
    
    # Low stock items
    low_stock = db.query(func.count(DrugModel.id)).filter(
        DrugModel.stock_quantity <= DrugModel.low_stock_threshold
    ).scalar()

    return {
        "total_revenue": total_revenue,
        "pending_revenue": pending_revenue,
        "visit_count": visit_count,
        "low_stock_count": low_stock
    }

@router.get("/trends")
def get_activity_trends(
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get visit and revenue trends for the last 7 days.
    """
    seven_days_ago = datetime.now() - timedelta(days=7)
    
    # Revenue trend
    revenue_trend = db.query(
        func.date(BillModel.created_at).label('date'),
        func.sum(BillModel.amount_paid).label('revenue')
    ).filter(BillModel.created_at >= seven_days_ago)\
     .group_by(func.date(BillModel.created_at))\
     .order_by(func.date(BillModel.created_at)).all()

    # Visit trend
    visit_trend = db.query(
        func.date(VisitModel.visit_date).label('date'),
        func.count(VisitModel.id).label('visits')
    ).filter(VisitModel.visit_date >= seven_days_ago)\
     .group_by(func.date(VisitModel.visit_date))\
     .order_by(func.date(VisitModel.visit_date)).all()

    return {
        "revenue": [{"date": r.date, "amount": float(r.revenue)} for r in revenue_trend],
        "visits": [{"date": v.date, "count": int(v.visits)} for v in visit_trend]
    }
