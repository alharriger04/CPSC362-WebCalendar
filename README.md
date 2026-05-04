# CPSC362-WebCalendar
Project repository for the WebCalendar project, a part of CPSC 362 introduction to software engineering. 

Team Members: Andrew Harriger (alharriger@csu.fullerton.edu), Raymond Hernandez (Raymondher14@csu.fullerton.edu), Christopher Hernandez (christopherher@csu.fullerton.edu)

Our calendar MUST have:

User login/register

Create event

Edit event

Delete event

View events by day/week/month

Store events in database

## Quick Demo Setup (Windows CMD)

From the project root, run:

```cmd
demo_start.cmd
```

What this does:
- Creates `.venv` if needed
- Installs requirements
- Prompts for MySQL credentials
- Creates/initializes `webcalendar` from `database/Database.sql`
- Starts Flask app at `http://127.0.0.1:5000`

If you prefer manual startup after setup, use:

```cmd
python scripts\setup_demo_db.py --host localhost --user root --password YOUR_PASSWORD --database webcalendar
python app.py
```
