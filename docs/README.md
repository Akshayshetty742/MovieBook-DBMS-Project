# MovieBook DBMS Project Documentation Index

Welcome to the documentation suite for the **MovieBook Movie Ticket Booking Management System**.

This documentation has been prepared for academic DBMS project evaluation, documenting the relational database design, SQL scripts, architecture, transaction controls, and test results.

---

### Documentation Chapters

1. **[01. Project Overview & Requirements](01_PROJECT_OVERVIEW_AND_REQUIREMENTS.md)**
   - Project Summary, Problem Statement, Objectives, and Scope.
   - Functional (FR) and Non-Functional (NFR) Requirements.

2. **[02. Database Design & Data Dictionary](02_DATABASE_DESIGN_AND_DATA_DICTIONARY.md)**
   - Entity-Relationship (ER) Diagram (Mermaid format).
   - Relational Schema representation with PK/FK mappings.
   - Data Dictionary for the nine core tables and two additive session/Watchlist tables.
   - Notes on the missing base DDL bootstrap and which SQL objects are actually defined by the checked-in scripts.
   - Constraints, Indexes, Views, Triggers, and Stored Procedures.

3. **[03. Important SQL Queries & Advanced Features](03_SQL_QUERIES_AND_ADVANCED_FEATURES.md)**
   - Filtering, Sorting, and Multi-Table SQL Joins.
   - Aggregations (`GROUP BY`, `HAVING`) and Business Intelligence Reports.
   - Subqueries, Associative Junction Queries, and Payment Summaries.
   - ACID Transaction demonstrations (`COMMIT` and `ROLLBACK`).

4. **[04. System Architecture & Workflows](04_SYSTEM_ARCHITECTURE_AND_WORKFLOWS.md)**
   - 3-Tier Architecture Diagram (Presentation, API, and Storage tiers).
   - End-to-end Sequence Diagram illustrating booking lifecycle.
   - Defensive Concurrency Control, Row-Level Locking (`FOR UPDATE`), and Double-Booking Prevention.

5. **[05. Testing Report, Setup & Conclusion](05_TESTING_SETUP_AND_PROJECT_REPORT.md)**
   - Dated local verification summary distinguishing tested behavior from unverified limits.
   - Step-by-step Local Setup Guide and `.env.local` configuration.
   - Project Limitations, Future Enhancements, and Conclusion.
   - Team Contribution Placeholders for submission.

### Submission artifacts
- [Final report PDF with available screenshots](../MovieBook_DBMS_Final_Report_with_All_Available_Screenshots.pdf)
- [Final presentation deck](../sql%20files/Movie_Ticket_Booking_Management_System_Final.pptx)
