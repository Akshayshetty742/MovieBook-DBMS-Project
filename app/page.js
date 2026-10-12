"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_TICKET_PRICE = 200;
const MAX_SEATS = 10;

const GRADIENTS = [
  "linear-gradient(160deg, #241b3a, #6c3fc9)",
  "linear-gradient(160deg, #2a1414, #b8202f)",
  "linear-gradient(160deg, #2b2410, #d99a2b)",
  "linear-gradient(160deg, #142225, #1f8a7a)",
  "linear-gradient(160deg, #241414, #e8792b)",
  "linear-gradient(160deg, #12151f, #3a3f8a)",
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatDuration(minutes) {
  if (!minutes) return "Feature film";
  const hours = Math.floor(Number(minutes) / 60);
  const mins = Number(minutes) % 60;
  return hours ? `${hours}h ${mins}m` : `${mins}m`;
}

function formatDate(dateString) {
  if (!dateString) return "";
  const s = String(dateString);
  const date = s.includes("T")
    ? new Date(s)
    : new Date(`${s.slice(0, 10)}T00:00:00`);
  if (isNaN(date.getTime())) return s.slice(0, 10);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timeString) {
  if (!timeString) return "";
  const parts = String(timeString).split(":");
  if (parts.length < 2) return String(timeString);
  const hours = Number(parts[0]);
  const minutes = parts[1];
  if (isNaN(hours)) return String(timeString);
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

function toDateInputValue(value) {
  if (!value) return "";
  const s = String(value);
  if (!s.includes("T")) return s.slice(0, 10);
  const d = new Date(s);
  if (isNaN(d.getTime())) return s.slice(0, 10);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/* ------------------------------------------------------------------ */
/*  MovieCard                                                         */
/* ------------------------------------------------------------------ */

function MovieCard({ movie, onBook, onRecommend }) {
  return (
    <div className="movie-card">
      <div
        className="movie-poster"
        style={{ background: movie.gradient }}
      >
        <span className="movie-poster-letter">
          {movie.title?.charAt(0) || "M"}
        </span>
        <span className="movie-rating-badge">
          ★ {Number(movie.rating || 8).toFixed(1)}
        </span>
      </div>
      <div className="movie-card-body">
        <h3 className="movie-title">{movie.title}</h3>
        <p className="movie-meta">
          {movie.genre || "Drama"} &nbsp;•&nbsp;{" "}
          {formatDuration(movie.duration)} &nbsp;•&nbsp;{" "}
          {movie.language || "Not specified"}
        </p>
        <p className="movie-description">
          {movie.description || "Choose a showtime and reserve your seats."}
        </p>
        <div className="movie-card-actions">
          <button className="btn-primary" onClick={() => onBook(movie)}>
            Book Now
          </button>
          <button
            className="btn-secondary"
            onClick={() => onRecommend(movie)}
            type="button"
          >
            Find Similar Movies
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SeatMap                                                           */
/* ------------------------------------------------------------------ */

function SeatMap({ seats, selectedSeatIds, onToggleSeat, loading }) {
  if (loading) {
    return <p className="seat-map-msg">Loading seats…</p>;
  }
  if (!seats || seats.length === 0) {
    return <p className="seat-map-msg">Select a show to view available seats.</p>;
  }

  // Group seats by row letter (first char of seat_number)
  const rows = {};
  for (const seat of seats) {
    const row = seat.seat_number.charAt(0);
    if (!rows[row]) rows[row] = [];
    rows[row].push(seat);
  }

  return (
    <div className="seat-map">
      <div className="seat-screen-label">Screen</div>
      {Object.entries(rows).map(([rowLabel, rowSeats]) => (
        <div key={rowLabel} className="seat-row">
          <span className="seat-row-label">{rowLabel}</span>
          <div className="seat-row-seats">
            {rowSeats.map((seat) => {
              const isBooked = seat.status === "booked";
              const isSelected = selectedSeatIds.includes(seat.seat_id);
              let cls = "seat-btn";
              if (isBooked) cls += " seat-booked";
              else if (isSelected) cls += " seat-selected";
              else cls += " seat-available";
              if (seat.seat_type === "PREMIUM") cls += " seat-premium";

              return (
                <button
                  key={seat.seat_id}
                  className={cls}
                  disabled={isBooked}
                  title={`${seat.seat_number} (${seat.seat_type})${isBooked ? " — Booked" : ""}`}
                  onClick={() => onToggleSeat(seat.seat_id)}
                  type="button"
                >
                  {seat.seat_number.slice(1)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="seat-legend">
        <span><span className="legend-box seat-available" /> Available</span>
        <span><span className="legend-box seat-selected" /> Selected</span>
        <span><span className="legend-box seat-booked" /> Booked</span>
        <span><span className="legend-box seat-premium-legend" /> Premium</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BookingForm (updated with seat map)                               */
/* ------------------------------------------------------------------ */

function BookingForm({
  movie,
  availableShows,
  selectedShowId,
  onShowChange,
  seats,
  seatsLoading,
  selectedSeatIds,
  onToggleSeat,
  onClose,
  onConfirm,
  canConfirm,
  totalPrice,
  submitting,
  error,
}) {
  return (
    <div className="flow-panel">
      <div className="flow-panel-header">
        <div>
          <p className="flow-eyebrow">Booking</p>
          <h3 className="flow-heading">{movie.title}</h3>
        </div>
        <button
          className="btn-close"
          onClick={onClose}
          aria-label="Close booking form"
          type="button"
        >
          ✕
        </button>
      </div>

      <div className="booking-form">
        <label className="form-field">
          <span className="form-label">Available show</span>
          <select
            className="form-select"
            value={selectedShowId}
            onChange={(event) => onShowChange(event.target.value)}
          >
            <option value="">Select a theatre and showtime</option>
            {availableShows.map((show) => (
              <option key={show.show_id} value={String(show.show_id)}>
                {show.theatre_name} — {formatDate(show.show_date)} —{" "}
                {formatTime(show.show_time)} — ₹{Number(show.price || DEFAULT_TICKET_PRICE)}
              </option>
            ))}
          </select>
        </label>

        {/* Seat map appears after a show is selected */}
        {selectedShowId && (
          <div className="form-field">
            <span className="form-label">
              Choose your seats (max {MAX_SEATS})
            </span>
            <SeatMap
              seats={seats}
              selectedSeatIds={selectedSeatIds}
              onToggleSeat={onToggleSeat}
              loading={seatsLoading}
            />
          </div>
        )}

        {error && (
          <div className="booking-error-inline" role="alert">
            {error}
          </div>
        )}
      </div>

      <div className="booking-total-bar">
        <div>
          <p className="summary-label">
            {selectedSeatIds.length} seat{selectedSeatIds.length !== 1 ? "s" : ""} selected
          </p>
          <p className="summary-value summary-price">₹{totalPrice}</p>
        </div>
        <button
          className="btn-primary btn-confirm"
          disabled={!canConfirm || submitting}
          onClick={onConfirm}
          type="button"
        >
          {submitting ? "Booking…" : "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ConfirmationPanel                                                 */
/* ------------------------------------------------------------------ */

function ConfirmationPanel({ booking, onBookAnother }) {
  return (
    <div className="flow-panel confirmation-panel">
      <div className="confirm-check">✓</div>
      <h3 className="flow-heading">Booking Confirmed Successfully!</h3>
      <p className="confirm-id">Booking ID: #{booking.booking_id}</p>
      <div className="confirm-summary">
        <span>{booking.movieTitle}</span>
        <span>{booking.theatre}</span>
        <span>
          {formatDate(booking.date)} &nbsp;•&nbsp; {formatTime(booking.show_time)}
        </span>
        <span>
          {booking.seat_count} seat{booking.seat_count > 1 ? "s" : ""} &nbsp;•&nbsp; ₹
          {booking.total_amount}
        </span>
        {booking.seatLabels && (
          <span className="confirm-seats">Seats: {booking.seatLabels}</span>
        )}
        <span className="confirm-payment-note">
          Payment Status: SUCCESS (Simulated UPI Demo)
        </span>
      </div>
      <div className="confirm-actions">
        <button className="btn-primary" onClick={onBookAnother} type="button">
          Book Another Movie
        </button>
        <a className="btn-secondary" href="#bookings">
          View My Bookings
        </a>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BookingCard                                                       */
/* ------------------------------------------------------------------ */

function BookingCard({ booking }) {
  const seatLabel =
    booking.seats && booking.seats.length > 0
      ? booking.seats.map((s) => s.seat_number).join(", ")
      : `${booking.seat_count || 0} seat(s)`;

  return (
    <div className="booking-card">
      <div className="booking-card-header">
        <span className="booking-id">#{booking.booking_id}</span>
        <span className={
          "booking-status" +
          (booking.booking_status === "CANCELLED" ? " booking-status-cancelled" : "")
        }>
          {booking.booking_status}
        </span>
      </div>
      <h4 className="booking-movie">{booking.movie_title || booking.movieTitle}</h4>
      <p className="booking-theatre">{booking.theatre_name || booking.theatre}</p>
      <div className="booking-details">
        <div>
          <p className="summary-label">Date</p>
          <p className="summary-value">{formatDate(booking.show_date || booking.date)}</p>
        </div>
        <div>
          <p className="summary-label">Showtime</p>
          <p className="summary-value">{formatTime(booking.show_time)}</p>
        </div>
        <div>
          <p className="summary-label">Seats</p>
          <p className="summary-value">{seatLabel}</p>
        </div>
        <div>
          <p className="summary-label">Total</p>
          <p className="summary-value summary-price">₹{booking.total_amount}</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Home (main page component)                                        */
/* ------------------------------------------------------------------ */

export default function Home() {
  const [dbShows, setDbShows] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [moviesError, setMoviesError] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedShowId, setSelectedShowId] = useState("");
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [recommendationMovie, setRecommendationMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState("");
  const recommendationRequestId = useRef(0);
  const [step, setStep] = useState("idle"); // idle | form | confirmed
  const [lastBooking, setLastBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Seat selection state
  const [seats, setSeats] = useState([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);

  /* ---- Load shows on mount ---- */
  useEffect(() => {
    let isMounted = true;

    async function loadShows() {
      try {
        const response = await fetch("/api/shows");
        const data = await response.json();

        if (!response.ok || !data.success || !Array.isArray(data.shows)) {
          throw new Error(data.error || "The shows API returned an unexpected response.");
        }

        if (isMounted) {
          setDbShows(data.shows);
          setMoviesError("");
        }
      } catch (error) {
        if (isMounted) {
          setMoviesError(error.message || "Unable to load movies from MySQL.");
        }
      } finally {
        if (isMounted) setMoviesLoading(false);
      }
    }

    loadShows();
    return () => {
      isMounted = false;
    };
  }, []);

  /* ---- Load bookings from MySQL on mount ---- */
  useEffect(() => {
    let isMounted = true;

    async function loadBookings() {
      try {
        const response = await fetch("/api/bookings");
        const data = await response.json();
        if (response.ok && data.success && Array.isArray(data.bookings)) {
          if (isMounted) setBookings(data.bookings);
        }
      } catch {
        // silently ignore – bookings section will just show empty
      } finally {
        if (isMounted) setBookingsLoading(false);
      }
    }

    loadBookings();
    return () => {
      isMounted = false;
    };
  }, []);

  /* ---- Deduplicate shows into unique movies ---- */
  const movies = useMemo(() => {
    const uniqueMovies = new Map();

    dbShows.forEach((show) => {
      const key = String(show.movie_title || `movie-${show.show_id}`);
      if (!uniqueMovies.has(key)) {
        uniqueMovies.set(key, {
          movie_id: show.movie_id,
          title: show.movie_title || "Untitled movie",
          genre: show.genre || "Drama",
          duration: Number(show.duration) || 120,
          language: show.language || "Not specified",
          rating: Number(show.rating) || 8,
          description: "Select a show to see its theatre, date, time and ticket price.",
          gradient: GRADIENTS[uniqueMovies.size % GRADIENTS.length],
        });
      }
    });

    return Array.from(uniqueMovies.values());
  }, [dbShows]);

  /* ---- Derived state ---- */
  const selectedShow = dbShows.find(
    (show) => String(show.show_id) === String(selectedShowId)
  );

  const availableShows = selectedMovie
    ? dbShows.filter((show) => show.movie_title === selectedMovie.title)
    : [];

  const ticketPrice = Number(selectedShow?.price || DEFAULT_TICKET_PRICE);
  const totalPrice = selectedSeatIds.length * ticketPrice;
  const canConfirm = Boolean(selectedShowId) && selectedSeatIds.length >= 1;

  /* ---- Fetch seats when show changes ---- */
  const loadSeats = useCallback(async (showId) => {
    if (!showId) {
      setSeats([]);
      setSelectedSeatIds([]);
      return;
    }

    setSeatsLoading(true);

    try {
      const response = await fetch(`/api/seats?show_id=${showId}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setSeats(data.seats);
        // Filter out any previously selected seats that are now booked
        setSelectedSeatIds((prev) => {
          const bookedIds = new Set(
            data.seats
              .filter((s) => s.status === "booked")
              .map((s) => s.seat_id)
          );
          return prev.filter((id) => !bookedIds.has(id));
        });
      } else {
        setSeats([]);
      }
    } catch {
      setSeats([]);
    } finally {
      setSeatsLoading(false);
    }
  }, []);

  /* ---- Handlers ---- */

  function handleBook(movie) {
    setSelectedMovie(movie);
    setSelectedShowId("");
    setSelectedSeatIds([]);
    setSeats([]);
    setStep("form");
    setLastBooking(null);
    setMoviesError("");
    setTimeout(() => {
      document.getElementById("booking-flow")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  async function handleRecommend(movie) {
    const requestId = ++recommendationRequestId.current;
    setRecommendationMovie(movie);
    setRecommendations([]);
    setRecommendationsError("");
    setRecommendationsLoading(true);

    try {
      const response = await fetch(
        `/api/recommendations?movie_id=${encodeURIComponent(movie.movie_id)}`
      );
      const data = await response.json();

      if (!response.ok || !data.success || !Array.isArray(data.recommendations)) {
        throw new Error(data.error || "Unable to load graph recommendations.");
      }

      if (requestId === recommendationRequestId.current) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      if (requestId === recommendationRequestId.current) {
        setRecommendationsError(
          error.message || "Unable to load graph recommendations."
        );
      }
    } finally {
      if (requestId === recommendationRequestId.current) {
        setRecommendationsLoading(false);
      }
    }
  }

  function handleShowChange(showId) {
    setSelectedShowId(showId);
    setSelectedSeatIds([]);
    loadSeats(showId);
  }

  function handleToggleSeat(seatId) {
    setSelectedSeatIds((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      }
      if (prev.length >= MAX_SEATS) return prev;
      return [...prev, seatId];
    });
  }

  async function handleConfirmBooking() {
    if (!selectedMovie || !selectedShow || selectedSeatIds.length === 0) return;

    setMoviesError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          show_id: Number(selectedShow.show_id),
          seat_ids: selectedSeatIds,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Booking failed.");
      }

      // Build seat labels from the seats array
      const seatLabels = selectedSeatIds
        .map((id) => {
          const s = seats.find((seat) => seat.seat_id === id);
          return s ? s.seat_number : id;
        })
        .join(", ");

      const newBooking = {
        booking_id: data.booking_id,
        movieTitle: selectedMovie.title,
        theatre: selectedShow.theatre_name,
        date: toDateInputValue(selectedShow.show_date),
        show_time: selectedShow.show_time,
        seat_count: data.seat_count,
        total_amount: data.total_amount,
        booking_status: "CONFIRMED",
        seatLabels,
      };

      setLastBooking(newBooking);
      setStep("confirmed");

      // Refresh bookings list from server so My Bookings is up to date
      try {
        const bkRes = await fetch("/api/bookings");
        const bkData = await bkRes.json();
        if (bkRes.ok && bkData.success) setBookings(bkData.bookings);
      } catch {
        // If the refresh fails, at least prepend the new booking locally
        setBookings((prev) => [
          {
            ...newBooking,
            movie_title: newBooking.movieTitle,
            theatre_name: newBooking.theatre,
            show_date: newBooking.date,
            seats: [],
          },
          ...prev,
        ]);
      }
    } catch (error) {
      setMoviesError(error.message || "Unable to create booking.");
      if (selectedShow?.show_id) {
        loadSeats(selectedShow.show_id);
      }
      setTimeout(() => {
        document.getElementById("booking-error")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 50);
    } finally {
      setSubmitting(false);
    }
  }

  function resetFlow() {
    setSelectedMovie(null);
    setSelectedShowId("");
    setSelectedSeatIds([]);
    setSeats([]);
    setStep("idle");
    setLastBooking(null);
  }

  /* ---- Render ---- */

  return (
    <>
      <nav className="navbar">
        <a href="#home" className="logo">
          Movie<span className="logo-accent">Book</span>
        </a>
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#movies">Movies</a>
          <a href="#bookings">My Bookings</a>
        </div>
      </nav>

      <header id="home" className="hero">
        <div className="hero-content">
          <h1 className="hero-heading">Book Your Favorite Movies</h1>
          <p className="hero-subtext">
            Pick a movie, choose your theatre and showtime, and reserve your
            seats in a few taps. No queues, no guesswork.
          </p>
          <a href="#movies" className="btn-primary hero-btn">
            Explore Movies
          </a>
        </div>
      </header>

      <section id="movies" className="movies-section">
        <h2 className="section-heading">Now Showing</h2>

        {moviesLoading ? (
          <p className="empty-state">Loading movies from MySQL…</p>
        ) : moviesError && step === "idle" ? (
          <div className="empty-state">
            <p>Could not load movies from MySQL.</p>
            <p>{moviesError}</p>
            <button
              className="btn-primary"
              type="button"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : movies.length === 0 ? (
          <p className="empty-state">No movies are currently available.</p>
        ) : (
          <div className="movies-grid">
            {movies.map((movie) => (
              <MovieCard
                key={movie.title}
                movie={movie}
                onBook={handleBook}
                onRecommend={handleRecommend}
              />
            ))}
          </div>
        )}

        {recommendationMovie && (
          <section className="recommendations-panel" aria-live="polite">
            <div className="recommendations-heading">
              <div>
                <p className="recommendations-eyebrow">Neo4j graph suggestions</p>
                <h3 className="recommendations-title">
                  More like {recommendationMovie.title}
                </h3>
              </div>
              <button
                className="btn-close"
                type="button"
                aria-label="Close recommendations"
                onClick={() => {
                  recommendationRequestId.current += 1;
                  setRecommendationMovie(null);
                  setRecommendationsLoading(false);
                }}
              >
                ✕
              </button>
            </div>

            {recommendationsLoading ? (
              <p className="empty-state">Finding recommendations…</p>
            ) : recommendationsError ? (
              <p className="recommendations-error" role="alert">
                {recommendationsError}
              </p>
            ) : recommendations.length === 0 ? (
              <p className="empty-state">
                No related movies were found in the current graph yet.
              </p>
            ) : (
              <div className="recommendations-grid">
                {recommendations.map((movie) => (
                  <article className="recommendation-card" key={movie.movie_id}>
                    <div>
                      <h4>{movie.title}</h4>
                      <p className="movie-meta">
                        {movie.genre || "Genre not specified"}
                        {movie.language ? ` · ${movie.language}` : ""}
                      </p>
                      <p className="recommendation-reason">
                        {movie.shared_genres > 0
                          ? `${movie.shared_genres} shared genre${movie.shared_genres === 1 ? "" : "s"}`
                          : " "}
                        {movie.shared_viewers > 0
                          ? `${movie.shared_genres > 0 ? " · " : ""}${movie.shared_viewers} shared viewer${movie.shared_viewers === 1 ? "" : "s"}`
                          : ""}
                      </p>
                    </div>
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => handleBook(movie)}
                    >
                      Book this movie
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </section>

      {/* Error banner during booking flow */}
      {moviesError && step !== "idle" && (
        <div className="booking-error" id="booking-error">
          <p>{moviesError}</p>
        </div>
      )}

      {selectedMovie && step !== "idle" && (
        <section className="booking-flow" id="booking-flow">
          {step === "form" && (
            <BookingForm
              movie={selectedMovie}
              availableShows={availableShows}
              selectedShowId={selectedShowId}
              onShowChange={handleShowChange}
              seats={seats}
              seatsLoading={seatsLoading}
              selectedSeatIds={selectedSeatIds}
              onToggleSeat={handleToggleSeat}
              onClose={resetFlow}
              onConfirm={handleConfirmBooking}
              canConfirm={canConfirm}
              totalPrice={totalPrice}
              submitting={submitting}
              error={moviesError}
            />
          )}

          {step === "confirmed" && lastBooking && (
            <ConfirmationPanel
              booking={lastBooking}
              onBookAnother={resetFlow}
            />
          )}
        </section>
      )}

      <section id="bookings" className="bookings-section">
        <h2 className="section-heading">My Bookings</h2>
        {bookingsLoading ? (
          <p className="empty-state">Loading bookings…</p>
        ) : bookings.length === 0 ? (
          <p className="empty-state">
            No bookings found. Pick a movie above to get started.
          </p>
        ) : (
          <div className="bookings-grid">
            {bookings.map((booking) => (
              <BookingCard key={booking.booking_id} booking={booking} />
            ))}
          </div>
        )}
      </section>

      <footer className="footer">
        <p>
          MovieBook — a college DBMS project demo. Not for real transactions.
        </p>
      </footer>
    </>
  );
}
