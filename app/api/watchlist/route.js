import pool from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

export const runtime = "nodejs";

function unavailableTable(error) {
    return error.code === "ER_NO_SUCH_TABLE"
        ? Response.json(
            { success: false, error: "The watchlist table is not installed. Apply sql files/12_add_movie_watchlist.sql with a MySQL account that can create tables." },
            { status: 503 }
        )
        : null;
}

export async function GET(request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return Response.json({ success: false, error: "Sign in to access your watchlist." }, { status: 401 });
        }

        const [rows] = await pool.execute(
            `SELECT m.movie_id, m.title, m.genre, m.language, m.duration,
                    DATE_FORMAT(m.release_date, '%Y-%m-%d') AS release_date,
                    m.status, w.created_at
             FROM movie_watchlist w
             JOIN movies m ON m.movie_id = w.movie_id
             WHERE w.user_id = ?
             ORDER BY w.created_at DESC`,
            [user.user_id]
        );
        return Response.json({ success: true, movies: rows });
    } catch (error) {
        console.error("Watchlist GET failed:", error.code || error.name);
        const migrationResponse = unavailableTable(error);
        if (migrationResponse) return migrationResponse;
        return Response.json({ success: false, error: "Unable to load your watchlist." }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return Response.json({ success: false, error: "Sign in to save movies." }, { status: 401 });
        }
        const body = await request.json();
        const movieId = Number(body.movie_id);
        if (!Number.isSafeInteger(movieId) || movieId < 1) {
            return Response.json({ success: false, error: "Provide a valid movie_id." }, { status: 400 });
        }

        const [result] = await pool.execute(
            `INSERT IGNORE INTO movie_watchlist (user_id, movie_id)
             SELECT ?, movie_id FROM movies WHERE movie_id = ?`,
            [user.user_id, movieId]
        );
        if (result.affectedRows === 0) {
            const [exists] = await pool.execute("SELECT movie_id FROM movies WHERE movie_id = ?", [movieId]);
            if (!exists.length) {
                return Response.json({ success: false, error: "Movie not found." }, { status: 404 });
            }
        }
        return Response.json({ success: true, movie_id: movieId });
    } catch (error) {
        console.error("Watchlist POST failed:", error.code || error.name);
        const migrationResponse = unavailableTable(error);
        if (migrationResponse) return migrationResponse;
        return Response.json({ success: false, error: "Unable to save this movie." }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return Response.json({ success: false, error: "Sign in to update your watchlist." }, { status: 401 });
        }
        const movieId = Number(new URL(request.url).searchParams.get("movie_id"));
        if (!Number.isSafeInteger(movieId) || movieId < 1) {
            return Response.json({ success: false, error: "Provide a valid movie_id." }, { status: 400 });
        }

        await pool.execute(
            "DELETE FROM movie_watchlist WHERE user_id = ? AND movie_id = ?",
            [user.user_id, movieId]
        );
        return Response.json({ success: true, movie_id: movieId });
    } catch (error) {
        console.error("Watchlist DELETE failed:", error.code || error.name);
        const migrationResponse = unavailableTable(error);
        if (migrationResponse) return migrationResponse;
        return Response.json({ success: false, error: "Unable to remove this movie." }, { status: 500 });
    }
}
