from app.db.base import Base
from app.db.session import SessionLocal
from app.models.visit import ClinicalVisit
from app.models.treatment import TreatmentRecord, TreatmentType
from app.models.diagnostic import SpecializedDiagnostic, DiagnosticType

def test_update(visit_id):
    db = SessionLocal()
    try:
        visit = db.query(ClinicalVisit).filter(ClinicalVisit.id == visit_id).first()
        if not visit:
            print(f"Visit {visit_id} not found")
            return
        
        print(f"Original Complaints: {visit.complaints}")
        
        # Simulate update_visit logic
        visit.complaints = "UPDATED COMPLAINTS"
        
        # Simulate treatment update (delete and add)
        db.query(TreatmentRecord).filter(TreatmentRecord.visit_id == visit_id).delete()
        new_treatment = TreatmentRecord(
            visit_id=visit_id,
            treatment_type=TreatmentType.ACUPUNCTURE,
            notes="Updated notes"
        )
        db.add(new_treatment)
        
        db.commit()
        db.refresh(visit)
        
        print(f"Updated Complaints: {visit.complaints}")
        print(f"Updated Treatments: {[t.treatment_type for t in visit.treatment_records]}")
        
    finally:
        db.close()

if __name__ == "__main__":
    test_update(26)
