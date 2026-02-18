import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection details from .env
# Example: mysql+pymysql://chijid1:chibuike4u@127.0.0.1:3306/auramed
DB_USER = "chijid1"
DB_PASS = "chibuike4u"
DB_HOST = "127.0.0.1"
DB_NAME = "auramed"

def add_column():
    connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor
    )

    try:
        with connection.cursor() as cursor:
            # Add assigned_doctor_id to patient table
            print("Adding assigned_doctor_id to patient table...")
            try:
                cursor.execute("ALTER TABLE patient ADD COLUMN assigned_doctor_id INT NULL")
                cursor.execute("ALTER TABLE patient ADD CONSTRAINT fk_patient_doctor FOREIGN KEY (assigned_doctor_id) REFERENCES user(id)")
                print("Successfully added assigned_doctor_id and foreign key constraint.")
            except Exception as e:
                print(f"Error adding column: {e}")

        connection.commit()
    finally:
        connection.close()

if __name__ == "__main__":
    add_column()
