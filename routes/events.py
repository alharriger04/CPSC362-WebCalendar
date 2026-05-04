import os
from datetime import datetime, timedelta

import mysql.connector
from flask import Blueprint, jsonify, request, session
from routes.auth import login_required

events_bp = Blueprint("events", __name__)


def get_db_connection():
    return mysql.connector.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        user=os.environ.get("DB_USER", "root"),
        password=os.environ.get("DB_PASSWORD", "your_password"),
        database=os.environ.get("DB_NAME", "webcalendar"),
    )


def parse_iso_datetime(value):
    if not value:
        return None

    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def serialize_event(row):
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "title": row["title"],
        "description": row["description"],
        "location": row["location"],
        "start_datetime": row["start_datetime"].isoformat(sep=" "),
        "end_datetime": row["end_datetime"].isoformat(sep=" "),
    }


@events_bp.route("/create", methods=["POST"])
@login_required
def create_event():
    data = request.get_json() or {}

    user_id = session.get("user_id")
    title = data.get("title")
    description = data.get("description")
    location = data.get("location")
    start_datetime = data.get("start_datetime")
    end_datetime = data.get("end_datetime")

    start_dt = parse_iso_datetime(start_datetime)
    end_dt = parse_iso_datetime(end_datetime)

    if not title or not start_dt or not end_dt:
        return jsonify({"error": "Missing required fields"}), 400

    if end_dt <= start_dt:
        return jsonify({"error": "End time must be after start time."}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            INSERT INTO events (user_id, title, description, location, start_datetime, end_datetime)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        values = (user_id, title, description, location, start_dt, end_dt)

        cursor.execute(query, values)
        conn.commit()

        event_id = cursor.lastrowid

        return jsonify({"message": "Event created successfully", "event_id": event_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@events_bp.route("/user/<int:user_id>", methods=["GET"])
@login_required
def get_user_events(user_id):
    if user_id != session.get("user_id"):
        return jsonify({"error": "Forbidden"}), 403

    view = request.args.get("view", "month").lower()
    reference_date = request.args.get("date")
    requested_date = parse_iso_datetime(reference_date) if reference_date else datetime.now()

    if not requested_date:
        return jsonify({"error": "Invalid date format. Use ISO format."}), 400

    if view == "day":
        start = datetime(requested_date.year, requested_date.month, requested_date.day)
        end = start + timedelta(days=1)
    elif view == "week":
        start = requested_date - timedelta(days=requested_date.weekday())
        start = datetime(start.year, start.month, start.day)
        end = start + timedelta(days=7)
    else:
        start = datetime(requested_date.year, requested_date.month, 1)
        if requested_date.month == 12:
            end = datetime(requested_date.year + 1, 1, 1)
        else:
            end = datetime(requested_date.year, requested_date.month + 1, 1)

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT id, user_id, title, description, location, start_datetime, end_datetime
            FROM events
            WHERE user_id = %s
              AND start_datetime >= %s
              AND start_datetime < %s
            ORDER BY start_datetime
        """
        cursor.execute(query, (user_id, start, end))
        events = cursor.fetchall()

        return jsonify([serialize_event(event) for event in events]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@events_bp.route("/<int:event_id>", methods=["PUT"])
@login_required
def update_event(event_id):
    data = request.get_json() or {}
    user_id = session.get("user_id")
    title = data.get("title")
    description = data.get("description")
    location = data.get("location")
    start_datetime = data.get("start_datetime")
    end_datetime = data.get("end_datetime")

    start_dt = parse_iso_datetime(start_datetime)
    end_dt = parse_iso_datetime(end_datetime)

    if not title or not start_dt or not end_dt:
        return jsonify({"error": "Missing required fields"}), 400

    if end_dt <= start_dt:
        return jsonify({"error": "End time must be after start time."}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE events
            SET title = %s,
                description = %s,
                location = %s,
                start_datetime = %s,
                end_datetime = %s
            WHERE id = %s AND user_id = %s
            """,
            (title, description, location, start_dt, end_dt, event_id, user_id),
        )
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Event not found"}), 404

        return jsonify({"message": "Event updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@events_bp.route("/<int:event_id>", methods=["DELETE"])
@login_required
def delete_event(event_id):
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            "DELETE FROM events WHERE id = %s AND user_id = %s",
            (event_id, session.get("user_id")),
        )
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Event not found"}), 404

        return jsonify({"message": "Event deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@events_bp.route("/upcoming", methods=["GET"])
@login_required
def get_upcoming_events():
    limit = request.args.get("limit", default=5, type=int)
    if not limit or limit < 1:
        limit = 5
    if limit > 25:
        limit = 25

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id, user_id, title, description, location, start_datetime, end_datetime
            FROM events
            WHERE user_id = %s
              AND end_datetime >= NOW()
            ORDER BY start_datetime ASC
            LIMIT %s
            """,
            (session.get("user_id"), limit),
        )
        events = cursor.fetchall()

        return jsonify([serialize_event(event) for event in events]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
