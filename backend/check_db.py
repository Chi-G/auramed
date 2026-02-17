from app.db.base import Base # This imports all models
from app.db.session import SessionLocal
from app.models.visit import ClinicalVisit

def check_visits():
    db = SessionLocal()
    try:
        visits = db.query(ClinicalVisit).order_by(ClinicalVisit.id.desc()).limit(5).all()
        for v in visits:
            print(f"Visit ID: {v.id}")
            print(f"  Complaints: {v.complaints}")
            print(f"  Diagnosis: {v.diagnosis}")
            print(f"  Treatments: {[t.treatment_type for t in v.treatment_records]}")
            print(f"  Diagnostics: {[d.diagnostic_type for d in v.specialized_diagnostics]}")
            print("-" * 20)
    finally:
        db.close()

if __name__ == "__main__":
    check_visits()
