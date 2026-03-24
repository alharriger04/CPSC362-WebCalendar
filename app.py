from routes.events import events_bp
from flask import Flask, render_template


app = Flask(__name__)

app.register_blueprint(events_bp, url_prefix="/events")

@app.route("/")
def home():
    return render_template("home.html")


@app.route("/login")
def login():
    return render_template("login.html")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


@app.route("/calendar")
def calendar():
    return render_template("calendar.html")


if __name__ == "__main__":
    app.run(debug=True)
