@echo off
setlocal

cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo Creating virtual environment...
    python -m venv .venv
)

call ".venv\Scripts\activate"

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Enter MySQL credentials for demo setup:
set /p DB_HOST=DB Host [localhost]:
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_USER=DB User [root]:
if "%DB_USER%"=="" set DB_USER=root

set /p DB_PASSWORD=DB Password:
set /p DB_NAME=DB Name [webcalendar]:
if "%DB_NAME%"=="" set DB_NAME=webcalendar

set SECRET_KEY=dev-secret-key-change-this

echo.
echo Initializing database schema and seed data...
python scripts\setup_demo_db.py --host "%DB_HOST%" --user "%DB_USER%" --password "%DB_PASSWORD%" --database "%DB_NAME%"
if errorlevel 1 (
    echo Database setup failed. Please verify MySQL is running and credentials are correct.
    exit /b 1
)

echo.
echo Starting Flask app at http://127.0.0.1:5000
python app.py
