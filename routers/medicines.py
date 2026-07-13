from fastapi import APIRouter, HTTPException
from db import get_connection
from schemas import MedicineCreate

router = APIRouter()

# 1. Add medicine
@router.post("/medicines")
def add_medicine(medicine: MedicineCreate):
    conn = get_connection()
    cursor = conn.cursor()

    sql = """
        INSERT INTO medicines (name, category, manufacturer, requires_prescription, description)
        VALUES (%s, %s, %s, %s, %s)
    """
    cursor.execute(sql, (
        medicine.name,
        medicine.category,
        medicine.manufacturer,
        medicine.requires_prescription,
        medicine.description
    ))

    cursor.close()
    conn.close()

    return {"message": "Medicine added successfully"}


# 2. Get all medicines
@router.get("/medicines")
def get_all_medicines():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM medicines")
    medicines = cursor.fetchall()

    cursor.close()
    conn.close()

    return medicines


# 3. Get medicine by ID
@router.get("/medicines/{medicine_id}")
def get_medicine_by_id(medicine_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM medicines WHERE medicine_id = %s", (medicine_id,))
    medicine = cursor.fetchone()

    cursor.close()
    conn.close()

    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    return medicine


# 4. Update medicine
@router.put("/medicines/{medicine_id}")
def update_medicine(medicine_id: int, medicine: MedicineCreate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM medicines WHERE medicine_id = %s", (medicine_id,))
    existing = cursor.fetchone()

    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Medicine not found")

    sql = """
        UPDATE medicines
        SET name=%s, category=%s, manufacturer=%s, requires_prescription=%s, description=%s
        WHERE medicine_id=%s
    """
    cursor.execute(sql, (
        medicine.name,
        medicine.category,
        medicine.manufacturer,
        medicine.requires_prescription,
        medicine.description,
        medicine_id
    ))

    cursor.close()
    conn.close()

    return {"message": "Medicine updated successfully"}


# 5. Delete medicine
@router.delete("/medicines/{medicine_id}")
def delete_medicine(medicine_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM medicines WHERE medicine_id = %s", (medicine_id,))
    existing = cursor.fetchone()

    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Medicine not found")

    cursor.execute("DELETE FROM medicines WHERE medicine_id = %s", (medicine_id,))

    cursor.close()
    conn.close()

    return {"message": "Medicine deleted successfully"}