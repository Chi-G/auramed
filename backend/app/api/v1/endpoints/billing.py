from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

import httpx
from app.api import deps
from app.core.config import settings
from fastapi.responses import RedirectResponse
from app.models.bill import Bill as BillModel, PaymentStatus
from app.models.visit import ClinicalVisit
from app.models.patient import Patient
from app.models.prescription import Prescription as PrescriptionModel
from app.models.clinic_settings import ClinicSettings as ClinicSettingsModel
from app.schemas.bill import Bill, BillCreate, BillUpdate, BillPage, ConsultationRequest

router = APIRouter()

@router.get("/", response_model=BillPage)
def read_bills(
    db: Session = Depends(deps.get_db),
    page: int = 1,
    size: int = Query(default=10),
    q: Optional[str] = None,
    status: Optional[PaymentStatus] = None,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve bills with filters.
    """
    from sqlalchemy.orm import joinedload
    skip = (page - 1) * size
    query = db.query(BillModel).outerjoin(ClinicalVisit).outerjoin(Patient).options(
        joinedload(BillModel.visit).joinedload(ClinicalVisit.prescriptions).joinedload(PrescriptionModel.drug),
        joinedload(BillModel.patient)
    )
    
    if q:
        search = f"%{q}%"
        # Search by Invoice ID (Bill.id) or Patient Name
        try:
            bill_id = int(q)
            id_filter = BillModel.id == bill_id
        except ValueError:
            id_filter = False

        query = query.filter(
            or_(
                id_filter,
                func.concat(Patient.first_name, " ", Patient.last_name).ilike(search),
                Patient.patient_id.ilike(search)
            )
        )
    
    if status:
        query = query.filter(BillModel.status == status)

    total = query.count()
    bills = query.order_by(BillModel.created_at.desc()).offset(skip).limit(size).all()
    
    return {
        "items": bills,
        "total": total,
        "page": page,
        "size": size
    }

@router.post("/", response_model=Bill)
def create_bill(
    *,
    db: Session = Depends(deps.get_db),
    bill_in: BillCreate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new bill for a clinical visit.
    """
    bill = BillModel(**bill_in.model_dump())
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return bill

@router.get("/{id}", response_model=Bill)
def read_bill(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get bill by ID.
    """
    bill = db.query(BillModel).filter(BillModel.id == id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill

@router.put("/{id}", response_model=Bill)
def update_bill(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    bill_in: BillUpdate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a bill (e.g., record payment).
    """
    bill = db.query(BillModel).filter(BillModel.id == id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    update_data = bill_in.model_dump(exclude_unset=True)
    
    # Recalculate balance if amount_paid is updated
    if "amount_paid" in update_data:
        new_amount_paid = update_data["amount_paid"]
        update_data["balance"] = bill.total_amount - new_amount_paid
        if update_data["balance"] <= 0:
            update_data["status"] = "paid"
        elif update_data["balance"] < bill.total_amount:
            update_data["status"] = "partial"

    for field in update_data:
        setattr(bill, field, update_data[field])
    
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return bill

@router.delete("/{id}", response_model=dict)
def delete_bill(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a bill.
    """
    bill = db.query(BillModel).filter(BillModel.id == id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    db.delete(bill)
    db.commit()
    return {"id": id, "msg": "Bill deleted successfully"}
@router.post("/{id}/send-email", response_model=dict)
def send_bill_email(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    from sqlalchemy.orm import joinedload
    bill = db.query(BillModel).options(
        joinedload(BillModel.patient),
        joinedload(BillModel.visit).joinedload(ClinicalVisit.prescriptions).joinedload(PrescriptionModel.drug)
    ).filter(BillModel.id == id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    patient = bill.patient
    if not patient or not patient.email:
        raise HTTPException(status_code=400, detail="Patient email not found")

    from app.utils.email import send_email
    from app.core.config import settings

    subject = f"{settings.PROJECT_NAME} - Invoice #{bill.id:06d}"
    
    # Build drug rows
    drug_rows = ""
    if bill.visit and bill.visit.prescriptions:
        for p in bill.visit.prescriptions:
            if p.is_dispensed:
                drug_name = p.drug.name if p.drug else "Medication"
                unit_price = p.drug.unit_price if p.drug else 0.0
                total = unit_price * p.quantity
                drug_rows += f"""
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                        <div style="font-weight: bold; color: #1e293b;">{drug_name}</div>
                        <div style="font-size: 0.85em; color: #64748b;">Qty: {p.quantity} × ₦{unit_price:,.2f}</div>
                    </td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; vertical-align: bottom; color: #1e293b; font-weight: bold;">
                        ₦{total:,.2f}
                    </td>
                </tr>
                """

    # Add consultation fee if present
    consultation_row = ""
    if bill.consultation_fee > 0:
        consultation_row = f"""
        <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                <div style="font-weight: bold; color: #1e293b;">Consultation Fee</div>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; vertical-align: bottom; color: #1e293b; font-weight: bold;">
                ₦{bill.consultation_fee:,.2f}
            </td>
        </tr>
        """

    # Simple HTML content for invoice
    html_content = f"""
    <html>
        <body style="background-color: #f1f5f9; padding: 40px 0;">
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #ffffff; border-radius: 20px; shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #0284c7; margin: 0; font-size: 24px;">{settings.PROJECT_NAME}</h2>
                    <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Official Medical Invoice</p>
                </div>

                <div style="border-top: 2px solid #f1f5f9; border-bottom: 2px solid #f1f5f9; padding: 20px 0; margin-bottom: 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td>
                                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Invoice To</p>
                                <p style="margin: 5px 0 0 0; color: #1e293b; font-weight: bold; font-size: 16px;">{patient.first_name} {patient.last_name}</p>
                                <p style="margin: 2px 0 0 0; color: #64748b; font-size: 14px;">#{patient.patient_id}</p>
                            </td>
                            <td style="text-align: right;">
                                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Invoice Details</p>
                                <p style="margin: 5px 0 0 0; color: #1e293b; font-weight: bold; font-size: 16px;">#{bill.id:06d}</p>
                                <p style="margin: 2px 0 0 0; color: #64748b; font-size: 14px;">{bill.created_at.strftime('%b %d, %Y')}</p>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <h3 style="color: #1e293b; font-size: 16px; margin-bottom: 15px;">Itemized Breakdown</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                    {consultation_row}
                    {drug_rows}
                </table>

                <div style="background-color: #f8fafc; padding: 25px; border-radius: 16px; margin: 20px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="color: #64748b; padding-bottom: 8px;">Subtotal Amount</td>
                            <td style="text-align: right; color: #1e293b; font-weight: bold; padding-bottom: 8px;">₦{bill.total_amount:,.2f}</td>
                        </tr>
                        <tr>
                            <td style="color: #10b981; padding-bottom: 8px;">Amount Paid</td>
                            <td style="text-align: right; color: #10b981; font-weight: bold; padding-bottom: 8px;">₦{bill.amount_paid:,.2f}</td>
                        </tr>
                        <tr style="font-size: 1.2em;">
                            <td style="color: #0f172a; font-weight: bold; padding-top: 15px; border-top: 1px solid #e2e8f0;">Balance Due</td>
                            <td style="text-align: right; color: #e11d48; font-weight: bold; padding-top: 15px; border-top: 1px solid #e2e8f0;">₦{bill.balance:,.2f}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p style="margin: 0;">Status: <span style="display: inline-block; padding: 6px 16px; border-radius: 99px; font-weight: bold; font-size: 12px; text-transform: uppercase; background-color: {'#dcfce7' if bill.status == 'paid' else '#fef3c7'}; color: {'#166534' if bill.status == 'paid' else '#92400e'};">{bill.status.upper()}</span></p>
                </div>
                
                <p style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6;">
                    <strong>Thank you for choosing {settings.PROJECT_NAME}.</strong><br>
                    This is a computer-generated invoice and does not require a physical signature.<br>
                    For inquiries, please contact our clinical administrative support.
                </p>
            </div>
        </body>
    </html>
    """

    send_email(
        email_to=patient.email,
        subject_template=subject,
        html_template=html_content,
        environment={}
    )

    return {"msg": "Email sent successfully"}

@router.post("/{id}/initialize-payment")
async def initialize_payment(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Initialize Paystack payment and return authorization URL.
    """
    bill = db.query(BillModel).filter(BillModel.id == id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    if bill.status == "paid":
        raise HTTPException(status_code=400, detail="Bill is already paid")

    patient = bill.visit.patient if bill.visit else None
    email = patient.email if patient and patient.email else "patient@example.com"

    url = "https://api.paystack.co/transaction/initialize"
    headers = {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "email": email,
        "amount": int(bill.balance * 100),  # Amount in kobo
        "callback_url": settings.PAYSTACK_CALLBACK_URL,
        "metadata": {
            "bill_id": bill.id,
            "patient_id": patient.id if patient else None,
            "custom_fields": [
                {
                    "display_name": "Invoice ID",
                    "variable_name": "invoice_id",
                    "value": f"#{bill.id:06d}"
                }
            ]
        }
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload)
        
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to initialize payment with Paystack")
    
    data = response.json()
    return data["data"]

@router.get("/payment/callback")
async def payment_callback(
    *,
    db: Session = Depends(deps.get_db),
    reference: str = Query(...),
) -> Any:
    """
    Handle Paystack payment callback.
    """
    # Verify transaction with Paystack
    url = f"https://api.paystack.co/transaction/verify/{reference}"
    headers = {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
    
    if response.status_code != 200:
        # Redirect to frontend with error
        return RedirectResponse(url="http://localhost:5173/billing?status=error&msg=VerificationFailed")

    data = response.json()
    if data["status"] and data["data"]["status"] == "success":
        bill_id = data["data"]["metadata"]["bill_id"]
        amount_paid_kobo = data["data"]["amount"]
        amount_paid = amount_paid_kobo / 100

        bill = db.query(BillModel).filter(BillModel.id == bill_id).first()
        if bill:
            bill.amount_paid += amount_paid
            bill.balance = bill.total_amount - bill.amount_paid
            if bill.balance <= 0:
                bill.status = "paid"
                bill.balance = 0
            elif bill.amount_paid > 0:
                bill.status = "partial"
            
            db.add(bill)
            db.commit()
            return RedirectResponse(url="http://localhost:5173/billing?status=success&invoice=" + str(bill_id))

    return RedirectResponse(url="http://localhost:5173/billing?status=failed")

@router.post("/add-consultation", response_model=Bill)
def add_consultation_fee(
    *,
    db: Session = Depends(deps.get_db),
    request: ConsultationRequest,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """
    Manually add a consultation fee to a patient's bill.
    """
    # 1. Fetch fee from settings
    settings = db.query(ClinicSettingsModel).first()
    fee = settings.consultation_fee if settings else 50.0
    
    # 2. Find most recent unpaid/partial bill
    bill = db.query(BillModel).filter(
        BillModel.patient_id == request.patient_id,
        BillModel.status != PaymentStatus.PAID
    ).order_by(BillModel.created_at.desc()).first()
    
    if not bill:
        # Create new bill
        bill = BillModel(
            patient_id=request.patient_id,
            consultation_fee=fee,
            total_amount=fee,
            balance=fee,
            status=PaymentStatus.UNPAID
        )
    else:
        # Update existing bill
        bill.consultation_fee += fee
        bill.total_amount += fee
        bill.balance += fee
        
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return bill

@router.post("/webhook")
async def paystack_webhook(
    *,
    db: Session = Depends(deps.get_db),
    # Paystack sends signature in headers, but for simple MVP let's focus on logic
) -> Any:
    """
    Handle Paystack webhooks for real-time updates.
    """
    # Webhook implementation (omitted for brevity but can be added for robustness)
    return {"status": "received"}
