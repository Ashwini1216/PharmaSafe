from fastapi import APIRouter, HTTPException
from db import get_connection
from schemas import SaleCreate

router = APIRouter()

# 1. Add Sale
@router.post("/sales")
def add_sale(sale: SaleCreate):
    conn = get_connection()
    cursor = conn.cursor()

    # Check customer
    cursor.execute(
        "SELECT * FROM customers WHERE customer_id=%s",
        (sale.customer_id,)
    )
    customer = cursor.fetchone()

    if not customer:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Customer not found")

    # Check prescription (only if provided)
    if sale.prescription_id is not None:
        cursor.execute(
            "SELECT * FROM prescriptions WHERE prescription_id=%s",
            (sale.prescription_id,)
        )
        prescription = cursor.fetchone()

        if not prescription:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=404, detail="Prescription not found")

    cursor.execute(
        """
        INSERT INTO sales
        (customer_id, prescription_id, sale_date, total_amount)
        VALUES (%s,%s,%s,%s)
        """,
        (
            sale.customer_id,
            sale.prescription_id,
            sale.sale_date,
            sale.total_amount
        )
    )

    sale_id = cursor.lastrowid
    cursor.close()
    conn.close()

    return {"message": "Sale added successfully", "sale_id": sale_id}


# 2. Get All Sales
@router.get("/sales")
def get_all_sales():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM sales")
    sales = cursor.fetchall()

    cursor.close()
    conn.close()

    return sales


# 3. Get Sale By ID
@router.get("/sales/{sale_id}")
def get_sale_by_id(sale_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM sales WHERE sale_id=%s",
        (sale_id,)
    )

    sale = cursor.fetchone()

    cursor.close()
    conn.close()

    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    return sale


# 4. Update Sale
@router.put("/sales/{sale_id}")
def update_sale(sale_id: int, sale: SaleCreate):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM sales WHERE sale_id=%s",
        (sale_id,)
    )

    existing = cursor.fetchone()

    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Sale not found")

    cursor.execute(
        "SELECT * FROM customers WHERE customer_id=%s",
        (sale.customer_id,)
    )

    customer = cursor.fetchone()

    if not customer:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Customer not found")

    if sale.prescription_id is not None:
        cursor.execute(
            "SELECT * FROM prescriptions WHERE prescription_id=%s",
            (sale.prescription_id,)
        )

        prescription = cursor.fetchone()

        if not prescription:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=404, detail="Prescription not found")

    cursor.execute(
        """
        UPDATE sales
        SET customer_id=%s,
            prescription_id=%s,
            sale_date=%s,
            total_amount=%s
        WHERE sale_id=%s
        """,
        (
            sale.customer_id,
            sale.prescription_id,
            sale.sale_date,
            sale.total_amount,
            sale_id
        )
    )

    cursor.close()
    conn.close()

    return {"message": "Sale updated successfully"}


# 5. Delete Sale
@router.delete("/sales/{sale_id}")
def delete_sale(sale_id: int):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM sales WHERE sale_id=%s",
        (sale_id,)
    )

    sale = cursor.fetchone()

    if not sale:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Sale not found")

    cursor.execute(
        "DELETE FROM sales WHERE sale_id=%s",
        (sale_id,)
    )

    cursor.close()
    conn.close()

    return {"message": "Sale deleted successfully"}