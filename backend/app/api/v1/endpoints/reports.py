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
from app.models.user import UserRole
from app.models.role_permission import RolePermission

router = APIRouter()

@router.get("/summary")
def get_clinic_summary(
    current_user: Any = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Get a high-level summary for the dashboard.
    """
    # Permission check - only allow users with view_reports to see summary/trends
    role = current_user.role.lower()
    if not current_user.is_superuser and role != 'admin':
        user_perms = db.query(RolePermission).filter(
            func.lower(RolePermission.role) == role
        ).all()
        has_view_reports = any(p.permission_key == 'view_reports' and p.is_enabled for p in user_perms)
        
        if not has_view_reports:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Not enough privileges to view reports summary")


    today = date.today()
    
    # Queries with role-based filtering
    revenue_q = db.query(func.sum(BillModel.total_amount))
    pending_revenue_q = db.query(func.sum(BillModel.balance))
    visit_count_q = db.query(func.count(VisitModel.id)).filter(func.date(VisitModel.visit_date) == today)
    total_patients_q = db.query(func.count(PatientModel.id))
    total_appointments_q = db.query(func.count(AppointmentModel.id))
    recent_appointments_q = db.query(AppointmentModel).join(PatientModel)
    
    if current_user.role == UserRole.DOCTOR:
        revenue_q = revenue_q.join(VisitModel).filter(VisitModel.doctor_id == current_user.id)
        pending_revenue_q = pending_revenue_q.join(VisitModel).filter(VisitModel.doctor_id == current_user.id)
        visit_count_q = visit_count_q.filter(VisitModel.doctor_id == current_user.id)
        total_patients_q = total_patients_q.filter(PatientModel.assigned_doctor_id == current_user.id)
        total_appointments_q = total_appointments_q.join(PatientModel).filter(PatientModel.assigned_doctor_id == current_user.id)
        recent_appointments_q = recent_appointments_q.filter(PatientModel.assigned_doctor_id == current_user.id)
    
    total_revenue = revenue_q.scalar() or 0
    pending_revenue = pending_revenue_q.scalar() or 0
    visit_count = visit_count_q.scalar()
    total_patients = total_patients_q.scalar()
    total_appointments = total_appointments_q.scalar()
    
    # Recent appointments
    recent_appointments_db = recent_appointments_q.order_by(
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
    current_user: Any = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Get visit and revenue trends for the last 7 days.
    """
    role = current_user.role.lower()
    if not current_user.is_superuser and role != 'admin':
        user_perms = db.query(RolePermission).filter(
            func.lower(RolePermission.role) == role
        ).all()
        has_view_reports = any(p.permission_key == 'view_reports' and p.is_enabled for p in user_perms)
        
        if not has_view_reports:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Not enough privileges to view reports trends")

    print(f"DEBUG: Fetching trends for user {current_user.id} with role {current_user.role}")
    
    # Start of today minus 7 days to be consistent
    today = date.today()
    seven_days_ago = today - timedelta(days=7)
    
    # Revenue trend - using total_amount to match summary "total revenue"
    revenue_q = db.query(
        func.date(BillModel.created_at).label('date'),
        func.sum(BillModel.total_amount).label('revenue')
    ).filter(func.date(BillModel.created_at) >= seven_days_ago)

    # Visit trend
    visit_q = db.query(
        func.date(VisitModel.visit_date).label('date'),
        func.count(VisitModel.id).label('visits')
    ).filter(func.date(VisitModel.visit_date) >= seven_days_ago)
    
    if current_user.role == UserRole.DOCTOR:
        revenue_q = revenue_q.join(VisitModel).filter(VisitModel.doctor_id == current_user.id)
        visit_q = visit_q.filter(VisitModel.doctor_id == current_user.id)
    elif current_user.role != UserRole.ADMIN and not current_user.is_superuser:
        # Filter by clinic_id for staff
        revenue_q = revenue_q.join(VisitModel).filter(VisitModel.clinic_id == current_user.clinic_id)
        visit_q = visit_q.filter(VisitModel.clinic_id == current_user.clinic_id)
        
    revenue_trend = revenue_q.group_by(func.date(BillModel.created_at))\
     .order_by(func.date(BillModel.created_at)).all()

    visit_trend = visit_q.group_by(func.date(VisitModel.visit_date))\
     .order_by(func.date(VisitModel.visit_date)).all()

    print(f"DEBUG: Found {len(revenue_trend)} revenue points and {len(visit_trend)} visit points")

    # Send both 'amount' and 'revenue' keys to satisfy different frontend pages
    return {
        "revenue": [
            {
                "date": str(r.date), 
                "amount": float(r.revenue or 0), 
                "revenue": float(r.revenue or 0)
            } for r in revenue_trend
        ],
        "visits": [
            {
                "date": str(v.date), 
                "count": int(v.visits or 0),
                "visits": int(v.visits or 0)
            } for v in visit_trend
        ]
    }


