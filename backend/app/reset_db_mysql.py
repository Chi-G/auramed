from sqlalchemy import MetaData
from app.db.session import engine
from app.db.base_class import Base
# Import all models
from app.models.user import User
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.visit import ClinicalVisit
from app.models.drug import Drug
from app.models.prescription import Prescription
from app.models.bill import Bill
from app.models.treatment import TreatmentRecord
from app.models.diagnostic import SpecializedDiagnostic

def reset_database():
    print("Dropping all tables...")
    # Using metadata to drop all tables known to the Base
    Base.metadata.drop_all(bind=engine)
    print("Creating database tables with new schema...")
    Base.metadata.create_all(bind=engine)
    print("Database reset successfully.")

if __name__ == "__main__":
    reset_database()
