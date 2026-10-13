# MovieBook: Database Design & Data Dictionary

---

### 1. Entity-Relationship (ER) Diagram

The following Mermaid diagram describes the nine-table core relational model and the two additive authentication/Watchlist tables used by the application. The repository does **not** include a base `CREATE DATABASE`/`CREATE TABLE` script: `sql files/movie_booking_project.sql` assumes the core schema already exists and supplies sample data, queries, indexes, views, and a trigger. Create/verify the core tables before running it.

```mermaid
erDiagram
    THEATRES ||--o{ SCREENS : "contains"
    SCREENS ||--o{ SEATS : "has"
    SCREENS ||--o{ SHOWS : "hosts"
    MOVIES ||--o{ SHOWS : "scheduled_in"
    USERS ||--o{ BOOKINGS : "places"
    USERS ||--o{ USER_SESSIONS : "has"
    USERS ||--o{ MOVIE_WATCHLIST : "saves"
    MOVIES ||--o{ MOVIE_WATCHLIST : "saved_by"
    SHOWS ||--o{ BOOKINGS : "booked_for"
    BOOKINGS ||--|{ BOOKING_SEATS : "includes"
    SEATS ||--o{ BOOKING_SEATS : "reserved_in"
    SHOWS ||--o{ BOOKING_SEATS : "associated_with"
    BOOKINGS ||--o| PAYMENTS : "paid_via"

    USERS {
        int user_id PK
        varchar name
        varchar email UK
        varchar password_hash
        varchar role
        timestamp created_at
    }

    MOVIES {
        int movie_id PK
        varchar title
        varchar genre
        varchar language
        int duration
        date release_date
        varchar status
    }

    THEATRES {
        int theatre_id PK
        varchar theatre_name
        varchar location
    }

    SCREENS {
        int screen_id PK
        int theatre_id FK
        varchar screen_name
        int total_seats
    }

    SEATS {
        int seat_id PK
        int screen_id FK
        varchar seat_number
        varchar seat_type
    }

    SHOWS {
        int show_id PK
        int movie_id FK
        int screen_id FK
        date show_date
        time show_time
        decimal price
    }

    BOOKINGS {
        int booking_id PK
        int user_id FK
        int show_id FK
        timestamp booking_date
        decimal total_amount
        varchar booking_status
    }

    BOOKING_SEATS {
        int booking_seat_id PK
        int booking_id FK
        int show_id FK
        int seat_id FK
    }

    PAYMENTS {
        int payment_id PK
        int booking_id FK, UK
        decimal amount
        varchar payment_method
        varchar payment_status
        timestamp payment_date
    }

    USER_SESSIONS {
        bigint session_id PK
        int user_id FK
        char token_hash UK
        datetime expires_at
        timestamp created_at
    }

    MOVIE_WATCHLIST {
        int user_id PK, FK
        int movie_id PK, FK
        timestamp created_at
    }
```

---

### 2. Relational Schema Representation

- **users** (<ins>user_id</ins>, name, email, password_hash, role, created_at)
- **movies** (<ins>movie_id</ins>, title, genre, language, duration, release_date, status)
- **theatres** (<ins>theatre_id</ins>, theatre_name, location)
- **screens** (<ins>screen_id</ins>, *theatre_id*, screen_name, total_seats)
  - Foreign Key: `theatre_id` references `theatres(theatre_id)`
- **seats** (<ins>seat_id</ins>, *screen_id*, seat_number, seat_type)
  - Foreign Key: `screen_id` references `screens(screen_id)`
- **shows** (<ins>show_id</ins>, *movie_id*, *screen_id*, show_date, show_time, price)
  - Foreign Key: `movie_id` references `movies(movie_id)`
  - Foreign Key: `screen_id` references `screens(screen_id)`
- **bookings** (<ins>booking_id</ins>, *user_id*, *show_id*, booking_date, total_amount, booking_status)
  - Foreign Key: `user_id` references `users(user_id)`
  - Foreign Key: `show_id` references `shows(show_id)`
- **booking_seats** (<ins>booking_seat_id</ins>, *booking_id*, *show_id*, *seat_id*)
  - Foreign Key: `booking_id` references `bookings(booking_id)`
  - Foreign Key: `show_id` references `shows(show_id)`
  - Foreign Key: `seat_id` references `seats(seat_id)`
- **payments** (<ins>payment_id</ins>, *booking_id*, amount, payment_method, payment_status, payment_date)
  - Foreign Key: `booking_id` references `bookings(booking_id)` (Unique constraint enforces 1-to-1 relationship)
- **user_sessions** (<ins>session_id</ins>, *user_id*, token_hash, expires_at, created_at) — added by `sql files/11_add_user_sessions.sql`; only a SHA-256 hash of the random session token is stored.
- **movie_watchlist** (*<ins>user_id</ins>*, *<ins>movie_id</ins>*, created_at) — added by `sql files/12_add_movie_watchlist.sql`; the composite primary key makes each user/movie pair unique.

---

### 3. Data Dictionary

#### 3.1 Table: `users`
| Column Name | Data Type | Nullable | Key | Default | Description |
|---|---|---|---|---|---|
| `user_id` | INT | NO | PRI | auto_increment | Unique identifier for registered user |
| `name` | VARCHAR(100) | NO | | NULL | Full name of the patron or administrator |
| `email` | VARCHAR(100) | NO | UNI | NULL | Unique email address for login/identification |
| `password_hash` | VARCHAR(255) | NO | | NULL | Secure hash string of user password |
| `role` | VARCHAR(20) | NO | | NULL | Role classification (`CUSTOMER`, `ADMIN`) |
| `created_at` | TIMESTAMP | YES | | CURRENT_TIMESTAMP | Registration timestamp |

#### 3.2 Table: `movies`
| Column Name | Data Type | Nullable | Key | Default | Description |
|---|---|---|---|---|---|
| `movie_id` | INT | NO | PRI | auto_increment | Primary key for movie record |
| `title` | VARCHAR(150) | NO | MUL | NULL | Title of the film (indexed) |
| `genre` | VARCHAR(100) | NO | | NULL | Movie category (Action, Romance, Thriller) |
| `language` | VARCHAR(50) | NO | | NULL | Primary spoken audio track |
| `duration` | INT | NO | | NULL | Movie runtime in minutes |
| `release_date` | DATE | NO | | NULL | Theatrical debut date |
| `status` | VARCHAR(20) | YES | | 'ACTIVE' | Screening availability (`ACTIVE`, `INACTIVE`) |

#### 3.3 Table: `theatres`
| Column Name | Data Type | Nullable | Key | Default | Description |
|---|---|---|---|---|---|
| `theatre_id` | INT | NO | PRI | auto_increment | Unique theatre complex ID |
| `theatre_name` | VARCHAR(150) | NO | | NULL | Commercial name of the multiplex |
| `location` | VARCHAR(200) | NO | | NULL | City / metropolitan area (Bengaluru, Mysuru, Hubballi) |

#### 3.4 Table: `screens`
| Column Name | Data Type | Nullable | Key | Default | Description |
|---|---|---|---|---|---|
| `screen_id` | INT | NO | PRI | auto_increment | Unique identifier for cinema auditorium |
| `theatre_id` | INT | NO | MUL | NULL | Parent theatre reference |
| `screen_name` | VARCHAR(50) | NO | | NULL | Hall name (Screen 1, Screen 2) |
| `total_seats` | INT | NO | | NULL | Total physical seat capacity |

#### 3.5 Table: `seats`
| Column Name | Data Type | Nullable | Key | Default | Description |
|---|---|---|---|---|---|
| `seat_id` | INT | NO | PRI | auto_increment | Unique identifier for physical seat |
| `screen_id` | INT | NO | MUL | NULL | Screen where the seat is physically located |
| `seat_number` | VARCHAR(10) | NO | | NULL | Alphanumeric row/seat identifier (A1, A2, B1...) |
| `seat_type` | VARCHAR(20) | YES | | 'REGULAR' | Seating class tier (`REGULAR`, `PREMIUM`) |

#### 3.6 Table: `shows`
| Column Name | Data Type | Nullable | Key | Default | Description |
|---|---|---|---|---|---|
| `show_id` | INT | NO | PRI | auto_increment | Unique screening schedule ID |
| `movie_id` | INT | NO | MUL | NULL | Movie scheduled for presentation |
| `screen_id` | INT | NO | MUL | NULL | Screen hosting the screening |
| `show_date` | DATE | NO | MUL | NULL | Scheduled screening calendar date |
| `show_time` | TIME | NO | | NULL | Scheduled screening start time |
| `price` | DECIMAL(10,2)| NO | | NULL | Base ticket admission fee in INR |

#### 3.7 Table: `bookings`
| Column Name | Data Type | Nullable | Key | Default | Description |
|---|---|---|---|---|---|
| `booking_id` | INT | NO | PRI | auto_increment | Unique reservation transaction ID |
| `user_id` | INT | NO | MUL | NULL | Patron who initiated booking |
| `show_id` | INT | NO | MUL | NULL | Show for which tickets are reserved |
| `booking_date`| TIMESTAMP | YES | | CURRENT_TIMESTAMP | Timestamp when transaction was created |
| `total_amount`| DECIMAL(10,2)| NO | | NULL | Server-computed total ticket cost |
| `booking_status`| VARCHAR(20) | YES | | 'CONFIRMED' | Booking lifecycle (`CONFIRMED`, `CANCELLED`)|

#### 3.8 Table: `booking_seats`
| Column Name | Data Type | Nullable | Key | Default | Description |
|---|---|---|---|---|---|
| `booking_seat_id`| INT | NO | PRI | auto_increment| Junction record primary key |
| `booking_id` | INT | NO | MUL | NULL | Parent booking transaction |
| `show_id` | INT | NO | MUL | NULL | Redundant foreign key for rapid conflict checking |
| `seat_id` | INT | NO | MUL | NULL | Physical seat reserved |

#### 3.9 Table: `payments`
| Column Name | Data Type | Nullable | Key | Default | Description |
|---|---|---|---|---|---|
| `payment_id` | INT | NO | PRI | auto_increment | Unique payment ledger record |
| `booking_id` | INT | NO | UNI | NULL | Unique booking reference (1:1 constraint) |
| `amount` | DECIMAL(10,2)| NO | | NULL | Transaction monetary sum |
| `payment_method`| VARCHAR(30) | NO | | NULL | Payment instrument (`UPI`, `CARD`, `UPI (DEMO)`)|
| `payment_status`| VARCHAR(20) | NO | MUL | NULL | Settlement state (`SUCCESS`, `FAILED`) |
| `payment_date`| TIMESTAMP | YES | | CURRENT_TIMESTAMP | Payment settlement timestamp |

#### 3.10 Table: `user_sessions` (additive migration)
| Column Name | Data Type | Nullable | Key | Description |
|---|---|---|---|---|
| `session_id` | BIGINT UNSIGNED | NO | PRI | Auto-increment session row ID |
| `user_id` | INT | NO | MUL, FK | Customer account owning the session |
| `token_hash` | CHAR(64) | NO | UNI | SHA-256 hash of the opaque cookie token; raw token is not stored |
| `expires_at` | DATETIME | NO | MUL | Session expiration checked in UTC |
| `created_at` | TIMESTAMP | NO | | Session creation time |

#### 3.11 Table: `movie_watchlist` (additive migration)
| Column Name | Data Type | Nullable | Key | Description |
|---|---|---|---|---|
| `user_id` | INT | NO | PRI, FK | Authenticated customer |
| `movie_id` | INT | NO | PRI, FK | Saved movie |
| `created_at` | TIMESTAMP | NO | | Time the movie was saved |

The two migrations above use `CREATE TABLE IF NOT EXISTS` and preserve existing records. Apply them separately after the core `users` and `movies` tables exist.

---

### 4. Keys, Constraints, Indexes & Advanced DB Objects

#### 4.1 Primary & Foreign Keys
- **Primary Keys**: Core tables use the keys shown in their data-dictionary entries. `user_sessions.session_id` is `BIGINT UNSIGNED`; `movie_watchlist` uses the composite primary key `(user_id, movie_id)`.
- **Foreign Keys with Referential Integrity**:
  - `screens.theatre_id` -> `theatres.theatre_id`
  - `seats.screen_id` -> `screens.screen_id`
  - `shows.movie_id` -> `movies.movie_id`
  - `shows.screen_id` -> `screens.screen_id`
  - `bookings.user_id` -> `users.user_id`
  - `bookings.show_id` -> `shows.show_id`
  - `booking_seats.booking_id` -> `bookings.booking_id`
  - `booking_seats.show_id` -> `shows.show_id`
  - `booking_seats.seat_id` -> `seats.seat_id`
  - `payments.booking_id` -> `bookings.booking_id` (with `UNIQUE` constraint)
  - `user_sessions.user_id` -> `users.user_id`
  - `movie_watchlist.user_id` -> `users.user_id`
  - `movie_watchlist.movie_id` -> `movies.movie_id`

#### 4.2 Composite & Secondary Indexes
The core SQL file explicitly creates the following secondary indexes:
1. `idx_movie_title` on `movies(title)`.
2. `idx_show_movie` on `shows(movie_id)`.
3. `idx_booking_user` on `bookings(user_id)`.
4. `idx_booking_show` on `bookings(show_id)`.
5. `idx_payment_status` on `payments(payment_status)`.

`sql files/09_show_date_time_index.sql` separately creates `idx_shows_date_time` on `(show_date, show_time)`. It is not guarded by an existence check, so rerunning it can fail with a duplicate-index error. The repository does not define the previously claimed `uq_shows_screen_date_time` unique index.

#### 4.3 Database Views
The core SQL file creates three views:
1. **`movie_show_details`**: Joins `shows`, `movies`, `screens`, and `theatres` to provide a consolidated schedule with pricing and location.
2. **`booking_summary`**: Joins `bookings`, `users`, `shows`, `movies`, `screens`, and `theatres` to produce complete customer order records.
3. **`payment_report`**: Joins `payments`, `bookings`, `users`, `shows`, and `movies` to report monetary flows and payment instruments.

No `booking_details` or `show_schedule` view definition is present in the checked-in SQL scripts.

#### 4.4 Triggers & Stored Procedures
- **Trigger `check_booking_amount`** (defined in `movie_booking_project.sql`):
  ```sql
  CREATE TRIGGER check_booking_amount
  BEFORE INSERT ON bookings
  FOR EACH ROW
  BEGIN
      IF NEW.total_amount <= 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Booking amount must be greater than zero';
      END IF;
  END;
  ```
  *Purpose*: Enforces business rule validation at the database engine level, rejecting non-positive transaction amounts.
- **Stored Procedure `GetShowsByDate`** (defined in `10_get_shows_by_date_procedure.sql`):
  ```sql
  CREATE PROCEDURE GetShowsByDate(IN p_show_date DATE)
  BEGIN
      SELECT s.show_id, m.title AS movie_title, t.theatre_name,
             s.show_date, s.show_time, s.price
      FROM shows s
      JOIN movies m ON s.movie_id = m.movie_id
      JOIN screens sc ON s.screen_id = sc.screen_id
      JOIN theatres t ON sc.theatre_id = t.theatre_id
      WHERE s.show_date = p_show_date
      ORDER BY s.show_time;
  END;
  ```
  *Purpose*: Encapsulates parameterized daily show querying inside a reusable stored routine.
