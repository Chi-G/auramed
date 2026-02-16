export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'super_admin';

export interface User {
    id: number;
    email: string;
    full_name: string;
    role: UserRole;
    is_active: boolean;
    avatar_url?: string;
}

export interface Patient {
    id: string;
    patient_id: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    date_of_birth: string;
    gender: string;
    phone_number?: string;
    email?: string;
    address?: string;
    medical_history?: string;
    next_of_kin_name?: string;
    next_of_kin_relation?: string;
    next_of_kin_phone?: string;
    created_at: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Appointment {
    id: number;
    patient_id: string;
    appointment_date: string;
    reason_for_visit?: string;
    status: AppointmentStatus;
    notes?: string;
    patient?: Patient;
}

export interface ClinicalVisit {
    id: number;
    patient_id: string;
    doctor_id: number;
    visit_date: string;
    height_cm?: number;
    weight_kg?: number;
    glucose_level?: number;
    bp_systolic?: number;
    bp_diastolic?: number;
    bmi?: number;
    complaints: string;
    diagnosis?: string;
    notes?: string;
    patient?: Patient;
}

export interface Drug {
    id: number;
    name: string;
    description?: string;
    category?: string;
    unit_price: number;
    stock_quantity: number;
    low_stock_threshold: number;
    expiry_date?: string;
}

export interface Prescription {
    id: number;
    visit_id: number;
    drug_id: number;
    dosage: string;
    quantity: number;
    instructions?: string;
    drug?: Drug;
}

export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'cancelled';

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    size: number;
}

export interface Bill {
    id: number;
    visit_id: number;
    consultation_fee: number;
    drug_cost: number;
    total_amount: number;
    amount_paid: number;
    balance: number;
    status: PaymentStatus;
    created_at: string;
    visit?: ClinicalVisit;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
