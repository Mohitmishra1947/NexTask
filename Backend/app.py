
from flask import Flask, jsonify
from flask_cors import CORS

from database import create_tables
from routes.tasks import tasks_bp


# Create Flask application
app = Flask(__name__)

# Enable communication with frontend
CORS(app)


# Create database tables
create_tables()


# Register task API routes
app.register_blueprint(tasks_bp)


# Home route
@app.route("/")
def home():
    return jsonify({
        "message": "Welcome to NexTask API",
        "status": "Running"
    })


# Health check route
@app.route("/api/health")
def health_check():
    return jsonify({
        "status": "healthy",
        "application": "NexTask Backend"
    })


# Handle unknown routes
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Route not found"
    }), 404


# Start server
if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
