AuraMed Clinical Management System - Implementation Plan

Goal Description
Build a professional-grade Clinical Management System (CMS) for small-to-medium clinics, specifically supporting integrative medicine practitioners.

Proposed Changes
[Backend] (FastAPI)
Directory: backend/
Framework: FastAPI with Pydantic v2.
ORM: SQLAlchemy 2.0 with Alembic.
Auth: JWT-based RBAC (Admin, Doctor, Nurse, Receptionist).
Core Modules: Patients, Visits, Vitals, Pharmacy, Billing, Treatment & Therapy (Specialized).
Advanced Features: Audit Logging, PDF Prescription/Receipt Generation.

[Frontend] (React)
Directory: frontend/
Stack: React 18, Vite, Tailwind CSS, TanStack Query.
State: React Hook Form + Zod.
Charts: Recharts for clinic analytics.

[Infrastructure]
Docker: docker-compose.yml for local development (PostgreSQL, Backend, Frontend).
Environment: 
.env
 management for secrets and config.
User Review Required
IMPORTANT

Specialized Diagnostics: Iridology, Sclerology, Reflexology, Qrmba, Acupuncture. These will be implemented as structured fields with progress tracking.
Treatment Methods: Nutritional Medicine, Cupping, Chiropractic, etc., will be available for selection and documentation.
Audit Logging: I will implement a global audit trail for all sensitive data access (Patient records, Billing).
Printing: I will add "Print-to-PDF" functionality for Prescriptions and Receipts.
Database: Proposal suggested MySQL, but we are currently on SQLite. I recommend moving to a production-grade database (PostgreSQL/MySQL) before go-live.

Authentication: Do you have a preference for the initial admin credentials, or should I generate a setup script?

Data Migration: Since there's an Excel file with some patient data, should I build an import tool as part of the initial setup?

Verification Plan
Automated Tests
Pytest for backend endpoints.
Integration tests for core flows (Registration -> Visit -> Billing).
Manual Verification
Testing the tablet responsiveness via browser developer tools.
Role isolation (verifying a Nurse cannot access Admin settings).