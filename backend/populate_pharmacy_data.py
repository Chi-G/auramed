from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

categories = [
    "Antibiotics",
    "Analgesics",
    "Antidiabetics",
    "Cardiovascular",
    "Antimalarials",
    "Gastrointestinal",
    "Antihistamines",
    "Supplements",
    "Respiratory"
]

specialized_drugs = [
    ("Liver Detox", "Supplements", 4500.0, 50),
    ("Kidney Detox", "Supplements", 4500.0, 40),
    ("Anti-Viral", "Antivirals", 7500.0, 20),
    ("Gbd(General Body Detox)", "Supplements", 5500.0, 30),
    ("Anti-Obstructive", "Respiratory", 6000.0, 25),
    ("Immune Booster", "Supplements", 3500.0, 100),
    ("Cardio-Solution", "Cardiovascular", 8500.0, 15),
    ("CNM", "Specialized", 12000.0, 10),
    ("CNS", "Specialized", 15000.0, 10),
    ("Psa(Prostate Solution)", "Specialized", 9500.0, 15),
    ("Staph Cleanser", "Antibiotics", 5000.0, 45),
    ("Clove Extract", "Supplements", 2500.0, 120),
    ("Fertility Booster", "Supplements", 18000.0, 20),
    ("Infection Flusher", "Antibiotics", 6500.0, 35),
    ("Anti Inflammation", "Analgesics", 3000.0, 80),
    ("Natural Water & Milk", "Supplements", 500.0, 200),
    ("Garlic+", "Supplements", 2000.0, 150),
    ("Activated Charcoal", "Gastrointestinal", 1500.0, 100)
]

def populate_data():
    with engine.begin() as conn:
        print("Populating categories...")
        for cat in categories:
            # Check if exists
            exists = conn.execute(text("SELECT id FROM drugcategory WHERE name = :name"), {"name": cat}).first()
            if not exists:
                conn.execute(text("INSERT INTO drugcategory (name) VALUES (:name)"), {"name": cat})
                print(f"Added category: {cat}")
        
        # Add Antivirals and Specialized if not in list but needed for drugs
        for cat in ["Antivirals", "Specialized"]:
            exists = conn.execute(text("SELECT id FROM drugcategory WHERE name = :name"), {"name": cat}).first()
            if not exists:
                conn.execute(text("INSERT INTO drugcategory (name) VALUES (:name)"), {"name": cat})
        
        print("\nPopulating specialized drugs...")
        for name, cat, price, stock in specialized_drugs:
            exists = conn.execute(text("SELECT id FROM drug WHERE name = :name"), {"name": name}).first()
            if not exists:
                conn.execute(text("""
                    INSERT INTO drug (name, category, unit_price, stock_quantity, low_stock_threshold)
                    VALUES (:name, :cat, :price, :stock, 10)
                """), {"name": name, "cat": cat, "price": price, "stock": stock})
                print(f"Added drug: {name}")

if __name__ == "__main__":
    if DATABASE_URL:
        populate_data()
    else:
        print("DATABASE_URL not found")
