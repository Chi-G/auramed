from fastapi import APIRouter
from app.api.v1.endpoints import login, users, patients, appointments, visits, pharmacy, billing, reports, treatments, diagnostics, clinic_settings

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
api_router.include_router(visits.router, prefix="/visits", tags=["visits"])
api_router.include_router(pharmacy.router, prefix="/pharmacy", tags=["pharmacy"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(treatments.router, prefix="/treatments", tags=["treatments"])
api_router.include_router(diagnostics.router, prefix="/diagnostics", tags=["diagnostics"])
api_router.include_router(clinic_settings.router, prefix="/settings", tags=["settings"])

from app.api.v1.endpoints import upload
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
