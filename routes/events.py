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
