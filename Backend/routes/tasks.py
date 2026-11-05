
from flask import Blueprint, request, jsonify
from datetime import datetime, date

from models import (
    get_all_tasks,
    get_task_by_id,
    create_task,
    update_task,
    delete_task,
    update_task_status,
    get_deleted_tasks,
    restore_task,
    permanently_delete_task,
    empty_trash,
    replace_all_tasks
)


tasks_bp = Blueprint("tasks", __name__, url_prefix="/api")


VALID_CATEGORIES = ["Work", "Study", "Personal", "Other"]
VALID_PRIORITIES = ["High", "Medium", "Low"]


# Convert database task into frontend format
def format_task(task):
    if task is None:
        return None

    return {
        "id": str(task["id"]),
        "title": task["title"],
        "description": task["description"],
        "category": task["category"],
        "priority": task["priority"],
        "dueDate": task["due_date"],
        "completed": bool(task["completed"]),
        "deleted": bool(task["deleted"]),
        "createdAt": task["created_at"]
    }


# Validate date format
def is_valid_date(value):
    if value == "":
        return True

    if not isinstance(value, str):
        return False

    try:
        return date.fromisoformat(value).isoformat() == value
    except ValueError:
        return False


# Validate task data
def validate_task_data(data):
    if not isinstance(data, dict):
        return "Invalid JSON data"

    title = data.get("title", "")

    if not isinstance(title, str) or not title.strip():
        return "Task title is required"

    description = data.get("description", "")

    if not isinstance(description, str):
        return "Description must be text"

    category = data.get("category", "Other")

    if category not in VALID_CATEGORIES:
        return "Invalid category"

    priority = data.get("priority", "Medium")

    if priority not in VALID_PRIORITIES:
        return "Invalid priority"

    due_date = data.get("dueDate", "")

    if not is_valid_date(due_date):
        return "Due date must use YYYY-MM-DD format"

    return None


# Validate backup task
def validate_backup_task(task):
    if not isinstance(task, dict):
        return False

    if validate_task_data(task) is not None:
        return False

    if not isinstance(task.get("completed"), bool):
        return False

    if not isinstance(task.get("deleted"), bool):
        return False

    created_at = task.get("createdAt")

    if not isinstance(created_at, str) or not created_at.strip():
        return False

    try:
        datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    except ValueError:
        return False

    return True


# GET all active tasks
@tasks_bp.route("/tasks", methods=["GET"])
def get_tasks():
    tasks = get_all_tasks()

    active_tasks = []

    for task in tasks:
        if not task["deleted"]:
            active_tasks.append(format_task(task))

    return jsonify(active_tasks), 200


# GET one task
@tasks_bp.route("/tasks/<int:task_id>", methods=["GET"])
def get_single_task(task_id):
    task = get_task_by_id(task_id)

    if task is None or task["deleted"]:
        return jsonify({"error": "Task not found"}), 404

    return jsonify(format_task(task)), 200


# POST create task
@tasks_bp.route("/tasks", methods=["POST"])
def add_task():
    data = request.get_json(silent=True) or {}

    error = validate_task_data(data)

    if error:
        return jsonify({"error": error}), 400

    created_at = datetime.now().isoformat(timespec="seconds")

    task = create_task(
        data.get("title", "").strip(),
        data.get("description", ""),
        data.get("category", "Other"),
        data.get("priority", "Medium"),
        data.get("dueDate", ""),
        created_at
    )

    return jsonify(format_task(task)), 201


# PUT update task
@tasks_bp.route("/tasks/<int:task_id>", methods=["PUT"])
def edit_task(task_id):
    existing_task = get_task_by_id(task_id)

    if existing_task is None or existing_task["deleted"]:
        return jsonify({"error": "Task not found"}), 404

    data = request.get_json(silent=True) or {}

    error = validate_task_data(data)

    if error:
        return jsonify({"error": error}), 400

    task = update_task(
        task_id,
        data.get("title", "").strip(),
        data.get("description", ""),
        data.get("category", "Other"),
        data.get("priority", "Medium"),
        data.get("dueDate", "")
    )

    return jsonify(format_task(task)), 200


# PATCH complete or reopen task
@tasks_bp.route("/tasks/<int:task_id>/status", methods=["PATCH"])
def change_task_status(task_id):
    task = get_task_by_id(task_id)

    if task is None or task["deleted"]:
        return jsonify({"error": "Task not found"}), 404

    data = request.get_json(silent=True) or {}

    completed = data.get("completed")

    if not isinstance(completed, bool):
        return jsonify({"error": "Completed must be true or false"}), 400

    update_task_status(task_id, completed)

    updated_task = get_task_by_id(task_id)

    return jsonify(format_task(updated_task)), 200


# DELETE move task to Trash
@tasks_bp.route("/tasks/<int:task_id>", methods=["DELETE"])
def remove_task(task_id):
    task = get_task_by_id(task_id)

    if task is None or task["deleted"]:
        return jsonify({"error": "Task not found"}), 404

    delete_task(task_id)

    return jsonify({
        "message": "Task moved to Trash successfully"
    }), 200


# GET Trash
@tasks_bp.route("/trash", methods=["GET"])
def get_trash():
    tasks = get_deleted_tasks()

    return jsonify([
        format_task(task) for task in tasks
    ]), 200


# PATCH restore task
@tasks_bp.route("/tasks/<int:task_id>/restore", methods=["PATCH"])
def restore_deleted_task(task_id):
    task = get_task_by_id(task_id)

    if task is None or not task["deleted"]:
        return jsonify({"error": "Deleted task not found"}), 404

    restore_task(task_id)

    return jsonify(format_task(get_task_by_id(task_id))), 200


# DELETE permanently delete task
@tasks_bp.route("/tasks/<int:task_id>/permanent", methods=["DELETE"])
def permanently_remove_task(task_id):
    task = get_task_by_id(task_id)

    if task is None or not task["deleted"]:
        return jsonify({"error": "Deleted task not found"}), 404

    permanently_delete_task(task_id)

    return jsonify({
        "message": "Task permanently deleted"
    }), 200


# DELETE empty Trash
@tasks_bp.route("/trash", methods=["DELETE"])
def clear_trash():
    empty_trash()

    return jsonify({
        "message": "Trash emptied successfully"
    }), 200


# POST import backup
@tasks_bp.route("/tasks/backup", methods=["POST"])
def import_backup():
    data = request.get_json(silent=True) or {}

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid backup data"}), 400

    imported_tasks = data.get("tasks")

    if not isinstance(imported_tasks, list):
        return jsonify({"error": "Tasks must be a list"}), 400

    for task in imported_tasks:
        if not validate_backup_task(task):
            return jsonify({
                "error": "Backup contains invalid task data"
            }), 400

    try:
        replace_all_tasks(imported_tasks)

        return jsonify({
            "message": "Backup imported successfully",
            "imported": len(imported_tasks)
        }), 200

    except Exception:
        return jsonify({
            "error": "Database error during backup import"
        }), 500
