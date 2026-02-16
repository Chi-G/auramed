import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

# Assuming the DATABASE_URL is in format: mysql+pymysql://user:password@host:port/dbname
db_url = os.getenv("DATABASE_URL")
if not db_url or "mysql" not in db_url:
    print("MySQL not configured in .env")
    exit(0)

# Parse URL
# Format: mysql+pymysql://root:@localhost:3306/auramed_db
try:
    parts = db_url.split("://")[1].split("/")
    creds_host = parts[0]
    db_name = parts[1]
    
    user_pass, host_port = creds_host.split("@")
    user = user_pass.split(":")[0]
    password = user_pass.split(":")[1] if ":" in user_pass else ""
    
    host = host_port.split(":")[0]
    port = int(host_port.split(":")[1]) if ":" in host_port else 3306

    print(f"Connecting to MySQL at {host}:{port} as {user}...")
    conn = pymysql.connect(host=host, user=user, password=password, port=port)
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
    print(f"Database {db_name} ensured.")
    conn.close()
except Exception as e:
    print(f"Error creating database: {e}")
