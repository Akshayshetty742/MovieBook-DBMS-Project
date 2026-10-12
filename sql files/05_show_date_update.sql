USE movie_booking_db;

SELECT
    show_id,
    show_date,
    CURDATE() AS today,
    CASE
        WHEN show_date < CURDATE() THEN 'PAST'
        ELSE 'UPCOMING'
    END AS show_status
FROM shows
ORDER BY show_date;