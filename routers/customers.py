from fastapi import APIRouter, HTTPException
from db import get_connection
from schemas import CustomerCreate

router = APIRouter()

# 1. Add customer
@router.post("/customers")
def add_customer(customer: CustomerCreate):
    conn = get_connection()
    cursor = conn.cursor()

    sql = """
        INSERT INTO customers (customer_name, phone, email, address)
        VALUES (%s, %s, %s, %s)
    """
    cursor.execute(sql, (
        customer.customer_name,
        customer.phone,
        customer.email,
        customer.address
    ))

    cursor.close()
    conn.close()

    return {"message": "Customer added successfully"}


# 2. Get all customers
@router.get("/customers")
def get_all_customers():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM customers")
    customers = cursor.fetchall()

    cursor.close()
    conn.close()

    return customers


# 3. Get customer by ID
@router.get("/customers/{customer_id}")
def get_customer_by_id(customer_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM customers WHERE customer_id = %s", (customer_id,))
    customer = cursor.fetchone()

    cursor.close()
    conn.close()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    return customer


# 4. Update customer
@router.put("/customers/{customer_id}")
def update_customer(customer_id: int, customer: CustomerCreate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM customers WHERE customer_id = %s", (customer_id,))
    existing = cursor.fetchone()

    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Customer not found")

    sql = """
        UPDATE customers
        SET customer_name=%s, phone=%s, email=%s, address=%s
        WHERE customer_id=%s
    """
    cursor.execute(sql, (
        customer.customer_name,
        customer.phone,
        customer.email,
        customer.address,
        customer_id
    ))

    cursor.close()
    conn.close()

    return {"message": "Customer updated successfully"}


# 5. Delete customer
@router.delete("/customers/{customer_id}")
def delete_customer(customer_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM customers WHERE customer_id = %s", (customer_id,))
    existing = cursor.fetchone()

    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Customer not found")

    cursor.execute("DELETE FROM customers WHERE customer_id = %s", (customer_id,))

    cursor.close()
    conn.close()

    return {"message": "Customer deleted successfully"}