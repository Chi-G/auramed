from app.db.session import engine
from app.db.base_class import Base
# Import all the models, so that Base has them before being used by the application
from app.db.base import Base  # noqa

def create_tables():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

if __name__ == "__main__":
    create_tables()
