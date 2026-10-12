# MovieBook: System Architecture & Workflows

---

### 1. High-Level System Architecture

The MovieBook system employs a modern 3-tier architecture:

```mermaid
graph TD
    subgraph Client Tier [Presentation Tier - Browser]
        UI[Next.js React Client]
        Components[Movie Cards | Seat Map | Booking Form | My Bookings]
    end

    subgraph Application Tier [Server / API Tier - Next.js App Router]
        Router[Next.js Server Routes]
        API_Movies["/api/movies"]
        API_Shows["/api/shows"]
        API_Seats["/api/seats"]
        API_Bookings["/api/bookings"]
        DB_Pool["lib/db.js (mysql2 connection pool)"]
    end

    subgraph Database Tier [Storage & Engine - MySQL Server]
        MySQL[(movie_booking_db)]
        Tables[(users, movies, shows, seats, bookings, booking_seats, payments)]
        Views[(movie_show_details, booking_summary, payment_report)]
        Triggers[(check_booking_amount)]
    end

    UI --> Router
    Router --> API_Movies
    Router --> API_Shows
    Router --> API_Seats
    Router --> API_Bookings
    API_Movies --> DB_Pool
    API_Shows --> DB_Pool
    API_Seats --> DB_Pool
    API_Bookings --> DB_Pool
    DB_Pool --> MySQL
    MySQL --- Tables
    MySQL --- Views
    MySQL --- Triggers
```

1. **Client Tier**: Single-page application built with React and Next.js (`app/page.js`), styled with pure CSS tokens (`app/globals.css`). It maintains user UI state, manages seat selections, and communicates with backend API routes via `fetch`.
2. **Application Tier**: Next.js App Router API handlers running on Node.js. It manages connection pooling via `mysql2/promise` (`lib/db.js`), sanitizes inputs, enforces server-side business rules, and manages atomic transactions.
3. **Database Tier**: MySQL 8.x storing relational tables, maintaining referential constraints, providing row-level locking (`SELECT ... FOR UPDATE`), and enforcing integrity via foreign keys and triggers.

---

### 2. End-to-End Booking Sequence & Concurrency Control

The sequence diagram below details the entire transactional booking flow, including seat locking, conflict detection, price computation, and payment recording.

```mermaid
sequenceDiagram
    autonumber
    actor Patron as User / Browser
    participant Client as React Client (app/page.js)
    participant API as Bookings API (POST /api/bookings)
    participant DB as MySQL Connection (lib/db.js)

    Patron->>Client: Clicks "Book Now" on movie
    Client->>API: GET /api/shows
    API->>DB: Query shows joined with movie, screen & theatre
    DB-->>API: Returns show list
    API-->>Client: Returns JSON { success: true, shows: [...] }

    Patron->>Client: Selects showtime
    Client->>API: GET /api/seats?show_id={id}
    API->>DB: Query screen seats LEFT JOIN booking_seats (CONFIRMED)
    DB-->>API: Returns seat rows with status ('available'/'booked')
    API-->>Client: Returns JSON { seats: [...] }
    Client->>Patron: Displays interactive Seat Map

    Patron->>Client: Selects seats & clicks "Confirm Booking"
    Note over Client: Enforces max 10 seats limit
    Client->>API: POST /api/bookings { show_id, seat_ids: [...] }

    Note over API: Begins Database Transaction
    API->>DB: connection.beginTransaction()
    API->>DB: SELECT user_id FROM users LIMIT 1
    API->>DB: SELECT screen_id, price FROM shows WHERE show_id = ?
    API->>DB: SELECT seat_id FROM seats WHERE screen_id = ? AND seat_id IN (...) FOR UPDATE
    
    Note over API,DB: Checks for concurrent double-booking
    API->>DB: SELECT bs.seat_id FROM booking_seats bs JOIN bookings b ON bs.booking_id = b.booking_id WHERE bs.show_id = ? AND bs.seat_id IN (...) AND b.booking_status = 'CONFIRMED'
    
    alt If any selected seat is already booked
        DB-->>API: Returns conflicting seat IDs
        API->>DB: connection.rollback()
        API-->>Client: HTTP 409 Conflict: "One or more selected seats are already booked."
        Client->>Patron: Displays error banner & refreshes seat map
    else If all seats are available
        Note over API: Recalculates total = price * seat_count
        API->>DB: INSERT INTO bookings (user_id, show_id, total_amount, 'CONFIRMED')
        API->>DB: INSERT INTO booking_seats (booking_id, show_id, seat_id) [for each seat]
        API->>DB: INSERT INTO payments (booking_id, amount, 'UPI (DEMO)', 'SUCCESS')
        API->>DB: connection.commit()
        DB-->>API: Transaction committed successfully
        API-->>Client: HTTP 201 Created { success: true, booking_id, total_amount }
        Client->>Patron: Displays Confirmation Panel with Booking ID & Seat Summary
        Client->>API: GET /api/bookings (refreshes My Bookings list)
    end
```

---

### 3. Key Defensive Programming Controls

1. **Row-Level Locking (`FOR UPDATE`)**: Prevents race conditions where two simultaneous transactions inspect the seat list before either has inserted a record.
2. **Server-Side Trust Boundary**: Total booking price is computed using the price fetched directly from the database row (`show.price`), completely ignoring any client manipulation.
3. **Foreign Key Screening**: The API checks that every requested `seat_id` physically belongs to the screen linked to the chosen `show_id`, preventing invalid seat injection across screens.
4. **Graceful State Synchronization**: If a conflict occurs (HTTP 409), the client immediately re-fetches the seat map, deselects invalid seats, and notifies the patron without crashing the application.
