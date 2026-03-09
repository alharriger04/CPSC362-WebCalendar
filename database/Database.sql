-- =========================================================
-- CPSC362 WebCalendar
-- DDL + Seed Data + Triggers + Views
-- =========================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS v_events_this_month;
DROP VIEW IF EXISTS v_events_this_week;
DROP VIEW IF EXISTS v_events_today;
DROP VIEW IF EXISTS v_event_details;

DROP TRIGGER IF EXISTS trg_events_before_insert;
DROP TRIGGER IF EXISTS trg_events_before_update;

DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- TABLES
-- =========================================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(150),
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_events_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_title_not_blank
        CHECK (CHAR_LENGTH(TRIM(title)) > 0),

    CONSTRAINT chk_event_time_order
        CHECK (end_datetime > start_datetime)
);

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_start_datetime ON events(start_datetime);
CREATE INDEX idx_events_user_start ON events(user_id, start_datetime);

-- =========================================================
-- TRIGGERS
-- =========================================================

DELIMITER $$

CREATE TRIGGER trg_events_before_insert
BEFORE INSERT ON events
FOR EACH ROW
BEGIN
    -- normalize blank strings
    SET NEW.title = TRIM(NEW.title);

    IF NEW.description IS NOT NULL AND TRIM(NEW.description) = '' THEN
        SET NEW.description = NULL;
    END IF;

    IF NEW.location IS NOT NULL AND TRIM(NEW.location) = '' THEN
        SET NEW.location = NULL;
    END IF;

    -- validation
    IF NEW.title IS NULL OR CHAR_LENGTH(NEW.title) = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Event title cannot be empty.';
    END IF;

    IF NEW.end_datetime <= NEW.start_datetime THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Event end time must be after start time.';
    END IF;
END$$

CREATE TRIGGER trg_events_before_update
BEFORE UPDATE ON events
FOR EACH ROW
BEGIN
    -- normalize blank strings
    SET NEW.title = TRIM(NEW.title);

    IF NEW.description IS NOT NULL AND TRIM(NEW.description) = '' THEN
        SET NEW.description = NULL;
    END IF;

    IF NEW.location IS NOT NULL AND TRIM(NEW.location) = '' THEN
        SET NEW.location = NULL;
    END IF;

    -- validation
    IF NEW.title IS NULL OR CHAR_LENGTH(NEW.title) = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Event title cannot be empty.';
    END IF;

    IF NEW.end_datetime <= NEW.start_datetime THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Event end time must be after start time.';
    END IF;
END$$

DELIMITER ;

-- =========================================================
-- SEED DATA
-- NOTE: password values are placeholders for testing.
-- =========================================================

INSERT INTO users (username, email, password) VALUES
('andrew', 'andrew@example.com', 'andrewpassword'),
('raymond', 'raymond@example.com', 'raymondpassword'),
('christopher', 'christopher@example.com', 'christopherpassword');

INSERT INTO events (user_id, title, description, location, start_datetime, end_datetime) VALUES
(1, 'Team Kickoff Meeting',
 'Initial project planning meeting for the WebCalendar app.',
 'Library',
 '2026-03-09 10:00:00',
 '2026-03-09 11:00:00'),

(1, 'Database Design Review',
 'Review tables, foreign keys, triggers, and views.',
 'Zoom',
 '2026-03-10 14:00:00',
 '2026-03-10 15:30:00'),

(1, 'Professor Office Hours',
 'Ask questions about project requirements and milestones.',
 'CS Building Office 310',
 '2026-03-12 13:00:00',
 '2026-03-12 13:30:00'),

(2, 'Frontend Sprint Planning',
 'Plan UI work for day, week, and month calendar screens.',
 'Library Study Room A',
 '2026-03-11 09:00:00',
 '2026-03-11 10:00:00'),

(2, 'UI Demo',
 'Show login, registration, and event creation page progress.',
 'Discord Call',
 '2026-03-13 16:00:00',
 '2026-03-13 17:00:00'),

(3, 'Testing Session',
 'Manual testing for create, edit, and delete event flows.',
 'Computer Lab 4',
 '2026-03-14 12:00:00',
 '2026-03-14 14:00:00'),

(3, 'Weekly Team Sync',
 'Weekly project status check-in.',
 'Zoom',
 '2026-03-15 18:00:00',
 '2026-03-15 18:45:00');

-- =========================================================
-- VIEWS
-- =========================================================

-- General joined view for application reads
CREATE VIEW v_event_details AS
SELECT
    e.id AS event_id,
    e.user_id,
    u.username,
    u.email,
    e.title,
    e.description,
    e.location,
    e.start_datetime,
    e.end_datetime,
    TIMESTAMPDIFF(MINUTE, e.start_datetime, e.end_datetime) AS duration_minutes,
    e.created_at,
    e.updated_at
FROM events e
JOIN users u
    ON e.user_id = u.id;

-- Events occurring today
CREATE VIEW v_events_today AS
SELECT *
FROM v_event_details
WHERE DATE(start_datetime) = CURDATE();

-- Events occurring this week (Monday through Sunday)
CREATE VIEW v_events_this_week AS
SELECT *
FROM v_event_details
WHERE YEARWEEK(start_datetime, 1) = YEARWEEK(CURDATE(), 1);

-- Events occurring this month
CREATE VIEW v_events_this_month AS
SELECT *
FROM v_event_details
WHERE YEAR(start_datetime) = YEAR(CURDATE())
  AND MONTH(start_datetime) = MONTH(CURDATE());

-- =========================================================
-- TEST QUERIES
-- =========================================================
-- SELECT * FROM v_event_details ORDER BY start_datetime;
-- SELECT * FROM v_events_today ORDER BY start_datetime;
-- SELECT * FROM v_events_this_week ORDER BY start_datetime;
-- SELECT * FROM v_events_this_month ORDER BY start_datetime;
