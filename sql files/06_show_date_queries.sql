USE movie_booking_db;

SELECT DATABASE() AS current_database;

SELECT
    ROW_COUNT() AS previous_statement_rows_affected;

SELECT
    COUNT(*) AS past_shows
FROM shows
WHERE show_date < CURDATE();

UPDATE movie_booking_db.shows
SET show_date = '2026-10-16'
WHERE show_date < '2026-10-09';