"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MovieCard } from "@/components/movie-listing";

export default function WatchlistPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/watchlist").then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.movies)) throw new Error(data.error || "Unable to load the watchlist.");
        return data.movies;
      }),
      fetch("/api/shows").then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.shows)) throw new Error(data.error || "Unable to load showtimes.");
        return data.shows;
      }),
    ]).then(([saved, shows]) => {
      if (!active) return;
      const schedule = new Map();
      for (const show of shows) {
        const id = String(show.movie_id);
        if (!schedule.has(id)) schedule.set(id, []);
        schedule.get(id).push(show);
      }
      setMovies(saved.map((movie) => ({
        ...movie,
        title: movie.title,
        duration: Number(movie.duration) || 0,
        shows: schedule.get(String(movie.movie_id)) || [],
      })));
    })
      .catch((fetchError) => {
        if (active) setLoadError(fetchError.message || "Unable to load the watchlist.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function remove(movieId) {
    setActionError("");
    setBusyId(movieId);
    try {
      const response = await fetch(`/api/watchlist?movie_id=${encodeURIComponent(movieId)}`, { method: "DELETE" });
      const data = await response.json();
      if (response.status === 503) {
        throw new Error(data.error || "The watchlist feature is not available until its database migration is installed.");
      }
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to remove this movie.");
      setMovies((items) => items.filter((movie) => String(movie.movie_id) !== String(movieId)));
    } catch (removeError) {
      setActionError(removeError.message || "Unable to remove this movie.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <section className="page-heading">
        <p className="section-eyebrow">YOUR SAVED MOVIES</p>
        <h1>Watchlist</h1>
        <p>Keep track of the movies you want to explore.</p>
      </section>
      {loading ? <p className="page-state" role="status">Loading your watchlist…</p> :
        loadError ? <p className="page-state page-error" role="alert">{loadError}</p> :
          !movies.length ? (
            <div className="page-state empty-bookings">
              <h2>Your watchlist is ready</h2>
              <p>Save movies from the discovery page to keep them close.</p>
              <Link className="btn-primary inline-action" href="/movies">Explore movies</Link>
            </div>
          ) : (
            <>
              {actionError && <p className="watchlist-feedback" role="alert">{actionError}</p>}
              <div className="discovery-grid">
                {movies.map((movie, index) => (
                  <MovieCard
                    key={movie.movie_id}
                    movie={movie}
                    index={index}
                    watchlisted
                    onToggleWatchlist={remove}
                    watchlistBusy={busyId === movie.movie_id}
                  />
                ))}
              </div>
            </>
          )}
    </>
  );
}
