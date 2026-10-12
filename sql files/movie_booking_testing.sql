CREATE USER 'moviebook_app'@'localhost'
IDENTIFIED BY 'MovieBookApp_2026_Safe';

GRANT SELECT, INSERT, UPDATE, DELETE
ON movie_booking_db.*
TO 'moviebook_app'@'localhost';