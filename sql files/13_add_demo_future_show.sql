USE movie_booking_db;

-- Add one clearly identified demo show without changing existing schedules,
-- bookings, seat records, or payment records. Safe to run more than once.
INSERT INTO shows (movie_id, screen_id, show_date, show_time, price)
SELECT
    m.movie_id,
    sc.screen_id,
    DATE_ADD(CURDATE(), INTERVAL 1 DAY),
    '23:00:00',
    150.00
FROM movies m
JOIN screens sc ON sc.screen_name = 'Screen 1'
JOIN theatres t ON t.theatre_id = sc.theatre_id
WHERE m.title = 'Sky Warriors'
  AND m.status = 'ACTIVE'
  AND t.theatre_name = 'CineMax Central'
  AND NOT EXISTS (
      SELECT 1
      FROM shows existing
      WHERE existing.screen_id = sc.screen_id
        AND existing.show_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        AND existing.show_time = '23:00:00'
  )
LIMIT 1;

SELECT
    s.show_id,
    m.title AS movie_title,
    t.theatre_name,
    sc.screen_name,
    s.show_date,
    s.show_time,
    s.price
FROM shows s
JOIN movies m ON m.movie_id = s.movie_id
JOIN screens sc ON sc.screen_id = s.screen_id
JOIN theatres t ON t.theatre_id = sc.theatre_id
WHERE m.title = 'Sky Warriors'
  AND t.theatre_name = 'CineMax Central'
  AND sc.screen_name = 'Screen 1'
  AND s.show_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
  AND s.show_time = '23:00:00';
