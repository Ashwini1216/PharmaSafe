import pymysql

def create_server_connection():
    return pymysql.connect(
        host="localhost",
        user="root",
        password="your password",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )

def create_db_connection():
    return pymysql.connect(
        host="localhost",
        user="root",
        password="your password",   # change if your mysql password is different
        database="pharmasafe",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )

def create_database_and_tables():
    conn = create_server_connection()
    cursor = conn.cursor()

    # create database
    cursor.execute("CREATE DATABASE IF NOT EXISTS pharmasafe")
    cursor.execute("USE pharmasafe")

    # medicines
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS medicines (
            medicine_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            category VARCHAR(100),
            manufacturer VARCHAR(150),
            requires_prescription BOOLEAN DEFAULT FALSE,
            description TEXT
        )
    """)

    # suppliers
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS suppliers (
            supplier_id INT AUTO_INCREMENT PRIMARY KEY,
            supplier_name VARCHAR(150) NOT NULL,
            contact_person VARCHAR(100),
            phone VARCHAR(20),
            email VARCHAR(100),
            address TEXT
        )
    """)

    # customers
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customers (
            customer_id INT AUTO_INCREMENT PRIMARY KEY,
            customer_name VARCHAR(150) NOT NULL,
            phone VARCHAR(20),
            email VARCHAR(100),
            address TEXT
        )
    """)

    # doctors
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS doctors (
            doctor_id INT AUTO_INCREMENT PRIMARY KEY,
            doctor_name VARCHAR(150) NOT NULL,
            specialization VARCHAR(100),
            phone VARCHAR(20),
            hospital_name VARCHAR(150)
        )
    """)

    # purchase_orders
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS purchase_orders (
            purchase_id INT AUTO_INCREMENT PRIMARY KEY,
            supplier_id INT NOT NULL,
            purchase_date DATE NOT NULL,
            total_amount DECIMAL(10,2) DEFAULT 0,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
        )
    """)

    # medicine_batches
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS medicine_batches (
            batch_id INT AUTO_INCREMENT PRIMARY KEY,
            medicine_id INT NOT NULL,
            supplier_id INT NOT NULL,
            purchase_id INT NOT NULL,
            batch_number VARCHAR(100) NOT NULL UNIQUE,
            manufacture_date DATE,
            expiry_date DATE NOT NULL,
            quantity INT NOT NULL,
            cost_price DECIMAL(10,2) NOT NULL,
            selling_price DECIMAL(10,2) NOT NULL,

            FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id),
            FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
            FOREIGN KEY (purchase_id) REFERENCES purchase_orders(purchase_id)
        )
    """)

    # prescriptions
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS prescriptions (
            prescription_id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT NOT NULL,
            doctor_id INT NOT NULL,
            prescription_date DATE NOT NULL,
            notes TEXT,
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
            FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
        )
    """)

    # prescription_items
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS prescription_items (
            prescription_item_id INT AUTO_INCREMENT PRIMARY KEY,
            prescription_id INT NOT NULL,
            medicine_id INT NOT NULL,
            quantity INT NOT NULL,
            dosage VARCHAR(100),
            FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id),
            FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
        )
    """)

    # sales
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sales (
            sale_id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT NOT NULL,
            prescription_id INT NULL,
            sale_date DATETIME NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
            FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id)
        )
    """)

    # sale_items
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sale_items (
            sale_item_id INT AUTO_INCREMENT PRIMARY KEY,
            sale_id INT NOT NULL,
            medicine_id INT NOT NULL,
            batch_id INT NOT NULL,
            quantity INT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            subtotal DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (sale_id) REFERENCES sales(sale_id),
            FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id),
            FOREIGN KEY (batch_id) REFERENCES medicine_batches(batch_id)
        )
    """)

    cursor.close()
    conn.close()

def get_connection():
    return pymysql.connect(
        host="localhost",
        user="root",
        password="1234",   # put your mysql password here
        database="pharmasafe",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )

