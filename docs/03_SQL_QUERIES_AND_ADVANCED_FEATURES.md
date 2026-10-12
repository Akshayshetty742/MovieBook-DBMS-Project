# MovieBook: Important SQL Queries & Advanced Features

---

### 1. Core SQL Queries

The following queries represent key operational and reporting requirements implemented and tested in the project (`movie_booking_project.sql`).

#### 1.1 Basic Filtering & Sorting
```sql
-- Query 1: Retrieve all active movies
SELECT movie_id, title, genre, language, duration, release_date
FROM movies
WHERE status = 'ACTIVE';

-- Query 2: Order movies by runtime from longest to shortest
SELECT title, genre, language, duration
FROM movies
ORDER BY duration DESC;
```
*Purpose*: Powers the catalog view and catalog discovery filters on the client interface.

---

#### 1.2 Multi-Table Joins for Scheduling
```sql
-- Query 3: Complete show details joining movies, screens, and theatres
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
JOIN theatres t ON sc.theatre_id = t.theatre_id
ORDER BY s.show_date, s.show_time;
```
*Purpose*: Essential backbone query for `/api/shows`, supplying all necessary schedule metadata for patron selection.

---

#### 1.3 Aggregations, Grouping & Analytical Reports
```sql
-- Query 4: Total bookings per movie (GROUP BY + LEFT JOIN)
SELECT
    m.title,
    COUNT(b.booking_id) AS total_bookings
FROM movies m
JOIN shows s ON m.movie_id = s.movie_id
LEFT JOIN bookings b ON s.show_id = b.show_id
GROUP BY m.movie_id, m.title;

-- Query 5: High-demand movies with more than 1 booking (HAVING filter)
SELECT
    m.title,
    COUNT(b.booking_id) AS total_bookings
FROM movies m
JOIN shows s ON m.movie_id = s.movie_id
JOIN bookings b ON s.show_id = b.show_id
GROUP BY m.movie_id, m.title
HAVING COUNT(b.booking_id) > 1;

-- Query 6: Revenue generation by movie
SELECT
    m.title AS movie_title,
    SUM(b.total_amount) AS total_revenue
FROM movies m
JOIN shows s ON m.movie_id = s.movie_id
JOIN bookings b ON s.show_id = b.show_id
WHERE b.booking_status = 'CONFIRMED'
GROUP BY m.movie_id, m.title
ORDER BY total_revenue DESC;
```
*Purpose*: Management analytics evaluating box-office popularity and total revenue contribution.

---

#### 1.4 Subqueries & Nested Logic
```sql
-- Query 7: Independent subquery to find movies with active shows
SELECT title
FROM movies
WHERE movie_id IN (
    SELECT DISTINCT movie_id
    FROM shows
);

-- Query 8: Nested subquery identifying users who completed confirmed bookings
SELECT name, email
FROM users
WHERE user_id IN (
    SELECT user_id
    FROM bookings
    WHERE booking_status = 'CONFIRMED'
);
```
*Purpose*: Isolates active entities without requiring expensive outer joins.

---

#### 1.5 Seat Allocation & Booking Junction Queries
```sql
-- Query 9: Retrieve seat allocation breakdown per booking
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
ORDER BY bs.booking_id, se.seat_number;
```
*Purpose*: Joins the normalized `booking_seats` associative table with physical `seats` to display reserved seat numbers on tickets.

---

#### 1.6 Payment Instrument Summary
```sql
-- Query 10: Payment instrument distribution and volume
SELECT
    payment_method,
    COUNT(payment_id) AS total_payments,
    SUM(amount) AS total_amount
FROM payments
WHERE payment_status = 'SUCCESS'
GROUP BY payment_method;
```
*Purpose*: Provides financial reconciliation across different payment methods (`UPI`, `CARD`, `UPI (DEMO)`).

---

### 2. Transaction Demonstrations (ACID Properties)

#### 2.1 Successful Transaction (COMMIT)
```sql
START TRANSACTION;

INSERT INTO users (name, email, password_hash, role)
VALUES ('Transaction Test User', 'transaction@test.com', 'test123', 'CUSTOMER');

COMMIT;

-- Verification
SELECT * FROM users WHERE email = 'transaction@test.com';
```
*Explanation*: Data modifications are held in temporary transaction space until `COMMIT` permanently writes the row to the storage engine.

#### 2.2 Aborted Transaction (ROLLBACK)
```sql
START TRANSACTION;

INSERT INTO users (name, email, password_hash, role)
VALUES ('Rollback Test User', 'rollback@test.com', 'test123', 'CUSTOMER');

ROLLBACK;

-- Verification: Returns 0 rows
SELECT * FROM users WHERE email = 'rollback@test.com';
```
*Explanation*: Demonstrates transaction reversibility. Any validation error or connection failure issues a `ROLLBACK`, leaving the database clean and unchanged.
