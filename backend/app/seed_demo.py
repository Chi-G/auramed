from app.db.session import SessionLocal
from app.models.user import User  # Import User to fix relationship resolution
from app.models.patient import Patient
from app.models.visit import ClinicalVisit
from app.models.bill import Bill, PaymentStatus
from app.models.drug import Drug
from app.models.prescription import Prescription
from datetime import datetime, timedelta
import random

def seed_demo_data():
    db = SessionLocal()
    
    # Create a couple of patients if they don't exist
    has_patients = db.query(Patient).first()
    if not has_patients:
        p1 = Patient(
            patient_id="AURAMED001",
            first_name="John",
            last_name="Doe",
            date_of_birth=datetime(1985, 5, 20),
            gender="Male",
            phone_number="1234567890",
            email="john@example.com"
        )
        p2 = Patient(
            patient_id="AURAMED002",
            first_name="Jane",
            last_name="Smith",
            date_of_birth=datetime(1990, 8, 15),
            gender="Female",
            phone_number="0987654321",
            email="jane@example.com"
        )
        db.add_all([p1, p2])
        db.commit()
        db.refresh(p1)
        db.refresh(p2)
        
        patients = [p1, p2]
    else:
        patients = db.query(Patient).all()

    # Get an existing user for doctor_id
    doctor = db.query(User).first()
    if not doctor:
        print("No users found. Please run initial_data.py first.")
        return

    # Seed some visits and bills for the last 7 days
    today = datetime.now()
    for i in range(7):
        date = today - timedelta(days=i)
        # Random number of visits per day
        num_visits = random.randint(1, 4)
        for _ in range(num_visits):
            patient = random.choice(patients)
            visit = ClinicalVisit(
                patient_id=patient.id,
                doctor_id=doctor.id,
                visit_date=date,
                complaints="Follow-up consultation",
                bp_systolic=120,
                bp_diastolic=80,
                weight_kg=70.5,
                notes="Patient reporting good progress.",
                diagnosis="Routine Checkup"
            )
            db.add(visit)
            db.commit()
            db.refresh(visit)
            
            # Create a bill for each visit
            total = 50.0
            paid = total if random.random() > 0.3 else 10.0
            bill = Bill(
                visit_id=visit.id,
                consultation_fee=total,
                total_amount=total,
                amount_paid=paid,
                balance=total - paid,
                status=PaymentStatus.PAID if paid == total else PaymentStatus.PARTIAL,
                created_at=date
            )
            db.add(bill)
            db.commit()
           
    print("Demo data seeded successfully.")

if __name__ == "__main__":
    seed_demo_data()
