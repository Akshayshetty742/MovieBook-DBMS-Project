
import pool from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * GET /api/bookings
 *
 * Returns every booking joined with its show, movie, theatre, and booked seats.
 */
export async function GET(request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return Response.json(
                { success: false, error: "Sign in to view your bookings." },
                { status: 401 }
            );
        }

        const [rows] = await pool.execute(`
            SELECT
                b.booking_id,
                b.user_id,
                b.show_id,
                b.booking_date,
                b.total_amount,
                b.booking_status,
                DATE_FORMAT(s.show_date, '%Y-%m-%d') AS show_date,
                s.show_time,
                s.price,
                m.title  AS movie_title,
                t.theatre_name
            FROM bookings b
            JOIN shows   s  ON b.show_id    = s.show_id
            JOIN movies  m  ON s.movie_id   = m.movie_id
            JOIN screens sc ON s.screen_id  = sc.screen_id
            JOIN theatres t ON sc.theatre_id = t.theatre_id
            WHERE b.user_id = ?
            ORDER BY b.booking_id DESC
        `, [user.user_id]);

        // Gather seat labels for every booking in a single query
        const bookingIds = rows.map((r) => r.booking_id);

        let seatMap = {};

        if (bookingIds.length > 0) {
            const placeholders = bookingIds.map(() => "?").join(",");
            const [seatRows] = await pool.query(
                `SELECT bs.booking_id, se.seat_number, se.seat_type
                 FROM booking_seats bs
                 JOIN seats se ON bs.seat_id = se.seat_id
                 WHERE bs.booking_id IN (${placeholders})
                 ORDER BY se.seat_number`,
                bookingIds
            );

            for (const sr of seatRows) {
                if (!seatMap[sr.booking_id]) seatMap[sr.booking_id] = [];
                seatMap[sr.booking_id].push({
                    seat_number: sr.seat_number,
                    seat_type: sr.seat_type,
                });
            }
        }

        const bookings = rows.map((r) => ({
            ...r,
            seats: seatMap[r.booking_id] || [],
            seat_count: (seatMap[r.booking_id] || []).length,
        }));

        return Response.json({ success: true, bookings });
    } catch (error) {
        console.error("Bookings GET failed:", error.message);
        return Response.json(
            { success: false, error: "Failed to fetch bookings" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/bookings
 *
 * Creates a new booking with a MySQL transaction.
 * Validates show, seat IDs, seat availability, and total amount.
 * Prevents double-booking via SELECT ... FOR UPDATE + UNIQUE constraint.
 */
export async function POST(request) {
    let connection;
    let transactionStarted = false;

    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return Response.json(
                { success: false, error: "Sign in before creating a booking." },
                { status: 401 }
            );
        }

        connection = await pool.getConnection();
        const { show_id, seat_ids } = await request.json();

        if (
            !Number.isInteger(Number(show_id)) ||
            !Array.isArray(seat_ids) ||
            seat_ids.length < 1 ||
            seat_ids.length > 10 ||
            seat_ids.some((id) => !Number.isInteger(Number(id))) ||
            new Set(seat_ids.map(Number)).size !== seat_ids.length
        ) {
            return Response.json(
                { success: false, error: "Provide a valid show and 1–10 unique seats." },
                { status: 400 }
            );
        }

        await connection.beginTransaction();
        transactionStarted = true;

        // Validate show existence and get its screen + price
        const [shows] = await connection.query(
            `SELECT show_id, screen_id, price,
                    (TIMESTAMP(show_date, show_time) > NOW()) AS is_future
             FROM shows WHERE show_id = ?`,
            [Number(show_id)]
        );

        if (shows.length === 0) {
            await connection.rollback();
            transactionStarted = false;
            return Response.json(
                { success: false, error: "Show not found." },
                { status: 404 }
            );
        }

        const show = shows[0];
        if (!Boolean(show.is_future)) {
            await connection.rollback();
            transactionStarted = false;
            return Response.json(
                { success: false, error: "This showtime has already passed and is no longer bookable." },
                { status: 400 }
            );
        }

        const seatIds = seat_ids.map(Number);

        // Validate that every requested seat belongs to this screen
        const placeholders = seatIds.map(() => "?").join(",");
        const [seats] = await connection.query(
            `SELECT seat_id FROM seats
             WHERE screen_id = ? AND seat_id IN (${placeholders})
             FOR UPDATE`,
            [show.screen_id, ...seatIds]
        );

        if (seats.length !== seatIds.length) {
            await connection.rollback();
            transactionStarted = false;
            return Response.json(
                { success: false, error: "One or more seats do not belong to this screen." },
                { status: 400 }
            );
        }

        // Check for double-booking against existing booking_seats records
        const [alreadyBooked] = await connection.query(
            `SELECT bs.seat_id
             FROM booking_seats bs
             WHERE bs.show_id = ?
               AND bs.seat_id IN (${placeholders})`,
            [Number(show_id), ...seatIds]
        );

        if (alreadyBooked.length > 0) {
            const takenIds = alreadyBooked.map((r) => r.seat_id);
            await connection.rollback();
            transactionStarted = false;
            return Response.json(
                {
                    success: false,
                    error: "One or more selected seats are already booked. Please choose other seats.",
                    booked_seat_ids: takenIds,
                },
                { status: 409 }
            );
        }

        const total = Number(show.price) * seatIds.length;

        // Insert the booking row
        const [bookingResult] = await connection.query(
            `INSERT INTO bookings (user_id, show_id, total_amount, booking_status)
             VALUES (?, ?, ?, 'CONFIRMED')`,
            [user.user_id, Number(show_id), total]
        );

        // Insert one booking_seats row per selected seat
        for (const seatId of seatIds) {
            await connection.query(
                `INSERT INTO booking_seats (booking_id, show_id, seat_id)
                 VALUES (?, ?, ?)`,
                [bookingResult.insertId, Number(show_id), seatId]
            );
        }

        // Record payment in payments table (simulated payment record for college DBMS project)
        await connection.query(
            `INSERT INTO payments (booking_id, amount, payment_method, payment_status)
             VALUES (?, ?, 'UPI (DEMO)', 'SUCCESS')`,
            [bookingResult.insertId, total]
        );

        await connection.commit();
        transactionStarted = false;

        return Response.json(
            {
                success: true,
                message: "Booking saved successfully (Demo payment recorded).",
                booking_id: bookingResult.insertId,
                total_amount: total,
                seat_count: seatIds.length,
                payment: {
                    method: "UPI (DEMO)",
                    status: "SUCCESS",
                    simulated: true,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        if (transactionStarted && connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Bookings POST rollback failed:",
                    rollbackError.code || rollbackError.name
                );
            }
        }
        console.error("Bookings POST failed:", error.code || error.name);

        if (error.code === "ER_DUP_ENTRY") {
            return Response.json(
                {
                    success: false,
                    error: "One or more selected seats were already booked. Please choose other seats.",
                },
                { status: 409 }
            );
        }

        return Response.json(
            {
                success: false,
                error: "Booking failed. Please try again.",
            },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
