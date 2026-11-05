
import sqlite3
from pathlib import Path


# Database file location
BASE_DIR = Path(__file__).resolve().parent
DATABASE = BASE_DIR / "nextask.db"


# Create database connection
def get_db_connection():
    connection = sqlite3.connect(
        DATABASE,
        timeout=10
    )

    connection.row_factory = sqlite3.Row

    return connection


# Create database tables
def create_tables():
    connection = get_db_connection()

    try:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                category TEXT DEFAULT 'Other',
                priority TEXT DEFAULT 'Medium',
                due_date TEXT DEFAULT '',
                completed INTEGER DEFAULT 0,
                deleted INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)

        connection.commit()

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()
