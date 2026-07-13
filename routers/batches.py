from fastapi import APIRouter, HTTPException
from db import get_connection
from schemas import BatchCreate

router = APIRouter()

# 1. Add batch
@router.post("/batches")
def add_batch(batch: BatchCreate):
    conn = get_connection()
    cursor = conn.cursor()

    # check medicine exists
    cursor.execute("SELECT * FROM medicines WHERE medicine_id = %s", (batch.medicine_id,))
    medicine = cursor.fetchone()
    if not medicine:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Medicine not found")

    # check supplier exists
    cursor.execute("SELECT * FROM suppliers WHERE supplier_id = %s", (batch.supplier_id,))
    supplier = cursor.fetchone()
    if not supplier:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Supplier not found")

    # check purchase order exists
    cursor.execute("SELECT * FROM purchase_orders WHERE purchase_id = %s", (batch.purchase_id,))
    purchase = cursor.fetchone()
    if not purchase:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Purchase order not found")

    sql = """
        INSERT INTO medicine_batches
        (medicine_id, supplier_id, purchase_id, batch_number, manufacture_date, expiry_date, quantity, cost_price, selling_price)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(sql, (
        batch.medicine_id,
        batch.supplier_id,
        batch.purchase_id,
        batch.batch_number,
        batch.manufacture_date,
        batch.expiry_date,
        batch.quantity,
        batch.cost_price,
        batch.selling_price
    ))

    cursor.close()
    conn.close()

    return {"message": "Batch added successfully"}


# 2. Get all batches
@router.get("/batches")
def get_all_batches():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM medicine_batches")
    batches = cursor.fetchall()

    cursor.close()
    conn.close()

    return batches


# 3. Get batch by ID
@router.get("/batches/{batch_id}")
def get_batch_by_id(batch_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM medicine_batches WHERE batch_id = %s", (batch_id,))
    batch = cursor.fetchone()

    cursor.close()
    conn.close()

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    return batch


# 4. Update batch
@router.put("/batches/{batch_id}")
def update_batch(batch_id: int, batch: BatchCreate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM medicine_batches WHERE batch_id = %s", (batch_id,))
    existing = cursor.fetchone()
    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Batch not found")

    cursor.execute("SELECT * FROM medicines WHERE medicine_id = %s", (batch.medicine_id,))
    medicine = cursor.fetchone()
    if not medicine:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Medicine not found")

    cursor.execute("SELECT * FROM suppliers WHERE supplier_id = %s", (batch.supplier_id,))
    supplier = cursor.fetchone()
    if not supplier:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Supplier not found")

    cursor.execute("SELECT * FROM purchase_orders WHERE purchase_id = %s", (batch.purchase_id,))
    purchase = cursor.fetchone()
    if not purchase:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Purchase order not found")

    sql = """
        UPDATE medicine_batches
        SET medicine_id=%s, supplier_id=%s, purchase_id=%s, batch_number=%s,
            manufacture_date=%s, expiry_date=%s, quantity=%s, cost_price=%s, selling_price=%s
        WHERE batch_id=%s
    """
    cursor.execute(sql, (
        batch.medicine_id,
        batch.supplier_id,
        batch.purchase_id,
        batch.batch_number,
        batch.manufacture_date,
        batch.expiry_date,
        batch.quantity,
        batch.cost_price,
        batch.selling_price,
        batch_id
    ))

    cursor.close()
    conn.close()

    return {"message": "Batch updated successfully"}


# 5. Delete batch
@router.delete("/batches/{batch_id}")
def delete_batch(batch_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM medicine_batches WHERE batch_id = %s", (batch_id,))
    existing = cursor.fetchone()

    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Batch not found")

    cursor.execute("DELETE FROM medicine_batches WHERE batch_id = %s", (batch_id,))

    cursor.close()
    conn.close()

    return {"message": "Batch deleted successfully"}