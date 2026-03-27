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
    # 1. Normalize role for consistent checking
    role_raw = current_user.role or ""
    role_norm = str(role_raw).lower().replace("_", "").replace(" ", "")
    
    # 2. Check if user has explicit 'view_reports' permission
    has_view_reports = True if current_user.is_superuser or role_norm == 'admin' else False
    
    if not has_view_reports:
        user_perms = db.query(RolePermission).filter(
            func.lower(RolePermission.role) == str(role_raw).lower()
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
    
    # Apply per-user filtering ONLY for clinical activity lists (appointments/patients)
    # But for "Clinic Overview" summaries, we want to see broader stats if permitted
    if role_norm == "doctor":
        # Doctors see their own patients and appointments
        total_patients_q = total_patients_q.filter(PatientModel.assigned_doctor_id == current_user.id)
        total_appointments_q = total_appointments_q.join(PatientModel).filter(PatientModel.assigned_doctor_id == current_user.id)
        recent_appointments_q = recent_appointments_q.filter(PatientModel.assigned_doctor_id == current_user.id)
        
        # Optionally filter revenue/visits too if required by privacy
        # But for this "Clinic Overview" we will stick to personal doctor stats initially
        revenue_q = revenue_q.join(VisitModel).filter(VisitModel.doctor_id == current_user.id)
        pending_revenue_q = pending_revenue_q.join(VisitModel).filter(VisitModel.doctor_id == current_user.id)
        visit_count_q = visit_count_q.filter(VisitModel.doctor_id == current_user.id)
    
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
    # Normalize role for consistent checking
    role_raw = current_user.role or ""
    role_norm = str(role_raw).lower().replace("_", "").replace(" ", "")
    
    # Check permission
    has_view_reports = True if current_user.is_superuser or role_norm == 'admin' else False
    if not has_view_reports:
        user_perms = db.query(RolePermission).filter(
            func.lower(RolePermission.role) == str(role_raw).lower()
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
    
    # For trends (Line charts), we broaden the access for doctors if they have view_reports
    # This ensures "Clinic Overview" remains meaningful
    if role_norm == "doctor":
        # Broaden view to clinic global traffic for these graphs so they are not empty
        # If user insisted on only doctor data, we would add filtering back here.
        pass
    elif role_norm == "nurse" or role_norm == "receptionist" or role_norm == "cashier":
        # Staff see global clinic data (no clinic_id exists in models currently)
        pass
        
    revenue_trend = revenue_q.group_by(func.date(BillModel.created_at))\
     .order_by(func.date(BillModel.created_at)).all()

    visit_trend = visit_q.group_by(func.date(VisitModel.visit_date))\
     .order_by(func.date(VisitModel.visit_date)).all()

    print(f"DEBUG: Found {len(revenue_trend)} revenue points and {len(visit_trend)} visit points")

    # ZERO-FILLING Logic for the last 7 days
    res_revenue = []
    res_visits = []
    
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        target_str = str(target_date)
        
        # Find matching DB results
        rev_match = next((r for r in revenue_trend if str(r.date) == target_str), None)
        vis_match = next((v for v in visit_trend if str(v.date) == target_str), None)
        
        res_revenue.append({
            "date": target_str, 
            "amount": float(rev_match.revenue) if rev_match else 0.0,
            "revenue": float(rev_match.revenue) if rev_match else 0.0
        })
        
        res_visits.append({
            "date": target_str, 
            "count": int(vis_match.visits) if vis_match else 0,
            "visits": int(vis_match.visits) if vis_match else 0
        })

    return {
        "revenue": res_revenue,
        "visits": res_visits
    }


