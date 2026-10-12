# MovieBook: Testing Report, Setup Instructions & Project Conclusion

---

### 1. Verification & Testing Report

This report explicitly distinguishes between tests that were **actually executed and verified against the live environment** versus tests that **remain unverified or out-of-scope**.

#### 1.1 Verified Tests (Passed)

| Test ID | Module / Feature | Test Description | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| **TC-01** | Database Link | `GET /api/db-test` connection verification | HTTP 200 with `{ connected: 1 }` | Successfully linked to MySQL | **PASSED** |
| **TC-02** | Movie Catalog | `GET /api/movies` retrieves movie list | Returns active movies from `movies` table | Returned array of active movies | **PASSED** |
| **TC-03** | Schedule Joins | `GET /api/shows` multi-table join | Shows joined with screen, theatre, movie | Returned complete schedule objects | **PASSED** |
| **TC-04** | Live Seat Map | `GET /api/seats?show_id=1` | Dynamic `booked` vs `available` flag per seat | Returned correct status per seat | **PASSED** |
| **TC-05** | Booking Transaction | `POST /api/bookings` with valid seats | Atomic commit across `bookings`, `booking_seats`, and `payments` | Booking #21 & #22 created and verified in DB | **PASSED** |
| **TC-06** | Double-Booking Guard | `POST /api/bookings` with already booked seat | Rollback and HTTP 409 Conflict | Returned 409: "One or more selected seats are already booked" | **PASSED** |
| **TC-07** | Server Price Compute | Request body without total amount | Server re-computes `price * count` | Accurately recorded ₹300 and ₹360 in `bookings` | **PASSED** |
| **TC-08** | My Bookings History | `GET /api/bookings` | Returns newest bookings with aggregated seats | Bookings #21 and #22 listed at top with seat lists | **PASSED** |
| **TC-09** | Timezone Formatting | ISO date string conversion | Correct Indian show date without -1 day shift | Displayed "26 Aug 2026" consistently | **PASSED** |
| **TC-10** | Production Build | `npm run build` | Zero syntax or Turbopack bundling errors | Compiled successfully in under 1 second | **PASSED** |
| **TC-11** | Code Quality | `npm run lint` | ESLint static analysis | 0 errors, 0 warnings | **PASSED** |

#### 1.2 Unverified Tests / Environment Limitations
- **Headless Browser Subagent Automation**: Playwright driver binary download failed with `404 Not Found` from external Microsoft CDN (`playwright.azureedge.net/builds/driver/playwright-1.57.0-win32_x64.zip`) on Windows. Visual workflows were tested directly via the local server.
- **Concurrent Load Testing**: High-concurrency stress testing (e.g., 500 simultaneous users competing for the same seat at the exact same millisecond) was not run with external load tools (e.g., JMeter/k6).
- **Real Payment Gateway Integration**: Banking webhooks were deliberately not implemented, as simulated payment ledgers (`payments` table) are standard for college DBMS evaluations.

---

### 2. Setup Instructions & Environment Configuration

#### 2.1 Prerequisites
- **Node.js**: Version 18.x or newer (tested on Node.js 24.x)
- **MySQL Server**: Version 8.0 or newer
- **Neo4j Desktop**: Local `MovieBookDB` instance exposing Bolt at `neo4j://127.0.0.1:7687`
- **Operating System**: Windows, macOS, or Linux

#### 2.2 Database Initialization
1. Start your local MySQL server.
2. Open MySQL Workbench or your terminal:
   ```bash
   mysql -u root -p
   ```
3. Execute the schema and seed script located in the project root:
   ```sql
   SOURCE movie_booking_project.sql;
   ```
4. Verify that `movie_booking_db` was created and populated:
   ```sql
   USE movie_booking_db;
   SHOW TABLES;
   ```

#### 2.3 Application Configuration
1. Navigate to the application directory:
   ```bash
   cd movie-ticket-booking-system
   ```
2. Verify or create your local environment configuration file (`.env.local`):
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=movie_booking_db
   NEO4J_PASSWORD=your_neo4j_password
   ```
   *(Note: Never commit `.env.local` to public version control).*

   Neo4j defaults to `NEO4J_URI=neo4j://127.0.0.1:7687`, `NEO4J_USER=neo4j`, and `NEO4J_DATABASE=neo4j`. These three settings may be overridden in `.env.local`; `NEO4J_PASSWORD` is required for graph recommendations. Do not include real credentials in project documentation or source control.

#### 2.4 Running the Application
1. Install project dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
4. Test database connectivity directly in your browser or terminal:
   ```
   http://localhost:3000/api/db-test
   ```
5. Start the Neo4j Desktop `MovieBookDB` instance and select **Find Similar Movies** on a movie card. The first recommendations request imports the current MySQL movie catalog and confirmed booking pairs with stable identifiers and idempotent `MERGE`, then queries the graph. The graph API reports Neo4j availability/configuration errors without changing the MySQL booking endpoints.

---

### 3. Limitations & Future Enhancements

#### 3.1 Known Limitations
1. **Single Authentication Context**: A fixed demo user profile (`user_id = 1`) is used for rapid demonstration without requiring evaluators to register or remember login passwords.
2. **Fixed Screen Dimensions**: The seat map currently displays up to 10 seats per screen (Screen 1 & 2 layout). Dynamic multi-tier auditorium grids (e.g., balcony, VIP box) are not yet dynamic per screen layout.
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
