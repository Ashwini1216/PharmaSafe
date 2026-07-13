from fastapi import APIRouter, HTTPException
from db import get_connection
from schemas import SupplierCreate

router = APIRouter()

# 1. Add supplier
@router.post("/suppliers")
def add_supplier(supplier: SupplierCreate):
    conn = get_connection()
    cursor = conn.cursor()

    sql = """
        INSERT INTO suppliers (supplier_name, contact_person, phone, email, address)
        VALUES (%s, %s, %s, %s, %s)
    """
    cursor.execute(sql, (
        supplier.supplier_name,
        supplier.contact_person,
        supplier.phone,
        supplier.email,
        supplier.address
    ))

    cursor.close()
    conn.close()

    return {"message": "Supplier added successfully"}


# 2. Get all suppliers
@router.get("/suppliers")
def get_all_suppliers():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM suppliers")
    suppliers = cursor.fetchall()

    cursor.close()
    conn.close()

    return suppliers


# 3. Get supplier by ID
@router.get("/suppliers/{supplier_id}")
def get_supplier_by_id(supplier_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM suppliers WHERE supplier_id = %s", (supplier_id,))
    supplier = cursor.fetchone()

    cursor.close()
    conn.close()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    return supplier


# 4. Update supplier
@router.put("/suppliers/{supplier_id}")
def update_supplier(supplier_id: int, supplier: SupplierCreate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM suppliers WHERE supplier_id = %s", (supplier_id,))
    existing = cursor.fetchone()

    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Supplier not found")

    sql = """
        UPDATE suppliers
        SET supplier_name=%s, contact_person=%s, phone=%s, email=%s, address=%s
        WHERE supplier_id=%s
    """
    cursor.execute(sql, (
        supplier.supplier_name,
        supplier.contact_person,
        supplier.phone,
        supplier.email,
        supplier.address,
        supplier_id
    ))

    cursor.close()
    conn.close()

    return {"message": "Supplier updated successfully"}


# 5. Delete supplier
@router.delete("/suppliers/{supplier_id}")
def delete_supplier(supplier_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM suppliers WHERE supplier_id = %s", (supplier_id,))
    existing = cursor.fetchone()

    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Supplier not found")

    cursor.execute("DELETE FROM suppliers WHERE supplier_id = %s", (supplier_id,))

    cursor.close()
    conn.close()

    return {"message": "Supplier deleted successfully"}