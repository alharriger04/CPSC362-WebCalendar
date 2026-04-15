# This file handles login, logout, registration,
# and user session management

# This file handles login, logout, registration,
# and user session management

import os
from functools import wraps

import mysql.connector
from flask import Blueprint, flash, redirect, render_template, request, session, url_for
from werkzeug.security import check_password_hash, generate_password_hash


auth_bp = Blueprint("auth", __name__)


def get_db_connection():
    return mysql.connector.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        user=os.environ.get("DB_USER", "root"),
        password=os.environ.get("DB_PASSWORD", "your_password"),
        database=os.environ.get("DB_NAME", "webcalendar"),
    )


def login_required(view_func):
    @wraps(view_func)
    def wrapped_view(*args, **kwargs):
        if "user_id" not in session:
            flash("Please log in first.", "error")
            return redirect(url_for("auth.login"))

        return view_func(*args, **kwargs)

    return wrapped_view


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")

    username_or_email = request.form.get("username_or_email", "").strip()
    password = request.form.get("password", "")

    if not username_or_email or not password:
        flash("Enter your username or email and password.", "error")
        return redirect(url_for("auth.login"))

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id, username, email, password
            FROM users
            WHERE username = %s OR email = %s
            LIMIT 1
            """,
            (username_or_email, username_or_email),
        )

        user = cursor.fetchone()

        valid_password = False

        if user:
            stored_password = user["password"]

            valid_password = check_password_hash(stored_password, password)

            # Allows existing seed users with plain-text passwords to log in.
            # After login, the password is upgraded to a hashed password.
            if not valid_password and stored_password == password:
                valid_password = True

                cursor.execute(
                    "UPDATE users SET password = %s WHERE id = %s",
                    (generate_password_hash(password), user["id"]),
                )

                conn.commit()

        if not user or not valid_password:
            flash("Invalid username/email or password.", "error")
            return redirect(url_for("auth.login"))

        session.clear()
        session["user_id"] = user["id"]
        session["username"] = user["username"]
        session["email"] = user["email"]

        flash("Logged in successfully.", "success")
        return redirect(url_for("dashboard"))

    except Exception as error:
        flash(f"Login failed: {error}", "error")
        return redirect(url_for("auth.login"))

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


@auth_bp.route("/register", methods=["POST"])
def register():
    username = request.form.get("username", "").strip()
    email = request.form.get("email", "").strip().lower()
    password = request.form.get("password", "")
    confirm_password = request.form.get("confirm_password", "")

    if not username or not email or not password:
        flash("Username, email, and password are required.", "error")
        return redirect(url_for("auth.login"))

    if password != confirm_password:
        flash("Passwords do not match.", "error")
        return redirect(url_for("auth.login"))

    if len(password) < 6:
        flash("Password must be at least 6 characters.", "error")
        return redirect(url_for("auth.login"))

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO users (username, email, password)
            VALUES (%s, %s, %s)
            """,
            (username, email, generate_password_hash(password)),
        )

        conn.commit()

        flash("Account created. You can log in now.", "success")
        return redirect(url_for("auth.login"))

    except mysql.connector.IntegrityError:
        flash("That username or email is already in use.", "error")
        return redirect(url_for("auth.login"))

    except Exception as error:
        flash(f"Registration failed: {error}", "error")
        return redirect(url_for("auth.login"))

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


@auth_bp.route("/logout")
def logout():
    session.clear()
    flash("Logged out successfully.", "success")
    return redirect(url_for("home"))
