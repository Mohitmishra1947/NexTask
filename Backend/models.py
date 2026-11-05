
from database import get_db_connection


# Get all tasks
def get_all_tasks():
    connection = get_db_connection()
    try:
        tasks = connection.execute(
            "SELECT * FROM tasks ORDER BY id DESC"
        ).fetchall()

        return [dict(task) for task in tasks]
    finally:
        connection.close()


# Get one task by ID
def get_task_by_id(task_id):
    connection = get_db_connection()
    try:
        task = connection.execute(
            "SELECT * FROM tasks WHERE id = ?",
            (task_id,)
        ).fetchone()

        return dict(task) if task else None
    finally:
        connection.close()


# Create a new task
def create_task(title, description, category, priority, due_date, created_at):
    connection = get_db_connection()

    try:
        cursor = connection.execute(
            """
            INSERT INTO tasks
            (title, description, category, priority, due_date, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (title, description, category, priority, due_date, created_at)
        )

        connection.commit()
        task_id = cursor.lastrowid

    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()

    return get_task_by_id(task_id)


# Update an existing task
def update_task(task_id, title, description, category, priority, due_date):
    connection = get_db_connection()

    try:
        connection.execute(
            """
            UPDATE tasks
            SET title = ?,
                description = ?,
                category = ?,
                priority = ?,
                due_date = ?
            WHERE id = ?
            """,
            (title, description, category, priority, due_date, task_id)
        )

        connection.commit()

    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()

    return get_task_by_id(task_id)


# Move task to Trash
def delete_task(task_id):
    connection = get_db_connection()
    try:
        connection.execute(
            "UPDATE tasks SET deleted = 1 WHERE id = ?",
            (task_id,)
        )
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


# Complete or reopen a task
def update_task_status(task_id, completed):
    connection = get_db_connection()
    try:
        connection.execute(
            "UPDATE tasks SET completed = ? WHERE id = ?",
            (int(completed), task_id)
        )
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


# Get deleted tasks
def get_deleted_tasks():
    connection = get_db_connection()
    try:
        tasks = connection.execute(
            "SELECT * FROM tasks WHERE deleted = 1 ORDER BY id DESC"
        ).fetchall()

        return [dict(task) for task in tasks]
    finally:
        connection.close()


# Restore a task
def restore_task(task_id):
    connection = get_db_connection()
    try:
        connection.execute(
            "UPDATE tasks SET deleted = 0 WHERE id = ?",
            (task_id,)
        )
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


# Permanently delete one task
def permanently_delete_task(task_id):
    connection = get_db_connection()
    try:
        connection.execute(
            "DELETE FROM tasks WHERE id = ?",
            (task_id,)
        )
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


# Empty Trash
def empty_trash():
    connection = get_db_connection()
    try:
        connection.execute(
            "DELETE FROM tasks WHERE deleted = 1"
        )
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


# Replace all tasks during backup import
def replace_all_tasks(tasks):
    connection = get_db_connection()

    try:
        connection.execute("BEGIN")
        connection.execute("DELETE FROM tasks")

        for task in tasks:
            connection.execute(
                """
                INSERT INTO tasks (
                    title, description, category, priority,
                    due_date, completed, deleted, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    task["title"],
                    task["description"],
                    task["category"],
                    task["priority"],
                    task["dueDate"],
                    int(task["completed"]),
                    int(task["deleted"]),
                    task["createdAt"]
                )
            )

        connection.commit()

    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()
