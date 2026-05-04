import argparse
import pathlib
import sys

import mysql.connector


def split_sql_statements(sql_text):
    statements = []
    delimiter = ";"
    current = []

    for raw_line in sql_text.splitlines():
        line = raw_line.rstrip("\n")
        stripped = line.strip()

        if not stripped or stripped.startswith("--"):
            continue

        upper = stripped.upper()
        if upper.startswith("DELIMITER "):
            delimiter = stripped.split(None, 1)[1]
            continue

        current.append(line)
        chunk = "\n".join(current)

        if chunk.endswith(delimiter):
            statement = chunk[: -len(delimiter)].strip()
            if statement:
                statements.append(statement)
            current = []

    trailing = "\n".join(current).strip()
    if trailing:
        statements.append(trailing)

    return statements


def ensure_database(host, user, password, database):
    conn = mysql.connector.connect(host=host, user=user, password=password)
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{database}`")
    conn.commit()
    cursor.close()
    conn.close()


def run_sql_file(host, user, password, database, sql_path):
    sql_text = sql_path.read_text(encoding="utf-8")
    statements = split_sql_statements(sql_text)

    conn = mysql.connector.connect(
        host=host,
        user=user,
        password=password,
        database=database,
    )
    cursor = conn.cursor()

    for statement in statements:
        cursor.execute(statement)

    conn.commit()
    cursor.close()
    conn.close()


def main():
    parser = argparse.ArgumentParser(description="Initialize WebCalendar demo database.")
    parser.add_argument("--host", default="localhost")
    parser.add_argument("--user", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--database", default="webcalendar")
    parser.add_argument(
        "--sql-file",
        default=str(pathlib.Path("database") / "Database.sql"),
        help="Path to SQL schema file.",
    )
    args = parser.parse_args()

    sql_path = pathlib.Path(args.sql_file)
    if not sql_path.exists():
        print(f"SQL file not found: {sql_path}")
        return 1

    try:
        ensure_database(args.host, args.user, args.password, args.database)
        run_sql_file(args.host, args.user, args.password, args.database, sql_path)
    except mysql.connector.Error as error:
        print(f"Database setup failed: {error}")
        return 1

    print("Database setup complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
