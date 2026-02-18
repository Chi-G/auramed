# Import all the models, so that Base has them before being
# imported by Alembic or used by the application
from app.db.base_class import Base  # noqa
from app.models.user import User  # noqa
from app.models.patient import Patient  # noqa
from app.models.visit import ClinicalVisit  # noqa
from app.models.bill import Bill  # noqa
from app.models.appointment import Appointment  # noqa
from app.models.drug import Drug  # noqa
from app.models.prescription import Prescription  # noqa
from app.models.treatment import TreatmentRecord  # noqa
from app.models.diagnostic import SpecializedDiagnostic  # noqa
from app.models.clinic_settings import ClinicSettings  # noqa
from app.models.role_permission import RolePermission  # noqa
from app.models.drug_category import DrugCategory  # noqa
