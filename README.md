# NexTask – Task Management Application

NexTask is a task management web application built to help users organize, manage, and track their daily tasks.

## Features

- Create new tasks
- View all tasks
- Edit existing tasks
- Mark tasks as completed
- Delete tasks
- Restore deleted tasks from Trash
- Permanently delete tasks
- Organize tasks by category and priority
- Set task due dates
- Export and import task backups
- Manage application settings
- Dark theme interface

## Technologies Used

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Python
- Flask
- Flask-CORS

### Database
- SQLite

## Project Structure

```text
NexTask/
│
├── frontend/
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── pages/
│
└── backend/
    ├── app.py
    ├── database.py
    ├── models.py
    ├── nextask.db
    ├── requirements.txt
    └── routes/
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR-GITHUB-REPOSITORY-URL
```

### 2. Open the project folder

```bash
cd NexTask
```

### 3. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Start the backend

```bash
python app.py
```

### 5. Start the frontend

Open another terminal, navigate to the frontend folder, and run:

```bash
cd frontend
python -m http.server 8000
```

Open this URL in your browser:

```text
http://127.0.0.1:8000
```

## Database

NexTask uses SQLite to store task information. The database and required table are initialized automatically when the backend starts.

## Project Purpose

This project was developed to practice frontend development, Python backend development, database integration, and REST API operations.

## Author

Developed as a learning and academic project.

---

**NexTask – Organize Your Tasks. Simplify Your Day.**
