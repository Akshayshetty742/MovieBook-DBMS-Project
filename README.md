# MovieBook — Movie Ticket Booking Management System

A full-stack, database-driven cinema ticket reservation application built for a college Database Management Systems (DBMS) project.

The application connects an interactive, responsive frontend built with **Next.js (React)** to a normalized **MySQL relational database** using `mysql2/promise`. It also uses a local **Neo4j graph database** for movie recommendations based on shared genres and confirmed booking histories. MySQL remains authoritative for showtimes, seat availability, booking transactions, payment records, and booking history.

---

## Quick Start & Setup

### 1. Prerequisites
- **Node.js**: v18.x or later
- **MySQL Server**: 8.0 or later
- **Neo4j Desktop**: Start the local `MovieBookDB` instance with the `neo4j` database available over Bolt.

### 2. Database Initialization
1. Start your local MySQL instance.
2. In your MySQL client or terminal, run the seed script from the project root:
   ```bash
   mysql -u root -p < ../movie_booking_project.sql
   ```
   *(Or open `movie_booking_project.sql` in MySQL Workbench and execute all statements).*

### 3. Environment Variables
Create a `.env.local` file in the `movie-ticket-booking-system` folder with your local database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=movie_booking_db
NEO4J_PASSWORD=your_neo4j_password
```
`NEO4J_PASSWORD` is required for recommendations and is read at runtime. The defaults are `NEO4J_URI=neo4j://127.0.0.1:7687`, `NEO4J_USER=neo4j`, and `NEO4J_DATABASE=neo4j`; set those optional variables only if your local setup differs. Keep `.env.local` private and do not commit it.

### 4. Running the Development Server
Install dependencies and launch the application:
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

To verify your database connection, visit:
[http://localhost:3000/api/db-test](http://localhost:3000/api/db-test)

### Neo4j Movie Recommendations
Start the Neo4j Desktop database named `MovieBookDB` and ensure its Bolt endpoint is available at `neo4j://127.0.0.1:7687`. Configure `NEO4J_PASSWORD` in your private `.env.local`, then restart Next.js. Choose **Find Similar Movies** on a movie card to call `/api/recommendations?movie_id=<movie_id>`.

The recommendations endpoint refreshes Neo4j's movie, genre, and confirmed-booking graph from MySQL using stable IDs and idempotent `MERGE` operations before running a parameterized Cypher query. Neo4j connection or configuration errors are returned by the recommendations endpoint only; MySQL booking routes continue to operate independently.

---

## Detailed Project Documentation

Comprehensive submission documentation is available in the [`docs/`](./docs) folder:

- **[01. Project Overview & Requirements](./docs/01_PROJECT_OVERVIEW_AND_REQUIREMENTS.md)**: Problem statement, objectives, functional & non-functional requirements.
- **[02. Database Design & Data Dictionary](./docs/02_DATABASE_DESIGN_AND_DATA_DICTIONARY.md)**: Mermaid ER diagram, relational schema, data dictionary for all 9 tables, indexes, views, triggers, and stored procedures.
- **[03. Important SQL Queries & Advanced Features](./docs/03_SQL_QUERIES_AND_ADVANCED_FEATURES.md)**: Analytical queries, joins, aggregations, subqueries, and ACID transaction demos.
- **[04. System Architecture & Workflows](./docs/04_SYSTEM_ARCHITECTURE_AND_WORKFLOWS.md)**: 3-tier architecture, sequence diagrams, row-level locking (`SELECT ... FOR UPDATE`), and concurrency protection.
- **[05. Testing Report, Setup & Conclusion](./docs/05_TESTING_SETUP_AND_PROJECT_REPORT.md)**: Verification test suite, environment boundaries, limitations, future scope, and team placeholders.

---

## Next.js Reference & Deployment

This project is built using [Next.js](https://nextjs.org) with the App Router.

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Next.js Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying) - guide to deploying Next.js applications.
