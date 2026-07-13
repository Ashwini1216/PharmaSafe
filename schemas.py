from pydantic import BaseModel
from typing import Optional

class MedicineCreate(BaseModel):
    name: str
    category: str
    manufacturer: str
    requires_prescription: bool = False
    description: Optional[str] = None

class SupplierCreate(BaseModel):
    supplier_name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class CustomerCreate(BaseModel):
    customer_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class DoctorCreate(BaseModel):
    doctor_name: str
    specialization: Optional[str] = None
    phone: Optional[str] = None
    hospital_name: Optional[str] = None

class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    purchase_date: str
    total_amount: float

class BatchCreate(BaseModel):
    medicine_id: int
    supplier_id: int
    purchase_id: int
    batch_number: str
    manufacture_date: str
    expiry_date: str
    quantity: int
    cost_price: float
    selling_price: float

from datetime import date

class PrescriptionCreate(BaseModel):
    customer_id: int
    doctor_id: int
    prescription_date: date
    notes: str

class PrescriptionItemCreate(BaseModel):
    prescription_id: int
    medicine_id: int
    quantity: int
    dosage: str

from datetime import datetime

class SaleCreate(BaseModel):
    customer_id: int
    prescription_id: int | None = None
    sale_date: datetime
    total_amount: float

class SaleItemCreate(BaseModel):
    sale_id: int
    medicine_id: int
    batch_id: int
    quantity: int
    price: float
    subtotal: float

