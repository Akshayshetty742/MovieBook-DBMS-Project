# MovieBook: Testing Report, Setup Instructions & Project Conclusion

---

### 1. Verification & Testing Report

This report distinguishes recent checks actually executed against the local application from checks that remain unverified or out of scope. The validation notes below were recorded on 2026-10-13; this documentation-only audit did not rerun application tests.

#### 1.1 Verified Tests (Passed)

| Date | Module / Feature | Verification performed | Result |
|---|---|---|---|
| 2026-10-13 | Booking journey and ownership | Authenticated registration/login, session persistence, future-show seat selection/review/confirmation, booking history, duplicate-seat rejection, and another-account access checks | Passed in the live local application; booking/payment were simulated. |
| 2026-10-13 | Watchlist persistence | Authenticated API add, list, and remove for one movie; verified empty list before and after cleanup | Passed against MySQL through the real API. |
| 2026-10-13 | Discovery and responsive UI | Desktop and 390px mobile layouts; title search, genre/language filters, duration/show-availability sorting, clear filters, and movie details | Passed. No horizontal overflow was observed at checked widths. |
| 2026-10-13 | Neo4j recommendations | Requested similar movies from a movie details page | Passed; three recommendation records were returned. |
| 2026-10-13 | Lint and production build | `npm run lint` and `npm run build` after the latest UI code changes | Both completed successfully. They were not rerun for this documentation-only audit. |

#### 1.2 Unverified Tests / Environment Limitations
- **Concurrent Load Testing**: High-concurrency stress testing (e.g., 500 simultaneous users competing for the same seat at the exact same millisecond) was not run with external load tools (e.g., JMeter/k6).
- **Real Payment Gateway Integration**: Banking webhooks were deliberately not implemented, as simulated payment ledgers (`payments` table) are standard for college DBMS evaluations.
- **Clean-database bootstrap**: The repository does not include a core `CREATE DATABASE`/`CREATE TABLE` script. A fresh database needs the nine core tables created from the documented model before the sample-data SQL can be used.

---

### 2. Setup Instructions & Environment Configuration

#### 2.1 Prerequisites
- **Node.js**: Version 20.9 or newer (required by the installed Next.js 16 release)
- **MySQL Server**: Version 8.0 or newer
- **Neo4j Desktop**: Local `MovieBookDB` instance exposing Bolt at `neo4j://127.0.0.1:7687`
- **Operating System**: Windows, macOS, or Linux

#### 2.2 Database Initialization
1. Start your local MySQL server and create the `movie_booking_db` database plus the nine core tables described in [02_DATABASE_DESIGN_AND_DATA_DICTIONARY.md](./02_DATABASE_DESIGN_AND_DATA_DICTIONARY.md). A base DDL bootstrap is not included in this repository.
2. On a **new, empty database only**, review and run the sample data/DB objects script from the application directory:
   ```bash
   mysql -u root -p movie_booking_db < "sql files/movie_booking_project.sql"
   ```
   The script assumes the tables exist, inserts sample records, runs SQL demonstrations, updates a sample movie, deletes a specifically named temporary demonstration user, and drops/recreates a trigger. Do not rerun it against a populated database without inspecting each statement and backing up data.
3. Verify that `movie_booking_db` contains the expected core tables. The session and Watchlist tables are added by the later migrations:
   ```sql
   USE movie_booking_db;
   SHOW TABLES;
   ```

#### 2.3 Application Configuration
1. From the project folder, create a private `.env.local` file with the variable names below. Never copy real credential values into documentation or source control.
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=movie_booking_db
   NEO4J_PASSWORD=your_neo4j_password
   ```
   Neo4j defaults to `NEO4J_URI=neo4j://127.0.0.1:7687`, `NEO4J_USER=neo4j`, and `NEO4J_DATABASE=neo4j`; override these only if your setup differs.
   The runtime MySQL account needs application read/write access. Apply the additive migrations separately using an account with `CREATE` permission. The configured Neo4j account needs permission to write the synchronized recommendation graph.
2. Install the lockfile-pinned dependencies and start Next.js:
   ```bash
   npm ci
   npm run dev
   ```

#### 2.4 Running the Application
1. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
2. Test database connectivity directly in your browser or terminal:
   ```
   http://localhost:3000/api/db-test
   ```
3. Start Neo4j Desktop `MovieBookDB`. On the first recommendation request, the app imports the current MySQL movie catalog and confirmed booking pairs with stable IDs and idempotent `MERGE`, then queries the graph. Open a movie detail page and select **Find similar movies**. Neo4j errors do not change MySQL booking behavior.
4. Before using customer registration or booking features, apply the additive session migration:
   ```bash
   mysql -u root -p movie_booking_db < "sql files/11_add_user_sessions.sql"
   ```
5. Before using the Watchlist, apply its additive migration:
   ```bash
   mysql -u root -p movie_booking_db < "sql files/12_add_movie_watchlist.sql"
   ```
   The migrations require permission to create tables. Authentication stores scrypt password hashes and revocable, seven-day HttpOnly sessions. The sample users in the core SQL script use placeholder password hashes and cannot sign in. Never commit `.env.local`.

#### Authentication API
- `POST /api/auth/register` — creates a customer account and starts a session.
- `POST /api/auth/login` — authenticates an existing compatible password hash.
- `POST /api/auth/logout` — revokes the current session and clears its cookie.
- `GET /api/auth/me` — returns the current session's customer identity.
- `GET /api/bookings` and `POST /api/bookings` — require a session; booking history is scoped to the authenticated customer.
- `/login` and `/register` provide separate customer authentication pages. `/`, `/movies`, `/movies/[movieId]`, `/bookings`, `/account`, and `/booking-confirmation/[bookingId]` perform server-side session checks before rendering protected pages.
- Customer watchlists use the additive `sql files/12_add_movie_watchlist.sql` migration and authenticated `/api/watchlist` methods. Recently viewed movie IDs are kept in device-local browser storage. Booking review occurs at `/booking-review`; final confirmation still uses the existing transactional `/api/bookings` endpoint.

`sql files/movie_booking_testing.sql` is not needed to run the application. It is an educational account/grant template with a clearly marked password placeholder. Replace the placeholder with a unique local value before use, do not commit the resulting credential, and do not execute the template unchanged on a shared or production server. Arrange database accounts and privileges using local/DBA-managed credentials.

---

### 3. Limitations & Future Enhancements

#### 3.1 Known Limitations
1. **Existing sample password hashes**: Seeded customer rows contain placeholder hashes and cannot be used with the scrypt login. Register a customer account with a new password to test authentication.
2. **Sample seat inventory**: The seed data provides 10 seats per screen. Seat availability is loaded from the database, but there is no administrator UI for editing screen layouts or seat inventory.
3. **Simulated Payment Gateway**: Transactions record mock payment entries into `payments` rather than communicating with live UPI PSPs or Stripe.

#### 3.2 Future Enhancements
- **Multi-Role Authentication**: Implement secure JWT/NextAuth authentication with distinct Customer and Theatre Manager portals.
- **Dynamic Hall Layout Designer**: Enable theatre administrators to define custom screen layouts, seat counts, and row designations via a visual admin dashboard.
- **Ticket PDF & QR Code Generation**: Automatically generate downloadable e-ticket PDFs containing cryptographically signed QR codes for counter scanning.
- **Cancellations & Refunds**: Implement a cancellation workflow that triggers database updates and refund ledger records.

---

### 4. Conclusion
The **MovieBook** Movie Ticket Booking Management System demonstrates a complete, robust database application that bridges foundational relational theory with modern full-stack web engineering. By strictly adhering to normalization (3NF), relational constraints, composite indexing, and database transactions, the system guarantees data consistency and prevents ticket overbooking.

---

### 5. Project Information & Team Contributions

- **Project Title**: MovieBook — Movie Ticket Booking Management System
- **Course**: Database Management Systems (DBMS) Laboratory / Project
- **Academic Year**: 2025–2026

#### Team Contribution Placeholders
| Member Name | USN / Roll No. | Primary Role / Contribution |
|---|---|---|
| *[Student 1 Name]* | *[USN 1]* | Database Schema Design, Normalization, SQL Scripts & Views |
| *[Student 2 Name]* | *[USN 2]* | Backend API Endpoints, Transaction Management & Double-Booking Guard |
| *[Student 3 Name]* | *[USN 3]* | Frontend UI/UX, Seat Map Component & Integration Testing |
| *[Student 4 Name]* | *[USN 4]* | System Documentation, Data Dictionary & Presentation Materials |
