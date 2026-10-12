import pool from "@/lib/db";
import { getNeo4jDatabase, getNeo4jDriver } from "@/lib/neo4j";

export const runtime = "nodejs";

const MAX_RECOMMENDATIONS = 20;

function getGenreValues(genre) {
    return String(genre || "")
        .split(/[,;|/]/)
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => ({
            key: name.toLowerCase(),
            name,
        }));
}

function toSafeNumber(value) {
    return typeof value === "number" ? value : value.toNumber();
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const movieId = Number(searchParams.get("movie_id"));
    const requestedLimit = searchParams.has("limit")
        ? Number(searchParams.get("limit"))
        : 6;

    if (!Number.isSafeInteger(movieId) || movieId < 1) {
        return Response.json(
            { success: false, error: "Provide a valid movie_id query parameter." },
            { status: 400 }
        );
    }

    if (
        !Number.isInteger(requestedLimit) ||
        requestedLimit < 1 ||
        requestedLimit > MAX_RECOMMENDATIONS
    ) {
        return Response.json(
            { success: false, error: `limit must be an integer from 1 to ${MAX_RECOMMENDATIONS}.` },
            { status: 400 }
        );
    }

    if (!process.env.NEO4J_PASSWORD) {
        return Response.json(
            {
                success: false,
                error: "Neo4j is not configured. Set NEO4J_PASSWORD and start the MovieBookDB database.",
            },
            { status: 503 }
        );
    }

    let session;
    let stage = "MySQL";

    try {
        const [movieRows] = await pool.query(`
            SELECT
                m.movie_id,
                m.title,
                m.genre,
                m.language,
                m.duration,
                EXISTS (
                    SELECT 1 FROM shows s WHERE s.movie_id = m.movie_id
                ) AS has_shows
            FROM movies m
        `);

        const moviesById = new Map(
            movieRows.map((movie) => [
                String(movie.movie_id),
                {
                    movieId: String(movie.movie_id),
                    title: movie.title || "",
                    genre: movie.genre || "",
                    language: movie.language || "",
                    duration: Number(movie.duration) || 0,
                    genres: getGenreValues(movie.genre),
                    hasShows: Boolean(movie.has_shows),
                },
            ])
        );
        const targetMovie = moviesById.get(String(movieId));

        if (!targetMovie || !targetMovie.hasShows) {
            return Response.json(
                { success: false, error: "Movie not found in the current show schedule." },
                { status: 404 }
            );
        }

        const [bookingRows] = await pool.query(`
            SELECT DISTINCT b.user_id, s.movie_id
            FROM bookings b
            JOIN shows s ON s.show_id = b.show_id
            WHERE b.booking_status = 'CONFIRMED'
        `);

        const bookings = Array.from(
            new Map(
                bookingRows.map((booking) => {
                    const userId = String(booking.user_id);
                    const bookedMovieId = String(booking.movie_id);
                    return [`${userId}:${bookedMovieId}`, { userId, movieId: bookedMovieId }];
                })
            ).values()
        );
        const movies = Array.from(moviesById.values()).map(
            ({ hasShows, ...movie }) => movie
        );
        const bookableMovieIds = Array.from(moviesById.values())
            .filter((movie) => movie.hasShows)
            .map((movie) => movie.movieId);

        stage = "Neo4j";
        const driver = getNeo4jDriver();
        await driver.verifyConnectivity();
        session = driver.session({ database: getNeo4jDatabase() });

        await session.run(
            `
                UNWIND $movies AS movie
                OPTIONAL MATCH (legacy:Movie)
                WHERE legacy.movieId IS NULL
                  AND toLower(trim(legacy.title)) = toLower(trim(movie.title))
                WITH movie, collect(legacy) AS legacyMovies
                FOREACH (legacy IN legacyMovies |
                    SET legacy.movieId = movie.movieId,
                        legacy.title = movie.title,
                        legacy.genre = movie.genre,
                        legacy.language = movie.language,
                        legacy.duration = movie.duration
                )
                WITH movie
                MERGE (m:Movie {movieId: movie.movieId})
                SET m.title = movie.title,
                    m.genre = movie.genre,
                    m.language = movie.language,
                    m.duration = movie.duration
                WITH m, movie
                UNWIND movie.genres AS genre
                OPTIONAL MATCH (legacyGenre:Genre)
                WHERE legacyGenre.genreKey IS NULL
                  AND toLower(trim(legacyGenre.name)) = genre.key
                WITH m, genre, collect(legacyGenre) AS legacyGenres
                FOREACH (legacy IN legacyGenres |
                    SET legacy.genreKey = genre.key,
                        legacy.name = genre.name
                )
                WITH m, genre
                MERGE (g:Genre {genreKey: genre.key})
                SET g.name = genre.name
                MERGE (m)-[:IN_GENRE]->(g)
            `,
            { movies }
        );

        await session.run(
            `
                UNWIND $bookings AS booking
                MERGE (user:User {userId: booking.userId})
                WITH user, booking
                MATCH (movie:Movie {movieId: booking.movieId})
                MERGE (user)-[:BOOKED]->(movie)
            `,
            { bookings }
        );

        const result = await session.run(
            `
                WITH $movieId AS targetId
                CALL {
                    WITH targetId
                    MATCH (target:Movie {movieId: targetId})-[:IN_GENRE|BELONGS_TO]->
                          (genre:Genre)<-[:IN_GENRE|BELONGS_TO]-(candidate:Movie)
                    WHERE candidate.movieId <> targetId
                      AND candidate.movieId IN $bookableMovieIds
                    RETURN candidate.movieId AS movieId,
                           genre.name AS genreName,
                           null AS viewerId
                    UNION
                    WITH targetId
                    MATCH (target:Movie {movieId: targetId})<-[:BOOKED]-
                          (viewer:User)-[:BOOKED]->(candidate:Movie)
                    WHERE candidate.movieId <> targetId
                      AND candidate.movieId IN $bookableMovieIds
                    RETURN candidate.movieId AS movieId,
                           null AS genreName,
                           viewer.userId AS viewerId
                }
                WITH movieId,
                     collect(DISTINCT genreName) AS sharedGenres,
                     collect(DISTINCT viewerId) AS sharedViewers
                MATCH (candidate:Movie {movieId: movieId})
                WITH movieId,
                     head(collect(candidate)) AS candidate,
                     max(size(sharedGenres)) AS sharedGenreCount,
                     max(size(sharedViewers)) AS sharedViewerCount
                RETURN movieId AS movie_id,
                       candidate.title AS title,
                       candidate.genre AS genre,
                       candidate.language AS language,
                       candidate.duration AS duration,
                       sharedGenreCount AS shared_genres,
                       sharedViewerCount AS shared_viewers
                ORDER BY shared_viewers DESC, shared_genres DESC, title ASC
                LIMIT toInteger($limit)
            `,
            {
                movieId: String(movieId),
                bookableMovieIds,
                limit: requestedLimit,
            }
        );

        const recommendations = result.records.map((record) => ({
            movie_id: record.get("movie_id"),
            title: record.get("title"),
            genre: record.get("genre"),
            language: record.get("language"),
            duration: toSafeNumber(record.get("duration")),
            shared_genres: toSafeNumber(record.get("shared_genres")),
            shared_viewers: toSafeNumber(record.get("shared_viewers")),
        }));

        return Response.json({
            success: true,
            movie_id: targetMovie.movieId,
            recommendations,
        });
    } catch (error) {
        console.error(
            `Recommendations ${stage} operation failed:`,
            error.code || error.name
        );

        const authenticationRejected = [
            "Neo.ClientError.Security.Unauthorized",
            "Neo.ClientError.Security.AuthenticationRateLimit",
        ].includes(error.code);

        return Response.json(
            {
                success: false,
                error:
                    stage === "Neo4j"
                        ? authenticationRejected
                            ? "Neo4j rejected the configured credentials. Check NEO4J_USER and NEO4J_PASSWORD in .env.local, then restart Next.js."
                            : "Neo4j recommendations are unavailable. Check the MovieBookDB database, Bolt connection, and NEO4J_PASSWORD."
                        : "Unable to load the MySQL movie catalog for recommendations.",
            },
            { status: stage === "Neo4j" ? 503 : 500 }
        );
    } finally {
        if (session) {
            try {
                await session.close();
            } catch (error) {
                console.error("Recommendations Neo4j session close failed:", error.name);
            }
        }
    }
}
