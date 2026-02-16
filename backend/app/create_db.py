from app.db.session import engine
from app.db.base_class import Base
# Import all models to ensure they are registered with the Base
from app.models.user import User
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.visit import ClinicalVisit
from app.models.drug import Drug
from app.models.prescription import Prescription
from app.models.bill import Bill
from app.models.treatment import TreatmentRecord
from app.models.diagnostic import SpecializedDiagnostic

def create_tables():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

if __name__ == "__main__":
    create_tables()
