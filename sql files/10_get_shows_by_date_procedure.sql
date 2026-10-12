
USE movie_booking_db;

DROP PROCEDURE IF EXISTS GetShowsByDate;

DELIMITER //

CREATE PROCEDURE GetShowsByDate(IN p_show_date DATE)
BEGIN
    SELECT
        s.show_id,
        m.title AS movie_title,
        t.theatre_name,
        s.show_date,
        s.show_time,
        s.price
    FROM shows s
    JOIN movies m ON s.movie_id = m.movie_id
    JOIN screens sc ON s.screen_id = sc.screen_id
    JOIN theatres t ON sc.theatre_id = t.theatre_id
    WHERE s.show_date = p_show_date
    ORDER BY s.show_time;
END //

DELIMITER ;

CALL GetShowsByDate('2026-08-26');
