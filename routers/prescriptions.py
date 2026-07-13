from fastapi import APIRouter, HTTPException
from db import get_connection
from schemas import PrescriptionCreate

router = APIRouter()

# 1. Add Prescription
@router.post("/prescriptions")
def add_prescription(prescription: PrescriptionCreate):
    conn = get_connection()
    cursor = conn.cursor()

    # Check customer exists
    cursor.execute(
        "SELECT * FROM customers WHERE customer_id = %s",
        (prescription.customer_id,)
    )
    customer = cursor.fetchone()

    if not customer:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Customer not found")

    # Check doctor exists
    cursor.execute(
        "SELECT * FROM doctors WHERE doctor_id = %s",
        (prescription.doctor_id,)
    )
    doctor = cursor.fetchone()

    if not doctor:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Doctor not found")

    sql = """
    INSERT INTO prescriptions
    (customer_id, doctor_id, prescription_date, notes)
    VALUES (%s, %s, %s, %s)
    """

    cursor.execute(sql, (
        prescription.customer_id,
        prescription.doctor_id,
        prescription.prescription_date,
        prescription.notes
    ))

    prescription_id = cursor.lastrowid
    cursor.close()
    conn.close()

    return {"message": "Prescription added successfully", "prescription_id": prescription_id}

# 2. Get all prescriptions
@router.get("/prescriptions")
def get_all_prescriptions():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM prescriptions")
    prescriptions = cursor.fetchall()

    cursor.close()
    conn.close()

    return prescriptions

# 3. Get prescription by ID
@router.get("/prescriptions/{prescription_id}")
def get_prescription_by_id(prescription_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM prescriptions WHERE prescription_id = %s",
        (prescription_id,)
    )

    prescription = cursor.fetchone()

    cursor.close()
    conn.close()

    if not prescription:
        raise HTTPException(
            status_code=404,
            detail="Prescription not found"
        )

    return prescription

# 4. Update Prescription
@router.put("/prescriptions/{prescription_id}")
def update_prescription(prescription_id: int, prescription: PrescriptionCreate):
    conn = get_connection()
    cursor = conn.cursor()

    # Check prescription exists
    cursor.execute(
        "SELECT * FROM prescriptions WHERE prescription_id = %s",
        (prescription_id,)
    )
    existing = cursor.fetchone()

    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Prescription not found")

    # Check customer exists
    cursor.execute(
        "SELECT * FROM customers WHERE customer_id = %s",
        (prescription.customer_id,)
    )
    customer = cursor.fetchone()

    if not customer:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Customer not found")

    # Check doctor exists
    cursor.execute(
        "SELECT * FROM doctors WHERE doctor_id = %s",
        (prescription.doctor_id,)
    )
    doctor = cursor.fetchone()

    if not doctor:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Doctor not found")

    sql = """
    UPDATE prescriptions
    SET customer_id=%s,
        doctor_id=%s,
        prescription_date=%s,
        notes=%s
    WHERE prescription_id=%s
    """

    cursor.execute(sql, (
        prescription.customer_id,
        prescription.doctor_id,
        prescription.prescription_date,
        prescription.notes,
        prescription_id
    ))

    cursor.close()
    conn.close()

    return {"message": "Prescription updated successfully"}

# 5. Delete Prescription
@router.delete("/prescriptions/{prescription_id}")
def delete_prescription(prescription_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    # Check if prescription exists
    cursor.execute(
        "SELECT * FROM prescriptions WHERE prescription_id = %s",
        (prescription_id,)
    )
    prescription = cursor.fetchone()

    if not prescription:
        cursor.close()
        conn.close()
        raise HTTPException(
            status_code=404,
            detail="Prescription not found"
        )

    cursor.execute(
        "DELETE FROM prescriptions WHERE prescription_id = %s",
        (prescription_id,)
    )

    cursor.close()
    conn.close()

    return {"message": "Prescription deleted successfully"}