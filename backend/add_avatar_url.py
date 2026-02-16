import sys
import os
from sqlalchemy import create_engine, text
from app.core.config import settings

def add_column():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE user ADD COLUMN avatar_url VARCHAR(255) NULL"))
            print("Successfully added avatar_url column")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("Column avatar_url already exists")
            else:
                print(f"Error adding column: {e}")

if __name__ == "__main__":
    add_column()
