import pool from "@/lib/db";

/**
 * GET /api/seats?show_id=<id>
 *
 * Returns every seat that belongs to the show's screen, each marked as
 * "available" or "booked" based on confirmed entries in booking_seats.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const showId = Number(searchParams.get("show_id"));

    if (!showId || !Number.isInteger(showId)) {
        return Response.json(
            { success: false, error: "Provide a valid show_id query parameter." },
            { status: 400 }
        );
    }

    try {
        // Look up the show to get its screen_id
        const [shows] = await pool.query(
            "SELECT show_id, screen_id FROM shows WHERE show_id = ?",
            [showId]
        );

        if (shows.length === 0) {
            return Response.json(
                { success: false, error: "Show not found." },
                { status: 404 }
            );
        }

        const screenId = shows[0].screen_id;

        // Fetch all seats for this screen and left-join against booking_seats
        // Any seat present in booking_seats for this show is occupied.
        const [rows] = await pool.query(
            `SELECT
                s.seat_id,
                s.seat_number,
                s.seat_type,
                CASE
                    WHEN bs.booking_seat_id IS NOT NULL THEN 'booked'
                    ELSE 'available'
                END AS status
            FROM seats s
            LEFT JOIN booking_seats bs
                ON  bs.seat_id = s.seat_id
                AND bs.show_id = ?
            WHERE s.screen_id = ?
            ORDER BY s.seat_number`,
            [showId, screenId]
        );

        return Response.json({ success: true, seats: rows });
    } catch (error) {
        console.error("Seats API failed:", error.message);
        return Response.json(
            { success: false, error: "Failed to fetch seats." },
            { status: 500 }
        );
    }
}
