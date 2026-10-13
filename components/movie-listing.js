"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MovieArtwork, { formatMovieDuration } from "@/components/movie-artwork";

function formatDuration(value) {
  const minutes = Number(value);
  if (!minutes) return null;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function showStart(show) {
  const date = String(show.show_date || "").slice(0, 10);
  const time = String(show.show_time || "00:00:00").slice(0, 8);
  const result = new Date(`${date}T${time}`);
  return Number.isNaN(result.getTime()) ? null : result;
}

export function MovieCard({ movie, index, watchlisted, onToggleWatchlist, watchlistBusy, watchlistUnavailable = false }) {
  const bookableShows = movie.shows.filter((show) => {
    const date = showStart(show);
    return date && date > new Date();
  });

  return (
    <article className="discovery-card">
      <Link className="discovery-poster-link" href={`/movies/${movie.movie_id}`} aria-label={`View ${movie.title} details`}>
        <MovieArtwork movie={movie} index={index} />
        <span className="poster-topline">{bookableShows.length ? `${bookableShows.length} SHOW${bookableShows.length === 1 ? "" : "S"} AVAILABLE` : "NO CURRENT SHOWS"}</span>
      </Link>
      <button
        className={`watchlist-toggle${watchlisted ? " is-saved" : ""}`}
        type="button"
        disabled={watchlistBusy || watchlistUnavailable}
        aria-label={watchlisted ? `Remove ${movie.title} from watchlist` : `Add ${movie.title} to watchlist`}
        aria-pressed={watchlisted}
        onClick={() => onToggleWatchlist(movie.movie_id)}
      >
        {watchlistUnavailable ? "♡ Unavailable" : watchlisted ? "♥ Saved" : "♡ Watchlist"}
      </button>
      <div className="discovery-card-copy">
        <div className="discovery-card-meta">
          <span>{movie.genre || "Genre not listed"}</span>
          {movie.language && <><i>·</i><span>{movie.language}</span></>}
          {movie.duration && <><i>·</i><span>{formatMovieDuration(movie.duration)}</span></>}
        </div>
        <h2><Link href={`/movies/${movie.movie_id}`}>{movie.title}</Link></h2>
        <p className="discovery-card-availability">
          {bookableShows.length
            ? `${bookableShows.length} upcoming show${bookableShows.length === 1 ? "" : "s"}`
            : "No future showtimes currently listed"}
        </p>
        <div className="discovery-card-actions">
          <Link className="btn-secondary" href={`/movies/${movie.movie_id}`}>View details</Link>
          {bookableShows.length > 0 ? (
            <Link className="btn-primary" href={`/movies/${movie.movie_id}#showtimes`}>Book tickets</Link>
          ) : (
            <span className="btn-unavailable" aria-label="Booking unavailable">Unavailable</span>
          )}
        </div>
      </div>
    </article>
  );
}

function MovieSection({ title, eyebrow, movies, allMovies, onToggleWatchlist, watchlist, watchlistBusy, watchlistUnavailable, emptyText }) {
  return (
    <section className="movie-discovery-section">
      <div className="discovery-section-heading">
        <div><p className="section-eyebrow">{eyebrow}</p><h2>{title}</h2></div>
        <span>{movies.length} title{movies.length === 1 ? "" : "s"}</span>
      </div>
      {!movies.length ? (
        <p className="discovery-empty">{emptyText || "No titles match this section and the current filters."}</p>
      ) : (
        <div className="discovery-grid">
          {movies.map((movie) => (
            <MovieCard
              key={movie.movie_id}
              movie={movie}
              index={allMovies.findIndex((item) => item.movie_id === movie.movie_id)}
              watchlisted={watchlist.has(String(movie.movie_id))}
              onToggleWatchlist={onToggleWatchlist}
              watchlistBusy={watchlistBusy === movie.movie_id}
              watchlistUnavailable={watchlistUnavailable}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function MovieListing() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState("title");
  const [watchlist, setWatchlist] = useState(new Set());
  const [watchlistError, setWatchlistError] = useState("");
  const [watchlistUnavailable, setWatchlistUnavailable] = useState(false);
  const [watchlistBusy, setWatchlistBusy] = useState(null);
  const [recentIds, setRecentIds] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([
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
      fetch("/api/watchlist").then(async (response) => {
        const data = await response.json();
        if (response.status === 503) return { movies: [], unavailable: true, message: data.error };
        if (!response.ok || !data.success || !Array.isArray(data.movies)) throw new Error(data.error || "Unable to load the watchlist.");
        return { movies: data.movies, unavailable: false, message: "" };
      }).catch((watchlistFetchError) => ({
        movies: [],
        unavailable: false,
        message: watchlistFetchError.message || "Watchlist status could not be checked.",
      })),
    ]).then(([catalog, shows, saved]) => {
      if (!active) return;
      const schedule = new Map();
      for (const show of shows) {
        const id = String(show.movie_id);
        if (!schedule.has(id)) schedule.set(id, []);
        schedule.get(id).push(show);
      }
      setMovies(catalog
        .filter((movie) => movie.status === "ACTIVE")
        .map((movie) => ({
          movie_id: movie.movie_id,
          title: movie.title,
          genre: movie.genre,
          language: movie.language,
          duration: Number(movie.duration) || 0,
          release_date: movie.release_date,
          status: movie.status,
          shows: schedule.get(String(movie.movie_id)) || [],
        })));
      setWatchlist(new Set(saved.movies.map((movie) => String(movie.movie_id))));
      setWatchlistUnavailable(saved.unavailable);
      setWatchlistError(saved.message);
    }).catch((loadError) => {
      if (active) setError(loadError.message || "Unable to load movie discovery.");
    }).finally(() => {
      if (active) setLoading(false);
    });

    try {
      const stored = JSON.parse(localStorage.getItem("moviebook_recent_movies") || "[]");
      if (active && Array.isArray(stored)) {
        const recent = stored.filter((item) => Number.isSafeInteger(Number(item))).slice(0, 8).map(String);
        queueMicrotask(() => {
          if (active) setRecentIds(recent);
        });
      }
    } catch {
      console.warn("Recently viewed movies could not be loaded from this browser.");
    }
    return () => { active = false; };
  }, []);

  const genres = useMemo(() => [...new Set(movies.map((movie) => movie.genre).filter(Boolean))].sort(), [movies]);
  const languages = useMemo(() => [...new Set(movies.map((movie) => movie.language).filter(Boolean))].sort(), [movies]);
  const filtered = useMemo(() => movies
    .filter((movie) => (
      movie.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) &&
      (!genre || movie.genre === genre) &&
      (!language || movie.language === language)
    ))
    .sort((a, b) => {
      if (sort === "duration") return (a.duration || Number.MAX_SAFE_INTEGER) - (b.duration || Number.MAX_SAFE_INTEGER) || a.title.localeCompare(b.title);
      if (sort === "availability") return b.shows.filter((show) => showStart(show) > new Date()).length - a.shows.filter((show) => showStart(show) > new Date()).length || a.title.localeCompare(b.title);
      return a.title.localeCompare(b.title);
    }), [movies, query, genre, language, sort]);

  const { nowShowing, upcoming } = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    const now = new Date();
    const current = [];
    const next = [];
    for (const movie of filtered) {
      const validDates = movie.shows.map(showStart).filter(Boolean);
      if (validDates.some((date) => date >= now && date < startOfTomorrow)) current.push(movie);
      else if (validDates.some((date) => date >= startOfTomorrow)) next.push(movie);
    }
    return { nowShowing: current, upcoming: next };
  }, [filtered]);

  const featured = filtered.find((movie) => movie.shows.some((show) => showStart(show) > new Date())) || filtered[0];
  const recentMovies = recentIds
    .map((id) => movies.find((movie) => String(movie.movie_id) === id))
    .filter((movie) => movie && filtered.includes(movie) && !nowShowing.includes(movie) && !upcoming.includes(movie));
  const recentlyViewedIds = new Set(recentMovies.map((movie) => String(movie.movie_id)));
  const clearFilters = () => { setQuery(""); setGenre(""); setLanguage(""); setSort("title"); };

  async function toggleWatchlist(movieId) {
    const isSaved = watchlist.has(String(movieId));
    setWatchlistError("");
    setWatchlistBusy(movieId);
    try {
      const response = await fetch(isSaved ? `/api/watchlist?movie_id=${encodeURIComponent(movieId)}` : "/api/watchlist", {
        method: isSaved ? "DELETE" : "POST",
        ...(isSaved ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ movie_id: movieId }) }),
      });
      const data = await response.json();
      if (response.status === 503) setWatchlistUnavailable(true);
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to update your watchlist.");
      setWatchlist((current) => {
        const next = new Set(current);
        if (isSaved) next.delete(String(movieId));
        else next.add(String(movieId));
        return next;
      });
    } catch (toggleError) {
      setWatchlistError(toggleError.message || "Unable to update your watchlist.");
    } finally {
      setWatchlistBusy(null);
    }
  }

  if (loading) return <div className="discovery-loading" role="status"><span className="loading-orb" />Loading the movie collection…</div>;
  if (error) {
    return <div className="page-state page-error" role="alert"><p>{error}</p><button className="btn-secondary" type="button" onClick={() => window.location.reload()}>Try again</button></div>;
  }

  return (
    <>
      {featured && (
        <section className="featured-film" aria-labelledby="featured-movie-title">
          <MovieArtwork movie={featured} index={movies.indexOf(featured)} compact />
          <div className="featured-film-content">
            <p className="section-eyebrow">{featured.shows.some((show) => showStart(show) > new Date()) ? "FEATURED · SHOWS AVAILABLE" : "FEATURED FROM THE MOVIE CATALOG"}</p>
            <h2 id="featured-movie-title">{featured.title}</h2>
            <p>{[featured.genre, featured.language, formatDuration(featured.duration)].filter(Boolean).join(" · ")}</p>
            <Link className="btn-primary" href={`/movies/${featured.movie_id}`}>Explore film</Link>
          </div>
          <span className="featured-film-index">FEATURED FILM</span>
        </section>
      )}
      <section className="discovery-toolbar" aria-label="Movie filters">
        <label className="discovery-search">
          <span>Find a film</span>
          <input className="form-input" type="search" value={query} placeholder="Search by movie title" onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          <span>Genre</span>
          <select className="form-select" value={genre} onChange={(event) => setGenre(event.target.value)}>
            <option value="">All genres</option>
            {genres.map((value) => <option value={value} key={value}>{value}</option>)}
          </select>
        </label>
        <label>
          <span>Language</span>
          <select className="form-select" value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="">All languages</option>
            {languages.map((value) => <option value={value} key={value}>{value}</option>)}
          </select>
        </label>
        <label>
          <span>Sort by</span>
          <select className="form-select" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="title">Title A–Z</option>
            <option value="duration">Duration</option>
            <option value="availability">Show availability</option>
          </select>
        </label>
        <div className="filter-result" role="status" aria-live="polite">
          <span>{filtered.length} of {movies.length} movies</span>
          <button type="button" onClick={clearFilters} disabled={!query && !genre && !language && sort === "title"}>Clear filters</button>
        </div>
      </section>
      {watchlistError && <p className="watchlist-feedback" role="status">{watchlistError}</p>}

      <MovieSection title="Now Showing" eyebrow="CATCH IT ON THE BIG SCREEN" movies={nowShowing} allMovies={movies} onToggleWatchlist={toggleWatchlist} watchlist={watchlist} watchlistBusy={watchlistBusy} watchlistUnavailable={watchlistUnavailable} emptyText="No movies have a future showtime scheduled for today." />
      <MovieSection title="Coming Up" eyebrow="SCHEDULED FOR A FUTURE DATE" movies={upcoming} allMovies={movies} onToggleWatchlist={toggleWatchlist} watchlist={watchlist} watchlistBusy={watchlistBusy} watchlistUnavailable={watchlistUnavailable} emptyText="No future showtimes are currently scheduled." />

      {recentMovies.length > 0 && (
        <section className="movie-discovery-section">
          <div className="discovery-section-heading"><div><p className="section-eyebrow">PICK UP WHERE YOU LEFT OFF</p><h2>Recently Viewed</h2></div><span>Saved on this device</span></div>
          <div className="discovery-grid">
            {recentMovies.map((movie) => <MovieCard key={`recent-${movie.movie_id}`} movie={movie} index={movies.indexOf(movie)} watchlisted={watchlist.has(String(movie.movie_id))} onToggleWatchlist={toggleWatchlist} watchlistBusy={watchlistBusy === movie.movie_id} watchlistUnavailable={watchlistUnavailable} />)}
          </div>
        </section>
      )}

      <MovieSection
        title="More from the Catalog"
        eyebrow="TITLES WITHOUT CURRENT FUTURE SHOWTIMES"
        movies={filtered.filter((movie) => (
          !nowShowing.includes(movie) &&
          !upcoming.includes(movie) &&
          !recentlyViewedIds.has(String(movie.movie_id))
        ))}
        allMovies={movies}
        onToggleWatchlist={toggleWatchlist}
        watchlist={watchlist}
        watchlistBusy={watchlistBusy}
        watchlistUnavailable={watchlistUnavailable}
        emptyText={filtered.length ? "Every matching movie is shown in the scheduled or recently viewed sections above." : "No movies match your current filters."}
      />
    </>
  );
}
