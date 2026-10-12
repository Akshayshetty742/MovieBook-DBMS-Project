
USE movie_booking_db;

UPDATE shows
SET show_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY)
WHERE show_date < CURDATE();

SELECT show_id, movie_id, screen_id, show_date, show_time, price
FROM shows
ORDER BY show_date, show_time;
