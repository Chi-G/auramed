from app.db.session import SessionLocal
from app.models.visit import ClinicalVisit as VisitModel
from app.models.patient import Patient  # Import to register with SQLAlchemy
from app.models.user import User      # Import to register with SQLAlchemy
from app.schemas.visit import ClinicalVisit, VisitCreate
from pydantic import ValidationError
import json

# Test 1: Verify SQLAlchemy Mapping (Fixes 500 Error)
print("--- TEST 1: SQLAlchemy Mapping ---")
try:
    db = SessionLocal()
    visit = db.query(VisitModel).first()
    if visit:
        print(f"Found visit ID: {visit.id}")
        schema = ClinicalVisit.model_validate(visit)
        print("Serialization successful!")
    else:
        print("No visits found in DB")
    db.close()
except Exception as e:
    print(f"Mapping/Query failed: {e}")

# Test 2: Verify Pydantic Validation (Fixes 422 Error)
print("\n--- TEST 2: Pydantic Validation ---")
payload = {
  "patient_id": "8a9e86a8-4e93-450b-8f81-c456f5a30786",
  "height_cm": 85,
  "weight_kg": 18,
  "glucose_level": 88,
  "bp_systolic": 47,
  "bp_diastolic": 3,
  "bmi": 24.91,
  "complaints": "Tempora dicta qui ex",
  "diagnosis": "Mollitia similique e",
  "follow_up_date": "1987-06-04",
  "notes": "Mollitia deserunt am"
}

try:
    print(f"Validating payload: {json.dumps(payload, indent=2)}")
    validated = VisitCreate(**payload)
    print("Validation SUCCESS!")
    print(validated.model_dump())
except ValidationError as e:
    print("Validation FAILED:")
    print(e.json(indent=2))
except Exception as e:
    print(f"Unexpected error: {e}")

