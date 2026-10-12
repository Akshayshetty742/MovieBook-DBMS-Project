USE movie_booking_db;
SELECT * FROM users;
SELECT * FROM movies;
SELECT * FROM theatres;
SELECT * FROM screens;
SELECT * FROM seats;
SELECT * FROM shows;
SELECT * FROM bookings;
SELECT * FROM booking_seats;
SELECT * FROM payments;
USE movie_booking_db;

-- 1. USERS
INSERT INTO users (name, email, password_hash, role) VALUES
('Akshay Kumar', 'akshay@example.com', 'hashed_password_1', 'CUSTOMER'),
('Priya Sharma', 'priya@example.com', 'hashed_password_2', 'CUSTOMER'),
('Rahul Verma', 'rahul@example.com', 'hashed_password_3', 'CUSTOMER'),
('Sneha Reddy', 'sneha@example.com', 'hashed_password_4', 'CUSTOMER'),
('Admin User', 'admin@moviebooking.com', 'hashed_admin_password', 'ADMIN');

-- 2. MOVIES
INSERT INTO movies (title, genre, language, duration, release_date, status) VALUES
('Sky Warriors', 'Action', 'English', 135, '2026-07-10', 'ACTIVE'),
('Love Beyond Time', 'Romance', 'Hindi', 145, '2026-07-18', 'ACTIVE'),
('The Silent Case', 'Thriller', 'Kannada', 120, '2026-08-01', 'ACTIVE'),
('Galaxy Quest', 'Science Fiction', 'English', 155, '2026-08-05', 'ACTIVE'),
('Old Memories', 'Drama', 'Tamil', 130, '2025-12-20', 'INACTIVE');

-- 3. THEATRES
INSERT INTO theatres (theatre_name, location) VALUES
('CineMax Central', 'Bengaluru'),
('Star Cinemas', 'Mysuru'),
('Metro Movies', 'Hubballi');

SELECT * FROM users;
SELECT * FROM movies;
SELECT * FROM theatres;

USE movie_booking_db;

-- Insert screens
INSERT INTO screens (theatre_id, screen_name, total_seats) VALUES
(1, 'Screen 1', 10),
(1, 'Screen 2', 10),
(2, 'Screen 1', 10),
(3, 'Screen 1', 10);


-- Insert seats for Screen 1 of CineMax Central
INSERT INTO seats (screen_id, seat_number, seat_type) VALUES
(1, 'A1', 'REGULAR'),
(1, 'A2', 'REGULAR'),
(1, 'A3', 'REGULAR'),
(1, 'A4', 'REGULAR'),
(1, 'A5', 'REGULAR'),
(1, 'B1', 'PREMIUM'),
(1, 'B2', 'PREMIUM'),
(1, 'B3', 'PREMIUM'),
(1, 'B4', 'PREMIUM'),
(1, 'B5', 'PREMIUM');


-- Insert seats for Screen 2 of CineMax Central
INSERT INTO seats (screen_id, seat_number, seat_type) VALUES
(2, 'A1', 'REGULAR'),
(2, 'A2', 'REGULAR'),
(2, 'A3', 'REGULAR'),
(2, 'A4', 'REGULAR'),
(2, 'A5', 'REGULAR'),
(2, 'B1', 'PREMIUM'),
(2, 'B2', 'PREMIUM'),
(2, 'B3', 'PREMIUM'),
(2, 'B4', 'PREMIUM'),
(2, 'B5', 'PREMIUM');


-- Insert seats for Star Cinemas Screen 1
INSERT INTO seats (screen_id, seat_number, seat_type) VALUES
(3, 'A1', 'REGULAR'),
(3, 'A2', 'REGULAR'),
(3, 'A3', 'REGULAR'),
(3, 'A4', 'REGULAR'),
(3, 'A5', 'REGULAR'),
(3, 'B1', 'PREMIUM'),
(3, 'B2', 'PREMIUM'),
(3, 'B3', 'PREMIUM'),
(3, 'B4', 'PREMIUM'),
(3, 'B5', 'PREMIUM');


-- Insert seats for Metro Movies Screen 1
INSERT INTO seats (screen_id, seat_number, seat_type) VALUES
(4, 'A1', 'REGULAR'),
(4, 'A2', 'REGULAR'),
(4, 'A3', 'REGULAR'),
(4, 'A4', 'REGULAR'),
(4, 'A5', 'REGULAR'),
(4, 'B1', 'PREMIUM'),
(4, 'B2', 'PREMIUM'),
(4, 'B3', 'PREMIUM'),
(4, 'B4', 'PREMIUM'),
(4, 'B5', 'PREMIUM');

SELECT * FROM screens;
SELECT * FROM seats;

USE movie_booking_db;

-- Insert shows
INSERT INTO shows (movie_id, screen_id, show_date, show_time, price) VALUES

-- Screen 1: CineMax Central
(1, 1, '2026-08-26', '10:00:00', 150.00),
(2, 1, '2026-08-26', '14:00:00', 180.00),
(3, 1, '2026-08-26', '18:00:00', 200.00),

-- Screen 2: CineMax Central
(4, 2, '2026-08-26', '11:00:00', 220.00),
(1, 2, '2026-08-26', '16:00:00', 150.00),

-- Star Cinemas
(2, 3, '2026-08-26', '12:00:00', 180.00),
(3, 3, '2026-08-26', '17:00:00', 200.00),

-- Metro Movies
(4, 4, '2026-08-26', '13:00:00', 220.00),
(1, 4, '2026-08-26', '19:00:00', 150.00),

-- Shows on another date
(2, 1, '2026-08-27', '10:00:00', 180.00),
(4, 2, '2026-08-27', '18:00:00', 220.00),
(3, 3, '2026-08-27', '15:00:00', 200.00);

SELECT * FROM shows;

USE movie_booking_db;

-- Insert bookings
INSERT INTO bookings
(user_id, show_id, total_amount, booking_status)
VALUES
(1, 1, 300.00, 'CONFIRMED'),
(2, 1, 150.00, 'CONFIRMED'),
(3, 2, 360.00, 'CONFIRMED'),
(1, 3, 200.00, 'CONFIRMED'),
(4, 4, 440.00, 'CONFIRMED'),
(2, 5, 300.00, 'CONFIRMED'),
(3, 6, 180.00, 'CONFIRMED'),
(4, 7, 400.00, 'CONFIRMED'),
(1, 8, 220.00, 'CONFIRMED'),
(2, 9, 150.00, 'CANCELLED');


USE movie_booking_db;

INSERT INTO booking_seats (booking_id, show_id, seat_id) VALUES

-- Booking 1: Show 1, 2 seats
(1, 1, 1),
(1, 1, 2),

-- Booking 2: Show 1, 1 seat
(2, 1, 3),

-- Booking 3: Show 2, 2 seats
(3, 2, 4),
(3, 2, 5),

-- Booking 4: Show 3, 1 seat
(4, 3, 6),

-- Booking 5: Show 4, 2 seats
(5, 4, 11),
(5, 4, 12),

-- Booking 6: Show 5, 2 seats
(6, 5, 13),
(6, 5, 14),

-- Booking 7: Show 6, 1 seat
(7, 6, 21),

-- Booking 8: Show 7, 2 seats
(8, 7, 22),
(8, 7, 23),

-- Booking 9: Show 8, 1 seat
(9, 8, 31),

-- Booking 10: Show 9, 1 seat
(10, 9, 32);


USE movie_booking_db;

INSERT INTO payments
(booking_id, amount, payment_method, payment_status)
VALUES
(1, 300.00, 'UPI', 'SUCCESS'),
(2, 150.00, 'CARD', 'SUCCESS'),
(3, 360.00, 'UPI', 'SUCCESS'),
(4, 200.00, 'CASH', 'SUCCESS'),
(5, 440.00, 'CARD', 'SUCCESS'),
(6, 300.00, 'UPI', 'SUCCESS'),
(7, 180.00, 'CARD', 'SUCCESS'),
(8, 400.00, 'UPI', 'SUCCESS'),
(9, 220.00, 'CARD', 'SUCCESS'),
(10, 150.00, 'UPI', 'FAILED');

SELECT * FROM payments;


USE movie_booking_db;

-- =====================================================
-- STEP 3.1: IMPORTANT SQL QUERIES
-- =====================================================


-- 1. BASIC SELECT + WHERE
-- Find all active movies
SELECT *
FROM movies
WHERE status = 'ACTIVE';


-- 2. ORDER BY
-- Show movies from longest duration to shortest
SELECT title, genre, language, duration
FROM movies
ORDER BY duration DESC;


-- 3. JOIN QUERY
-- Display complete show details with movie, screen and theatre
SELECT
    s.show_id,
    m.title AS movie_title,
    s.show_date,
    s.show_time,
    sc.screen_name,
    t.theatre_name,
    t.location,
    s.price
FROM shows s
JOIN movies m ON s.movie_id = m.movie_id
JOIN screens sc ON s.screen_id = sc.screen_id
JOIN theatres t ON sc.theatre_id = t.theatre_id;


-- 4. AGGREGATE FUNCTION + GROUP BY
-- Find total bookings for each movie
SELECT
    m.title,
    COUNT(b.booking_id) AS total_bookings
FROM movies m
JOIN shows s ON m.movie_id = s.movie_id
LEFT JOIN bookings b ON s.show_id = b.show_id
GROUP BY m.movie_id, m.title;


-- 5. HAVING
-- Show movies that have more than 1 booking
SELECT
    m.title,
    COUNT(b.booking_id) AS total_bookings
FROM movies m
JOIN shows s ON m.movie_id = s.movie_id
JOIN bookings b ON s.show_id = b.show_id
GROUP BY m.movie_id, m.title
HAVING COUNT(b.booking_id) > 1;


-- 6. SUBQUERY
-- Find movies that have at least one show
SELECT title
FROM movies
WHERE movie_id IN (
    SELECT movie_id
    FROM shows
);


-- 7. UPDATE
-- Demonstration: change an inactive movie to ACTIVE
UPDATE movies
SET status = 'ACTIVE'
WHERE movie_id = 5;

-- Check the updated record
SELECT *
FROM movies
WHERE movie_id = 5;


-- Restore it back to INACTIVE for our sample data
UPDATE movies
SET status = 'INACTIVE'
WHERE movie_id = 5;


-- 8. DELETE DEMONSTRATION
-- Create a temporary test user
INSERT INTO users (name, email, password_hash, role)
VALUES ('Test User', 'testuser@example.com', 'test_password', 'CUSTOMER');

-- Check the test user
SELECT *
FROM users
WHERE email = 'testuser@example.com';

-- Delete the test user
DELETE FROM users
WHERE email = 'testuser@example.com';

-- Verify deletion
SELECT *
FROM users
WHERE email = 'testuser@example.com';


-- 9. MULTI-TABLE JOIN
-- Display booking details with customer, movie and show information
SELECT
    b.booking_id,
    u.name AS customer_name,
    m.title AS movie_title,
    s.show_date,
    s.show_time,
    b.total_amount,
    b.booking_status
FROM bookings b
JOIN users u ON b.user_id = u.user_id
JOIN shows s ON b.show_id = s.show_id
JOIN movies m ON s.movie_id = m.movie_id;


-- 10. TOTAL REVENUE BY MOVIE
SELECT
    m.title AS movie_title,
    SUM(b.total_amount) AS total_revenue
FROM movies m
JOIN shows s ON m.movie_id = s.movie_id
JOIN bookings b ON s.show_id = b.show_id
WHERE b.booking_status = 'CONFIRMED'
GROUP BY m.movie_id, m.title
ORDER BY total_revenue DESC;


-- 11. COUNT BOOKINGS BY CUSTOMER
SELECT
    u.name AS customer_name,
    COUNT(b.booking_id) AS total_bookings
FROM users u
LEFT JOIN bookings b ON u.user_id = b.user_id
GROUP BY u.user_id, u.name
ORDER BY total_bookings DESC;


-- 12. PAYMENT SUMMARY
SELECT
    payment_method,
    COUNT(payment_id) AS total_payments,
    SUM(amount) AS total_amount
FROM payments
WHERE payment_status = 'SUCCESS'
GROUP BY payment_method;


-- 13. NESTED SUBQUERY
-- Find customers who have made at least one booking
SELECT name, email
FROM users
WHERE user_id IN (
    SELECT user_id
    FROM bookings
    WHERE booking_status = 'CONFIRMED'
);


-- 14. SEAT BOOKING DETAILS
SELECT
    bs.booking_seat_id,
    bs.booking_id,
    m.title AS movie_title,
    s.show_date,
    s.show_time,
    se.seat_number,
    se.seat_type
FROM booking_seats bs
JOIN bookings b ON bs.booking_id = b.booking_id
JOIN shows s ON bs.show_id = s.show_id
JOIN movies m ON s.movie_id = m.movie_id
JOIN seats se ON bs.seat_id = se.seat_id
ORDER BY bs.booking_id;


USE movie_booking_db;

-- =====================================================
-- STEP 3.2: VIEWS
-- =====================================================


-- 1. VIEW: Complete movie show details
CREATE OR REPLACE VIEW movie_show_details AS
SELECT
    s.show_id,
    m.title AS movie_title,
    m.genre,
    m.language,
    s.show_date,
    s.show_time,
    s.price,
    sc.screen_name,
    t.theatre_name,
    t.location
FROM shows s
JOIN movies m ON s.movie_id = m.movie_id
JOIN screens sc ON s.screen_id = sc.screen_id
JOIN theatres t ON sc.theatre_id = t.theatre_id;


-- 2. VIEW: Complete booking summary
CREATE OR REPLACE VIEW booking_summary AS
SELECT
    b.booking_id,
    u.name AS customer_name,
    u.email,
    m.title AS movie_title,
    s.show_date,
    s.show_time,
    t.theatre_name,
    b.total_amount,
    b.booking_status
FROM bookings b
JOIN users u ON b.user_id = u.user_id
JOIN shows s ON b.show_id = s.show_id
JOIN movies m ON s.movie_id = m.movie_id
JOIN screens sc ON s.screen_id = sc.screen_id
JOIN theatres t ON sc.theatre_id = t.theatre_id;


-- 3. VIEW: Payment report
CREATE OR REPLACE VIEW payment_report AS
SELECT
    p.payment_id,
    p.booking_id,
    u.name AS customer_name,
    m.title AS movie_title,
    p.amount,
    p.payment_method,
    p.payment_status,
    p.payment_date
FROM payments p
JOIN bookings b ON p.booking_id = b.booking_id
JOIN users u ON b.user_id = u.user_id
JOIN shows s ON b.show_id = s.show_id
JOIN movies m ON s.movie_id = m.movie_id;


-- =====================================================
-- VERIFY THE VIEWS
-- =====================================================

SELECT * FROM movie_show_details;

SELECT * FROM booking_summary;

SELECT * FROM payment_report;


USE movie_booking_db;

-- =====================================================
-- STEP 3.3: INDEXES
-- =====================================================

-- 1. Index for searching movies by title
CREATE INDEX idx_movie_title
ON movies(title);

-- 2. Index for finding shows by movie
CREATE INDEX idx_show_movie
ON shows(movie_id);

-- 3. Index for finding bookings of a user
CREATE INDEX idx_booking_user
ON bookings(user_id);

-- 4. Index for finding bookings for a show
CREATE INDEX idx_booking_show
ON bookings(show_id);

-- 5. Index for payment status searches
CREATE INDEX idx_payment_status
ON payments(payment_status);


-- =====================================================
-- VERIFY INDEXES
-- =====================================================

SHOW INDEX FROM movies;

SHOW INDEX FROM shows;

SHOW INDEX FROM bookings;

SHOW INDEX FROM payments;



USE movie_booking_db;

-- =====================================================
-- STEP 3.5: TRIGGER
-- Prevent negative or zero booking amounts
-- =====================================================

DROP TRIGGER IF EXISTS check_booking_amount;

DELIMITER //

CREATE TRIGGER check_booking_amount
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
    IF NEW.total_amount <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Booking amount must be greater than zero';
    END IF;
END //

DELIMITER ;

-- =====================================================
-- VERIFY THE TRIGGER
-- =====================================================

SHOW TRIGGERS;


USE movie_booking_db;

-- =====================================================
-- STEP 3.6: TRANSACTION WITH COMMIT
-- =====================================================

START TRANSACTION;

INSERT INTO users (name, email, password_hash, role)
VALUES ('Transaction Test User', 'transaction@test.com', 'test123', 'CUSTOMER');

COMMIT;

-- Verify COMMIT
SELECT * 
FROM users
WHERE email = 'transaction@test.com';


-- =====================================================
-- TRANSACTION WITH ROLLBACK
-- =====================================================

START TRANSACTION;

INSERT INTO users (name, email, password_hash, role)
VALUES ('Rollback Test User', 'rollback@test.com', 'test123', 'CUSTOMER');

ROLLBACK;

-- Verify ROLLBACK
SELECT *
FROM users
WHERE email = 'rollback@test.com';
