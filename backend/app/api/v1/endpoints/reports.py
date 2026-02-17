from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, date

from app.api import deps
from app.models.bill import Bill as BillModel
from app.models.visit import ClinicalVisit as VisitModel
from app.models.drug import Drug as DrugModel
from app.models.patient import Patient as PatientModel
from app.models.appointment import Appointment as AppointmentModel

router = APIRouter()

@router.get("/summary")
def get_clinic_summary(
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a high-level summary for the dashboard.
    """
    total_revenue = db.query(func.sum(BillModel.total_amount)).scalar() or 0
    pending_revenue = db.query(func.sum(BillModel.balance)).scalar() or 0
    
    # Today's visits only
    today = date.today()
    visit_count = db.query(func.count(VisitModel.id)).filter(
        func.date(VisitModel.visit_date) == today
    ).scalar()
    
    total_patients = db.query(func.count(PatientModel.id)).scalar()
    total_appointments = db.query(func.count(AppointmentModel.id)).scalar()
    
    # Recent appointments
    recent_appointments_db = db.query(AppointmentModel).join(PatientModel).order_by(
        AppointmentModel.appointment_date.desc()
    ).limit(5).all()
    
    recent_appointments = []
    for appt in recent_appointments_db:
        recent_appointments.append({
            "id": appt.id,
            "patient_name": f"{appt.patient.first_name} {appt.patient.last_name}",
            "reason": appt.reason_for_visit,
            "status": appt.status.value if hasattr(appt.status, 'value') else appt.status,
            "appointment_date": appt.appointment_date.isoformat() if appt.appointment_date else None
        })
    
    # Low stock items
    low_stock = db.query(func.count(DrugModel.id)).filter(
        DrugModel.stock_quantity <= DrugModel.low_stock_threshold
    ).scalar()

    return {
        "total_revenue": total_revenue,
        "pending_revenue": pending_revenue,
        "visit_count": visit_count,
        "total_patients": total_patients,
        "total_appointments": total_appointments,
        "recent_appointments": recent_appointments,
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
