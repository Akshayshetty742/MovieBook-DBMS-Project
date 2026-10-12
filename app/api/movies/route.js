
import pool from "@/lib/db";

export async function GET() {
    try {
        const [rows] = await pool.query(
            `SELECT movie_id, title, genre, language, duration, release_date, status
             FROM movies
             ORDER BY movie_id`
        );

        return Response.json({
            success: true,
            movies: rows,
        });
    } catch (error) {
        console.error("Movies API failed:", error.message);

        return Response.json(
            { success: false, error: "Failed to fetch movies" },
            { status: 500 }
        );
    }
}
