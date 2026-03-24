# This file handles creating, updating, deleting,
# and retrieving calendar events

from flask import Blueprint, request, jsonify
import mysql.connector

events_bp = Blueprint("events", __name__)

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="your_password",
        database="webcalendar"
    )


@events_bp.route("/create", methods=["POST"])
def create_event():
    data = request.get_json()

    user_id = data.get("user_id")
    title = data.get("title")
    description = data.get("description")
    location = data.get("location")
    start_datetime = data.get("start_datetime")
    end_datetime = data.get("end_datetime")

    if not user_id or not title or not start_datetime or not end_datetime:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            INSERT INTO events (user_id, title, description, location, start_datetime, end_datetime)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        values = (user_id, title, description, location, start_datetime, end_datetime)

        cursor.execute(query, values)
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": "Event created successfully"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500



@events_bp.route("/user/<int:user_id>", methods=["GET"])
def get_user_events(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT id, user_id, title, description, location, start_datetime, end_datetime
            FROM events
            WHERE user_id = %s
            ORDER BY start_datetime
        """
        cursor.execute(query, (user_id,))
        events = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify(events), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
