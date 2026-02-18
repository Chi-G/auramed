# AuraMed Master Implementation Plan

This document serves as the single point of reference for all features, architecture, and security protocols within the AuraMed Clinical Management System.

---

## 1. Core Architecture
- **Backend**: FastAPI (Python 3.11+) with Pydantic v2 for data validation.
- **ORM**: SQLAlchemy 2.0 with PostgreSQL/SQLite.
- **Frontend**: React 18 with Vite, Tailwind CSS for styling, and TanStack Query for state management.
- **Security**: JWT-based authentication with granular Role-Based Access Control (RBAC).

---

## 2. Authentication & Permissions System
Implemented a dynamic, database-driven permissions matrix that allows for real-time access control.

- **Role-Based Access**: Specialized views for Super Admins, Admins, Doctors, Nurses, and Receptionists.
- **Permission Matrix**: 
  - `manage_patients`, `manage_appointments`, `manage_clinical_visits`, `manage_pharmacy`, `manage_billing`, `manage_settings`, `manage_roles`, `manage_users`.
- **Dynamic UI**: Sidebar and Dashboard sections automatically filter based on the logged-in user's fetched permissions (`GET /permissions/my`).

---

## 3. Staff Management & Creation Hierarchy
Enforces a strict security model for hospital personnel management.

- **Hierarchy Rules**:
  - **Super Admin**: Full control over all roles.
  - **Admin**: Can create clinical and front-desk staff (Doctor, Nurse, Receptionist). Restricted from creating higher management roles.
- **Staff Module**: A dedicated control center ([Staff.tsx](file:///home/chiji_linux/uv_python/pythonprojects/AuraMed/frontend/src/pages/Staff.tsx)) for tracking active personnel and managing their credentials.

---

## 4. Clinical Modules

### Patient Management
- **Directory**: Comprehensive list of all registered patients with search and filtering.
- **Records**: Personal info, medical history, and quick-access visit summaries.

### Appointments & Scheduling
- **Flow**: Direct scheduling of patient visits with status tracking (Pending, Confirmed, Cancelled).
- **Calendar Integration**: Quick view of today's schedule on the dashboard.

### Clinical Visits & Specialized Diagnostics
- **Vitals Tracking**: Recording height, weight, BP, temperature, etc., with historical trends.
- **Specialized Fields**: Support for integrative medicine diagnostics including Iridology, Sclerology, Reflexology, and Acupuncture.
- **Documentation**: Progress notes, clinical observations, and treatment plans.

---

## 5. Pharmacy & Inventory
- **Inventory Tracking**: Manage drug categories, stock levels, and expiration dates.
- **Low Stock Alerts**: Automated dashboard alerts when critical inventory falls below thresholds.
- **Dispensing**: Integration with the billing module for pharmaceutical charges.

---

## 6. Billing & Financial Management
- **Invoicing**: Generation of electronic invoices for consultations, treatments, and drugs.
- **Payment Tracking**: Record partial or full payments with status indicators.
- **Audit Trail**: Every financial transaction is linked to a specific staff member for accountability.

---

## 7. Reports & Analytics
- **Dashboard Overview**: High-level stats on patient volume, revenue, and inventory health.
- **Trend Analysis**: Visual charts (Recharts) showing 7-day revenue and visit volume fluctuations.

---

## 8. Development & Infrastructure
- **Environment**: Managed via `.env` files for secrets with `uvicorn` / `npm run dev` orchestration.
- **Theming**: Full Dark Mode / Light Mode support with CSS variables for branding consistency.
- **API Versioning**: Follows `/api/v1/` prefixing for future-proof integration.