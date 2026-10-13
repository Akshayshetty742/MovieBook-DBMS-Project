CREATE USER 'moviebook_app'@'localhost'
-- Replace the placeholder below with a unique local password before execution.
IDENTIFIED BY 'REPLACE_WITH_A_UNIQUE_LOCAL_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE
ON movie_booking_db.*
TO 'moviebook_app'@'localhost';