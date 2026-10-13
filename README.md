# MovieBook — Movie Ticket Booking Management System

A full-stack, database-driven cinema ticket reservation application built for a college Database Management Systems (DBMS) project.

The application connects an interactive, responsive frontend built with **Next.js (React)** to a normalized **MySQL relational database** using `mysql2/promise`. It also uses a local **Neo4j graph database** for movie recommendations based on shared genres and confirmed booking histories. MySQL remains authoritative for showtimes, seat availability, booking transactions, payment records, and booking history.

Runtime dependencies, including Next.js, React, `mysql2`, and `neo4j-driver`, are declared in `package.json` and pinned by `package-lock.json`; `npm ci` installs the project dependencies.

---

## Quick Start & Setup

### 1. Prerequisites
- **Node.js**: 20.9 or later (required by the installed Next.js 16 release)
- **MySQL Server**: 8.0 or later
- **Neo4j Desktop**: Start the local `MovieBookDB` instance with the `neo4j` database available over Bolt.

### 2. Database Initialization
The project does not include a base `CREATE DATABASE`/`CREATE TABLE` schema script. Create the `movie_booking_db` database and its nine core tables using the schema documented in [Database Design](./docs/02_DATABASE_DESIGN_AND_DATA_DICTIONARY.md) before running the SQL data script. The script assumes the schema already exists.

On a **new, empty project database only**:
1. Start your local MySQL instance and select `movie_booking_db`.
2. Review the SQL script before execution. It inserts sample data, runs demonstrations (including updates and a test-user delete), and creates database objects; it is not safe to rerun on a populated database.
3. From the project directory, execute:
   ```bash
   mysql -u root -p movie_booking_db < "sql files/movie_booking_project.sql"
   ```
   Alternatively, open `sql files/movie_booking_project.sql` in MySQL Workbench after selecting the database and review each statement before running it.

The scripts in `sql files/` are not a single migration runner. In particular, `05_show_date_update.sql` and `06_show_date_queries.sql` update existing show dates, and `09_show_date_time_index.sql` is not idempotent. Review scripts individually and back up existing data before any manual SQL operation.

The runtime MySQL account needs the read/write permissions used by the application on `movie_booking_db`; apply the two additive table migrations with a database account that has `CREATE` permission. The Neo4j account must be able to read and write graph data in the configured database because recommendations synchronize graph nodes and relationships.

### 3. Environment Variables
Create a `.env.local` file in the `movie-ticket-booking-system` folder with your local database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=movie_booking_db
NEO4J_PASSWORD=your_neo4j_password
```
`NEO4J_PASSWORD` is required for recommendations and is read at runtime. The defaults are `NEO4J_URI=neo4j://127.0.0.1:7687`, `NEO4J_USER=neo4j`, and `NEO4J_DATABASE=neo4j`; set those optional variables only if your local setup differs. Keep `.env.local` private and do not commit it.

### 4. Running the Development Server
Install the locked dependencies and launch the application:
```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

To verify your database connection, visit:
[http://localhost:3000/api/db-test](http://localhost:3000/api/db-test)

### Customer Accounts and Session Migration
Before using registration, sign-in, customer booking history, or booking creation, apply the additive session table migration once:
```bash
mysql -u root -p movie_booking_db < "sql files/11_add_user_sessions.sql"
```
The migration adds `user_sessions` and does not drop or rewrite existing records. Customer passwords are hashed with Node.js `scrypt`; the session cookie is HttpOnly, SameSite=Lax, and expires after seven days. Register a new customer account in the app. Earlier sample users may contain placeholder password hashes and cannot authenticate with the new scrypt login.

Booking history and new bookings require a signed-in customer. `GET /api/bookings` is restricted to that customer's bookings; `POST /api/bookings` assigns the booking to the authenticated account rather than selecting the first user.

The application opens at `/login` for unauthenticated visitors. Use `/register` to create a customer account; both forms redirect to the protected home page after success. Authenticated routes include `/`, `/movies`, `/movies/[movieId]`, `/bookings`, `/account`, and `/booking-confirmation/[bookingId]`. Movie listings/details use existing MySQL movie/show data; similar-movie suggestions use the Neo4j recommendations API. The booking confirmation view reads only the signed-in customer's booking history.

The existing booking journey continues to use the transactional MySQL endpoint and simulated payment records; no real payment details are collected or processed. Poster artwork and ratings are not present in the current database, so the interface uses abstract, decorative poster styling and does not invent ratings.

The sample schedule in `sql files/movie_booking_project.sql` contains fixed historical dates and is not refreshed by the application. There is no admin show-management page or API. To add one clearly identified, idempotent demo show for testing the booking journey, review and run `sql files/13_add_demo_future_show.sql` in MySQL Workbench. It only inserts a future show if that same movie, screen, date, and time do not already exist; it does not change existing shows, bookings, seats, or payments.

### Watchlist
The customer watchlist migration is additive and idempotent. Apply it once to add `movie_watchlist`; it does not delete or rewrite existing records:
```bash
mysql -u root -p movie_booking_db < "sql files/12_add_movie_watchlist.sql"
```
The `/api/watchlist` routes require a valid customer session and scope every read/write to the authenticated user. Saved movies are available at `/watchlist`. Movie detail views update the device-local `moviebook_recent_movies` list in browser storage. Booking review is shown at `/booking-review` immediately before the existing transactional booking endpoint is called.

### Neo4j Movie Recommendations
Start the Neo4j Desktop database named `MovieBookDB` and ensure its Bolt endpoint is available at `neo4j://127.0.0.1:7687`. Configure `NEO4J_PASSWORD` in your private `.env.local`, then restart Next.js. Movie detail pages call `/api/recommendations?movie_id=<movie_id>` when **Find similar movies** is selected.

The recommendations endpoint refreshes Neo4j's movie, genre, and confirmed-booking graph from MySQL using stable IDs and idempotent `MERGE` operations before running a parameterized Cypher query. Open a movie details page and choose **Find similar movies**. Neo4j connection or configuration errors are returned by the recommendations endpoint only; MySQL booking routes continue to operate independently.

### Submission notes and known limits
- `docs/` contains the project documentation. The existing report PDF (`MovieBook_DBMS_Final_Report_with_All_Available_Screenshots.pdf`) and presentation (`sql files/Movie_Ticket_Booking_Management_System_Final.pptx`) are preserved. No separate screenshot image assets were found in the project tree.
- Movie ratings and synopsis text are not in the MySQL movie schema. Posters are generated as decorative CSS artwork from the actual title/genre/runtime; they are not movie photographs.
- Recently viewed movie IDs are stored only in that browser's local storage.
- `sql files/movie_booking_testing.sql` is an optional privilege/setup template, not required by the app. Replace its clearly marked password placeholder with a unique local value before running it; never commit a real credential or run the template unchanged on a shared or production database.

---

## Detailed Project Documentation

Comprehensive submission documentation is available in the [`docs/`](./docs) folder:

- **[01. Project Overview & Requirements](./docs/01_PROJECT_OVERVIEW_AND_REQUIREMENTS.md)**: Problem statement, objectives, functional & non-functional requirements.
- **[02. Database Design & Data Dictionary](./docs/02_DATABASE_DESIGN_AND_DATA_DICTIONARY.md)**: Mermaid ER diagram, core and additive tables, relational schema, indexes, views, triggers, and stored procedures.
- **[03. Important SQL Queries & Advanced Features](./docs/03_SQL_QUERIES_AND_ADVANCED_FEATURES.md)**: Analytical queries, joins, aggregations, subqueries, and ACID transaction demos.
- **[04. System Architecture & Workflows](./docs/04_SYSTEM_ARCHITECTURE_AND_WORKFLOWS.md)**: 3-tier architecture, sequence diagrams, row-level locking (`SELECT ... FOR UPDATE`), and concurrency protection.
- **[05. Testing Report, Setup & Conclusion](./docs/05_TESTING_SETUP_AND_PROJECT_REPORT.md)**: Verification test suite, environment boundaries, limitations, future scope, and team placeholders.

---

## Next.js Reference & Deployment

This project is built using [Next.js](https://nextjs.org) with the App Router.

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Next.js Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying) - guide to deploying Next.js applications.
