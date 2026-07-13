from fastapi import APIRouter, HTTPException
from db import get_connection
from schemas import PrescriptionItemCreate

router = APIRouter()

# 1. Add Prescription Item
@router.post("/prescription-items")
def add_prescription_item(item: PrescriptionItemCreate):
    conn = get_connection()
    cursor = conn.cursor()

    # Check prescription
    cursor.execute(
        "SELECT * FROM prescriptions WHERE prescription_id=%s",
        (item.prescription_id,)
    )
    prescription = cursor.fetchone()

    if not prescription:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Prescription not found")

    # Check medicine
    cursor.execute(
        "SELECT * FROM medicines WHERE medicine_id=%s",
        (item.medicine_id,)
    )
    medicine = cursor.fetchone()

    if not medicine:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Medicine not found")

    cursor.execute(
        """
        INSERT INTO prescription_items
        (prescription_id, medicine_id, quantity, dosage)
        VALUES (%s,%s,%s,%s)
        """,
        (
            item.prescription_id,
            item.medicine_id,
            item.quantity,
            item.dosage
        )
    )

    cursor.close()
    conn.close()

    return {"message": "Prescription item added successfully"}


# 2. Get All Prescription Items
@router.get("/prescription-items")
def get_all_prescription_items():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM prescription_items")
    items = cursor.fetchall()

    cursor.close()
    conn.close()

    return items


# 3. Get Prescription Item By ID
@router.get("/prescription-items/{prescription_item_id}")
def get_prescription_item_by_id(prescription_item_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM prescription_items WHERE prescription_item_id=%s",
        (prescription_item_id,)
    )

    item = cursor.fetchone()

    cursor.close()
    conn.close()

    if not item:
        raise HTTPException(status_code=404, detail="Prescription Item not found")

    return item


# 4. Update Prescription Item
@router.put("/prescription-items/{prescription_item_id}")
def update_prescription_item(
    prescription_item_id: int,
    item: PrescriptionItemCreate
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM prescription_items WHERE prescription_item_id=%s",
        (prescription_item_id,)
    )
    existing = cursor.fetchone()

    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Prescription Item not found")

    cursor.execute(
        "SELECT * FROM prescriptions WHERE prescription_id=%s",
        (item.prescription_id,)
    )
    prescription = cursor.fetchone()

    if not prescription:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Prescription not found")

    cursor.execute(
        "SELECT * FROM medicines WHERE medicine_id=%s",
        (item.medicine_id,)
    )
    medicine = cursor.fetchone()

    if not medicine:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Medicine not found")

    cursor.execute(
        """
        UPDATE prescription_items
        SET prescription_id=%s,
            medicine_id=%s,
            quantity=%s,
            dosage=%s
        WHERE prescription_item_id=%s
        """,
        (
            item.prescription_id,
            item.medicine_id,
            item.quantity,
            item.dosage,
            prescription_item_id
        )
    )

    cursor.close()
    conn.close()

    return {"message": "Prescription Item updated successfully"}


# 5. Delete Prescription Item
@router.delete("/prescription-items/{prescription_item_id}")
def delete_prescription_item(prescription_item_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM prescription_items WHERE prescription_item_id=%s",
        (prescription_item_id,)
    )

    item = cursor.fetchone()

    if not item:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Prescription Item not found")

    cursor.execute(
        "DELETE FROM prescription_items WHERE prescription_item_id=%s",
        (prescription_item_id,)
    )

    cursor.close()
    conn.close()

    return {"message": "Prescription Item deleted successfully"}