from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import get_connection, create_database_and_tables
from routers import medicines, suppliers,customers,doctors,purchase_orders,batches,prescriptions,prescription_items,sales,sale_items
app = FastAPI(title="PharmaSafe ERP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_database_and_tables()

app.include_router(medicines.router)
app.include_router(suppliers.router)
app.include_router(customers.router)
app.include_router(doctors.router)
app.include_router(purchase_orders.router)
app.include_router(batches.router)
app.include_router(prescriptions.router)
app.include_router(prescription_items.router)
app.include_router(sales.router)
app.include_router(sale_items.router)

@app.get("/")
def home():
    return {"message": "PharmaSafe ERP API is running"}

@app.get("/test-db")
def test_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT DATABASE() AS db_name")
    result = cursor.fetchone()

    cursor.close()
    conn.close()

    return {
        "message": "Database connected successfully",
        "database": result["db_name"]
    }