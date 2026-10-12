
USE movie_booking_db;

CREATE INDEX idx_shows_date_time
ON shows (show_date, show_time);

SHOW INDEX FROM shows;
