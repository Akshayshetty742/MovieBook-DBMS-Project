# MovieBook: Movie Ticket Booking Management System
## 01. Project Overview & Requirements

---

### 1. Project Overview
**MovieBook** is a full-stack, database-driven web application designed to simulate an end-to-end cinema ticketing and reservation platform. The system connects an interactive, responsive frontend built with **Next.js (React)** to a normalized **MySQL relational database** via asynchronous server-side API endpoints (`mysql2/promise`).

The system enables users to browse active movies, view scheduled showtimes across various screens and theatres, inspect live seat availability with distinct regular and premium tiers, interactively reserve seats with strict double-booking prevention, and persist bookings through atomic ACID database transactions.

---

### 2. Problem Statement
Traditional box-office ticket counters and primitive booking systems suffer from several common issues:
- **Physical Queuing & Delays**: Customers must wait in long queues at theatre counters without prior visibility into show timings or seat occupancy.
- **Seat Collisions & Overbooking**: Without rigorous transactional database controls, concurrent booking requests can allocate the same physical seat to multiple patrons.
- **Data Fragmentation**: Manual or disjointed record-keeping creates inconsistencies between show scheduling, seat inventories, ticket bookings, and payment reconciliations.
- **Lack of Real-Time Information**: Patrons cannot easily view theatre locations, language/genre classifications, or transparent pricing before purchasing.

---

### 3. Objectives
1. **Automate Cinema Reservations**: Provide a seamless, web-based interface where patrons can discover movies, select theatre showtimes, and book tickets online.
2. **Ensure Relational Data Integrity**: Design a normalized (3NF) relational database schema in MySQL managing users, movies, theatres, screens, seats, shows, bookings, and payments.
3. **Prevent Concurrency Anomalies & Double-Booking**: Utilize MySQL database transactions with row-level locking (`SELECT ... FOR UPDATE`) and constraints to guarantee that a seat can never be simultaneously booked twice for the same show.
4. **Transparent Show & Seat Visibility**: Offer dynamic seat layout maps showing booked versus available seats, seat categories (Regular vs. Premium), and real-time total price calculation.
5. **Demonstrate Advanced Database Concepts**: Implement real-world relational database techniques including foreign key constraints, composite unique indexes, database views, trigger validations, and transactional commits/rollbacks.

---

### 4. Project Scope
#### In-Scope:
- Relational schema modeling across 9 core tables: `users`, `movies`, `theatres`, `screens`, `seats`, `shows`, `bookings`, `booking_seats`, and `payments`.
- Next.js App Router REST API endpoints communicating with MySQL via connection pooling (`lib/db.js`).
- Interactive client-side seat map rendering with live status reflection (`available` vs. `booked`).
- Server-side price calculation and booking validation enforcing maximum 10 seats per booking.
- ACID transaction execution committing records to `bookings`, `booking_seats`, and `payments` synchronously.
- "My Bookings" persistent booking history retrieved with multi-table SQL joins.
- Separate customer registration/login, expiring server-backed sessions, authenticated booking ownership, and a per-customer Watchlist.
- Neo4j graph-based similar-movie recommendations and device-local recently viewed movie IDs.
- Demonstration of SQL views, composite indexing, and database triggers.

#### Out-of-Scope (College Project Simulation Boundaries):
- Live banking/credit card payment gateway integration (simulated UPI/Card payment recording is implemented for academic evaluation).
- JWT/OAuth authentication and administrator/theatre-manager workflows. Customer login uses database-backed sessions and scrypt password hashes; there is no default authenticated demo-user context.
- Real-time WebSockets / push notifications (polling and optimistic updates on refresh are utilized).

---

### 5. Requirements Specification

#### 5.1 Functional Requirements (FR)
- **FR1: Movie Catalog Display**: The system retrieves and displays active movie metadata available in MySQL, including title, genre, language, duration, and release date. Ratings and synopsis text are not stored or shown.
- **FR2: Show Scheduling Filter**: The system must allow users to view available shows filtered by the chosen movie, showing the theatre name, date, time, and ticket price.
- **FR3: Live Seat Map Inspection**: When a show is chosen, the system must retrieve the screen's seat inventory and clearly mark seats as available or booked based on confirmed bookings.
- **FR4: Interactive Seat Selection**: The user must be able to select and deselect up to 10 available seats, updating the total booking amount dynamically.
- **FR5: Server-Side Booking Validation**: The server must verify that candidate seats belong to the selected show's screen and are not already booked under any confirmed booking.
- **FR6: Atomic Transaction Processing**: Bookings must only succeed if records in `bookings`, `booking_seats`, and `payments` are committed together. Any error must trigger an immediate rollback.
- **FR7: Persistent Booking History ("My Bookings")**: Confirmed bookings must be permanently stored in MySQL and displayed with joined movie, theatre, date, time, and seat details.
- **FR8: Customer Authentication and Ownership**: Registration/login establish a server-validated, expiring session; private booking history and Watchlist operations are scoped to the authenticated customer.
- **FR9: Movie Watchlist and Recommendations**: Signed-in customers can add, list, and remove saved movies; similar-movie suggestions are queried from Neo4j and may be unavailable when that service is offline.

#### 5.2 Non-Functional Requirements (NFR)
- **NFR1: Consistency & Atomicity**: The system must adhere strictly to ACID properties so that partial bookings are never persisted.
- **NFR2: Performance & Indexing**: Database indexes must optimize high-frequency lookups such as `(show_date, show_time)` and `(user_id)`.
- **NFR3: Responsiveness & Usability**: The web interface must be clean, responsive, and provide visual feedback for loading states, booked seats, and error banners.
- **NFR4: Data Security & Server Trust**: The backend must never trust client-supplied total prices or arbitrary user IDs; all totals must be recomputed on the server.
