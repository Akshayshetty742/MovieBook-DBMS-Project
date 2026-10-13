"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MovieArtwork, { formatMovieDuration } from "@/components/movie-artwork";
import { formatCalendarDate } from "@/lib/date-format";

function formatTime(value) {
  if (!value) return "Time not listed";
  const [hourText, minute] = String(value).split(":");
  const hour = Number(hourText);
  if (!Number.isFinite(hour)) return value;
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

function showStart(show) {
  const date = String(show.show_date || "").slice(0, 10);
  const time = String(show.show_time || "00:00:00").slice(0, 8);
  const value = new Date(`${date}T${time}`);
  return Number.isNaN(value.getTime()) ? null : value;
}

export default function MovieDetails({ movieId }) {
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [watchlisted, setWatchlisted] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistUnavailable, setWatchlistUnavailable] = useState(false);
  const [watchlistError, setWatchlistError] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      fetch("/api/movies").then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.movies)) throw new Error(data.error || "Unable to load the movie catalog.");
        return data.movies;
      }),
      fetch("/api/shows").then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.shows)) throw new Error(data.error || "Unable to load showtimes.");
        return data.shows;
      }),
      fetch("/api/watchlist").then(async (response) => ({
        response,
        data: await response.json(),
      })),
    ]).then(([catalogResult, showsResult, savedResult]) => {
      if (!active) return;
      if (catalogResult.status === "rejected" || showsResult.status === "rejected") {
        throw catalogResult.status === "rejected" ? catalogResult.reason : showsResult.reason;
      }
      setMovies(catalogResult.value);
      setShows(showsResult.value);
      if (savedResult.status === "fulfilled") {
        const { response, data } = savedResult.value;
        if (response.status === 503) {
          setWatchlistUnavailable(true);
          setWatchlistError(data.error || "Watchlist is not available until its database migration is installed.");
        } else if (response.ok && data.success && Array.isArray(data.movies)) {
          setWatchlisted(data.movies.some((savedMovie) => String(savedMovie.movie_id) === String(movieId)));
        } else {
          setWatchlistError(data.error || "Unable to check whether this movie is saved.");
        }
      } else {
        setWatchlistError(savedResult.reason?.message || "Unable to check whether this movie is saved.");
      }
    }).catch((fetchError) => {
      if (active) setError(fetchError.message || "Unable to load movie details.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [movieId]);

  useEffect(() => {
    try {
      const recent = JSON.parse(localStorage.getItem("moviebook_recent_movies") || "[]");
      const existing = Array.isArray(recent) ? recent.map(String) : [];
      localStorage.setItem("moviebook_recent_movies", JSON.stringify([
        String(movieId),
        ...existing.filter((id) => id !== String(movieId)),
      ].slice(0, 8)));
    } catch {
      // Recently viewed is a convenience and does not block movie details.
    }
  }, [movieId]);

  const movie = useMemo(
    () => movies.find((item) => String(item.movie_id) === String(movieId)),
    [movies, movieId]
  );
  const movieShows = useMemo(
    () => shows.filter((show) => (
      String(show.movie_id) === String(movieId) &&
      showStart(show) &&
      showStart(show) > new Date()
    )),
    [shows, movieId]
  );

  async function loadRecommendations() {
    if (!movie || !shows.some((show) => String(show.movie_id) === String(movieId))) return;
    setRecommendationLoading(true);
    setRecommendationError("");
    try {
      const response = await fetch(`/api/recommendations?movie_id=${encodeURIComponent(movieId)}`);
      const data = await response.json();
      if (!response.ok || !data.success || !Array.isArray(data.recommendations)) throw new Error(data.error || "Recommendations are unavailable.");
      setRecommendations(data.recommendations);
    } catch (recommendError) {
      setRecommendationError(recommendError.message || "Recommendations are unavailable.");
    } finally {
      setRecommendationLoading(false);
    }
  }

  async function toggleWatchlist() {
    setWatchlistLoading(true);
    setWatchlistError("");
    try {
      const response = await fetch(
        watchlisted ? `/api/watchlist?movie_id=${encodeURIComponent(movieId)}` : "/api/watchlist",
        watchlisted
          ? { method: "DELETE" }
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ movie_id: Number(movieId) }),
            }
      );
      const data = await response.json();
      if (response.status === 503) setWatchlistUnavailable(true);
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to update your watchlist.");
      setWatchlisted((saved) => !saved);
    } catch (saveError) {
      setWatchlistError(saveError.message || "Unable to update your watchlist.");
    } finally {
      setWatchlistLoading(false);
    }
  }

  if (loading) return <p className="page-state" role="status">Loading movie…</p>;
  if (error) return <p className="page-state page-error" role="alert">{error}</p>;
  if (!movie) return <p className="page-state">This movie is not currently available.</p>;
  const hasRecommendationSource = shows.some((show) => String(show.movie_id) === String(movieId));

  return (
    <>
      <Link className="back-link" href="/movies">← All movies</Link>
      <section className="detail-hero">
        <div className="detail-poster"><MovieArtwork movie={movie} index={Number(movieId)} compact /></div>
        <div className="detail-copy">
          <p className="section-eyebrow">MOVIE DETAILS</p>
          <h1>{movie.title}</h1>
          <p className="detail-metadata">{movie.genre || "Genre not listed"} <span>·</span> {formatMovieDuration(movie.duration) || "Duration not listed"} <span>·</span> {movie.language || "Language not listed"}</p>
          {movie.release_date && <p className="detail-metadata">Release date · {formatCalendarDate(movie.release_date)}</p>}
          <p className="detail-note">{movieShows.length ? "Choose a scheduled cinema and showtime to continue to seat selection." : "There are no future showtimes for this movie in the current schedule."}</p>
          <div className="detail-actions">
            {movieShows.length > 0 && <a className="btn-primary inline-action" href="#showtimes">Choose a showtime</a>}
            <button
              className={`btn-secondary detail-watchlist${watchlisted ? " is-saved" : ""}`}
              type="button"
              disabled={watchlistLoading || watchlistUnavailable}
              aria-pressed={watchlisted}
              onClick={toggleWatchlist}
            >
              {watchlistLoading ? "Saving…" : watchlisted ? "♥ Saved to watchlist" : "♡ Save to watchlist"}
            </button>
          </div>
          {watchlistError && <p className="watchlist-feedback" role="status">{watchlistError}</p>}
        </div>
      </section>
      <section id="showtimes" className="detail-section">
        <p className="section-eyebrow">PLAN YOUR VISIT</p>
        <h2>Available showtimes</h2>
        {!movieShows.length ? <p className="page-state">No future shows are scheduled for this movie.</p> : (
          <div className="showtime-cards">
            {movieShows.map((show) => (
              <article className="showtime-card" key={show.show_id}>
                <div><strong>{show.theatre_name}</strong><span>{formatCalendarDate(show.show_date)} · {formatTime(show.show_time)}</span></div>
                <div className="showtime-price">₹{Number(show.price).toFixed(2)}</div>
                <Link className="btn-primary" href={`/?movie=${encodeURIComponent(movieId)}&show=${encodeURIComponent(show.show_id)}#booking-flow`}>Book tickets</Link>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="detail-section recommendation-section">
        <div className="detail-section-heading">
          <div><p className="section-eyebrow">NEO4J GRAPH SUGGESTIONS</p><h2>Similar movies</h2></div>
          <button className="btn-secondary" type="button" disabled={recommendationLoading || !hasRecommendationSource} onClick={loadRecommendations}>
            {recommendationLoading ? "Finding…" : "Find similar movies"}
          </button>
        </div>
          {!hasRecommendationSource && <p className="detail-note">Graph recommendations are not available because this title is not present in the current show schedule.</p>}
        {recommendationError && <p className="page-error" role="alert">{recommendationError}</p>}
        {recommendations.length > 0 && (
          <div className="recommendation-list">
            {recommendations.map((item) => (
              <Link key={item.movie_id} className="recommendation-card" href={`/movies/${item.movie_id}`}>
                <strong>{item.title}</strong>
                <span>{item.genre || "Genre not listed"} · {item.language || "Language not listed"}</span>
                {item.reason && <small>{item.reason}</small>}
              </Link>
            ))}
          </div>
        )}
        {!recommendationLoading && !recommendationError && recommendations.length === 0 && <p className="detail-note">Explore graph-based suggestions using shared movie genres and booking patterns.</p>}
      </section>
    </>
  );
}
