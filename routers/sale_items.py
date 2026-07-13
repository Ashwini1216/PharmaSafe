from fastapi import APIRouter, HTTPException
from db import get_connection
from schemas import SaleItemCreate

router = APIRouter()

# 1. Add Sale Item
@router.post("/sale-items")
def add_sale_item(item: SaleItemCreate):

    conn = get_connection()
    cursor = conn.cursor()

    # Check Sale
    cursor.execute("SELECT * FROM sales WHERE sale_id=%s", (item.sale_id,))
    sale = cursor.fetchone()

    if not sale:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Sale not found")

    # Check Medicine
    cursor.execute("SELECT * FROM medicines WHERE medicine_id=%s", (item.medicine_id,))
    medicine = cursor.fetchone()

    if not medicine:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Medicine not found")

    # Check Batch
    cursor.execute("SELECT * FROM medicine_batches WHERE batch_id=%s", (item.batch_id,))
    batch = cursor.fetchone()

    if not batch:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Batch not found")

    if batch['quantity'] < item.quantity:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Insufficient stock in batch. Available: {batch['quantity']}")

    # Deduct quantity from batch
    cursor.execute(
        "UPDATE medicine_batches SET quantity = quantity - %s WHERE batch_id = %s",
        (item.quantity, item.batch_id)
    )

    sql = """
    INSERT INTO sale_items
    (sale_id, medicine_id, batch_id, quantity, price, subtotal)
    VALUES (%s, %s, %s, %s, %s, %s)
    """

    cursor.execute(sql, (
        item.sale_id,
        item.medicine_id,
        item.batch_id,
        item.quantity,
        item.price,
        item.subtotal
    ))

    cursor.close()
    conn.close()

    return {"message": "Sale Item added successfully"}


# 2. Get All Sale Items
@router.get("/sale-items")
def get_all_sale_items():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM sale_items")

    items = cursor.fetchall()

    cursor.close()
    conn.close()

    return items


# 3. Get Sale Item By ID
@router.get("/sale-items/{sale_item_id}")
def get_sale_item_by_id(sale_item_id: int):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM sale_items WHERE sale_item_id=%s",
        (sale_item_id,)
    )

    item = cursor.fetchone()

    cursor.close()
    conn.close()

    if not item:
        raise HTTPException(status_code=404, detail="Sale Item not found")

    return item


# 4. Update Sale Item
@router.put("/sale-items/{sale_item_id}")
def update_sale_item(sale_item_id: int, item: SaleItemCreate):

    conn = get_connection()
    cursor = conn.cursor()

    # Check Sale Item exists
    cursor.execute(
        "SELECT * FROM sale_items WHERE sale_item_id=%s",
        (sale_item_id,)
    )

    existing = cursor.fetchone()

    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Sale Item not found")

    # Check Sale
    cursor.execute("SELECT * FROM sales WHERE sale_id=%s", (item.sale_id,))
    sale = cursor.fetchone()

    if not sale:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Sale not found")

    # Check Medicine
    cursor.execute("SELECT * FROM medicines WHERE medicine_id=%s", (item.medicine_id,))
    medicine = cursor.fetchone()

    if not medicine:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Medicine not found")

    # Check Batch
    cursor.execute("SELECT * FROM medicine_batches WHERE batch_id=%s", (item.batch_id,))
    batch = cursor.fetchone()

    if not batch:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Batch not found")

    sql = """
    UPDATE sale_items
    SET sale_id=%s,
        medicine_id=%s,
        batch_id=%s,
        quantity=%s,
        price=%s,
        subtotal=%s
    WHERE sale_item_id=%s
    """

    cursor.execute(sql, (
        item.sale_id,
        item.medicine_id,
        item.batch_id,
        item.quantity,
        item.price,
        item.subtotal,
        sale_item_id
    ))

    cursor.close()
    conn.close()

    return {"message": "Sale Item updated successfully"}


# 5. Delete Sale Item
@router.delete("/sale-items/{sale_item_id}")
def delete_sale_item(sale_item_id: int):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM sale_items WHERE sale_item_id=%s",
        (sale_item_id,)
    )

    item = cursor.fetchone()

    if not item:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Sale Item not found")

    cursor.execute(
        "DELETE FROM sale_items WHERE sale_item_id=%s",
        (sale_item_id,)
    )

    cursor.close()
    conn.close()

    return {"message": "Sale Item deleted successfully"}