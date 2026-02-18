from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

def migrate_statuses():
    with engine.begin() as conn:
        # Update Appointment ENUM - MySQL ENUM is case-insensitive, so 'pending' and 'PENDING' are duplicates.
        # We just need to ensure all desired lowercase values are there.
        conn.execute(text("""
            ALTER TABLE appointment 
            MODIFY COLUMN status ENUM(
                'scheduled', 'confirmed', 'arrived', 'in_consultation', 'completed', 'cancelled', 'no_show', 'pending'
            ) DEFAULT 'scheduled'
        """))
        print("Updated appointment ENUM definition (lowercase only)")

        # Update appointment statuses
        conn.execute(text("UPDATE appointment SET status = 'scheduled' WHERE status = 'pending'"))
        conn.execute(text("UPDATE appointment SET status = 'confirmed' WHERE status = 'confirmed'"))
        conn.execute(text("UPDATE appointment SET status = 'cancelled' WHERE status = 'cancelled'"))
        conn.execute(text("UPDATE appointment SET status = 'completed' WHERE status = 'completed'"))
        print("Updated appointment statuses")

        # Update bill statuses
        conn.execute(text("""
            ALTER TABLE bill 
            MODIFY COLUMN status ENUM('unpaid', 'partial', 'paid', 'cancelled') DEFAULT 'unpaid'
        """))
        print("Updated bill ENUM definition")

        # Update bill table - MySQL handles the case-insensitive match for the WHERE clause
        conn.execute(text("UPDATE bill SET status = 'unpaid' WHERE status = 'unpaid'"))
        conn.execute(text("UPDATE bill SET status = 'partial' WHERE status = 'partial'"))
        conn.execute(text("UPDATE bill SET status = 'paid' WHERE status = 'paid'"))
        print("Updated bill statuses to lowercase")

if __name__ == "__main__":
    if DATABASE_URL:
        migrate_statuses()
    else:
        print("DATABASE_URL not found in .env")
