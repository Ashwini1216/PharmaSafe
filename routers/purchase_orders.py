from fastapi import APIRouter, HTTPException
from db import get_connection
from schemas import PurchaseOrderCreate

router = APIRouter()

# 1. Add purchase order
@router.post("/purchase-orders")
def add_purchase_order(order: PurchaseOrderCreate):
    conn = get_connection()
    cursor = conn.cursor()

    # check supplier exists
    cursor.execute("SELECT * FROM suppliers WHERE supplier_id = %s", (order.supplier_id,))
    supplier = cursor.fetchone()

    if not supplier:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Supplier not found")

    sql = """
        INSERT INTO purchase_orders (supplier_id, purchase_date, total_amount)
        VALUES (%s, %s, %s)
    """
    cursor.execute(sql, (
        order.supplier_id,
        order.purchase_date,
        order.total_amount
    ))

    purchase_id = cursor.lastrowid
    cursor.close()
    conn.close()

    return {"message": "Purchase order added successfully", "purchase_id": purchase_id}


# 2. Get all purchase orders
@router.get("/purchase-orders")
def get_all_purchase_orders():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM purchase_orders")
    orders = cursor.fetchall()

    cursor.close()
    conn.close()

    return orders


# 3. Get purchase order by ID
@router.get("/purchase-orders/{purchase_id}")
def get_purchase_order_by_id(purchase_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM purchase_orders WHERE purchase_id = %s", (purchase_id,))
    order = cursor.fetchone()

    cursor.close()
    conn.close()

    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    return order


# 4. Update purchase order
@router.put("/purchase-orders/{purchase_id}")
def update_purchase_order(purchase_id: int, order: PurchaseOrderCreate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM purchase_orders WHERE purchase_id = %s", (purchase_id,))
    existing = cursor.fetchone()

    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Purchase order not found")

    cursor.execute("SELECT * FROM suppliers WHERE supplier_id = %s", (order.supplier_id,))
    supplier = cursor.fetchone()

    if not supplier:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Supplier not found")

    sql = """
        UPDATE purchase_orders
        SET supplier_id=%s, purchase_date=%s, total_amount=%s
        WHERE purchase_id=%s
    """
    cursor.execute(sql, (
        order.supplier_id,
        order.purchase_date,
        order.total_amount,
        purchase_id
    ))

    cursor.close()
    conn.close()

    return {"message": "Purchase order updated successfully"}


# 5. Delete purchase order
@router.delete("/purchase-orders/{purchase_id}")
def delete_purchase_order(purchase_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM purchase_orders WHERE purchase_id = %s", (purchase_id,))
    existing = cursor.fetchone()

    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Purchase order not found")

    cursor.execute("DELETE FROM purchase_orders WHERE purchase_id = %s", (purchase_id,))

    cursor.close()
    conn.close()

    return {"message": "Purchase order deleted successfully"}