import os

from flask import Flask, redirect, render_template, url_for
from routes.auth import auth_bp, login_required
from routes.events import events_bp


app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key-change-this")

app.register_blueprint(auth_bp)
app.register_blueprint(events_bp, url_prefix="/events")


@app.route("/")
def home():
    return render_template("home.html")


@app.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html")


@app.route("/calendar")
@login_required
def calendar():
    return redirect(url_for("dashboard"))


if __name__ == "__main__":
    app.run(debug=True)
