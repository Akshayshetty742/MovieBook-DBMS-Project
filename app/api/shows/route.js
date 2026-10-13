import pool from "@/lib/db";

export async function GET() {
    try {
        const [rows] = await pool.query(`
            SELECT
                s.show_id,
                s.movie_id,
                m.title AS movie_title,
                m.genre,
                m.language,
                m.duration,
                DATE_FORMAT(m.release_date, '%Y-%m-%d') AS release_date,
                m.status AS movie_status,
                t.theatre_name,
                DATE_FORMAT(s.show_date, '%Y-%m-%d') AS show_date,
                s.show_time,
                s.price
            FROM shows s
            JOIN movies m ON s.movie_id = m.movie_id
            JOIN screens sc ON s.screen_id = sc.screen_id
            JOIN theatres t ON sc.theatre_id = t.theatre_id
            ORDER BY s.show_date, s.show_time
        `);

        return Response.json({
            success: true,
            shows: rows,
        });
    } catch (error) {
        console.error("Shows API failed:", error.message);

        return Response.json(
            { success: false, error: "Failed to fetch shows" },
            { status: 500 }
        );
    }
}