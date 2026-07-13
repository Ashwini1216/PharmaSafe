from fastapi import APIRouter, HTTPException
from db import get_connection
from schemas import DoctorCreate

router = APIRouter()

# 1. Add doctor
@router.post("/doctors")
def add_doctor(doctor: DoctorCreate):
    conn = get_connection()
    cursor = conn.cursor()

    sql = """
        INSERT INTO doctors (doctor_name, specialization, phone, hospital_name)
        VALUES (%s, %s, %s, %s)
    """
    cursor.execute(sql, (
        doctor.doctor_name,
        doctor.specialization,
        doctor.phone,
        doctor.hospital_name
    ))

    cursor.close()
    conn.close()

    return {"message": "Doctor added successfully"}


# 2. Get all doctors
@router.get("/doctors")
def get_all_doctors():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM doctors")
    doctors = cursor.fetchall()

    cursor.close()
    conn.close()

    return doctors


# 3. Get doctor by ID
@router.get("/doctors/{doctor_id}")
def get_doctor_by_id(doctor_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM doctors WHERE doctor_id = %s", (doctor_id,))
    doctor = cursor.fetchone()

    cursor.close()
    conn.close()

    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    return doctor


# 4. Update doctor
@router.put("/doctors/{doctor_id}")
def update_doctor(doctor_id: int, doctor: DoctorCreate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM doctors WHERE doctor_id = %s", (doctor_id,))
    existing = cursor.fetchone()

    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Doctor not found")

    sql = """
        UPDATE doctors
        SET doctor_name=%s, specialization=%s, phone=%s, hospital_name=%s
        WHERE doctor_id=%s
    """
    cursor.execute(sql, (
        doctor.doctor_name,
        doctor.specialization,
        doctor.phone,
        doctor.hospital_name,
        doctor_id
    ))

    cursor.close()
    conn.close()

    return {"message": "Doctor updated successfully"}


# 5. Delete doctor
@router.delete("/doctors/{doctor_id}")
def delete_doctor(doctor_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM doctors WHERE doctor_id = %s", (doctor_id,))
    existing = cursor.fetchone()

    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Doctor not found")

    cursor.execute("DELETE FROM doctors WHERE doctor_id = %s", (doctor_id,))

    cursor.close()
    conn.close()

    return {"message": "Doctor deleted successfully"}