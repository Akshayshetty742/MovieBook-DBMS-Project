"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteNav from "@/components/site-nav";
import SiteFooter from "@/components/site-footer";
import MovieArtwork from "@/components/movie-artwork";
import { formatCalendarDate } from "@/lib/date-format";

const DEFAULT_TICKET_PRICE = 200;
const MAX_SEATS = 10;
const initialJsonRequests = new Map();

function fetchInitialJson(path) {
  const existingRequest = initialJsonRequests.get(path);
  if (existingRequest) return existingRequest;

  const request = fetch(path).then(async (response) => ({
    response,
    data: await response.json(),
  }));

  initialJsonRequests.set(path, request);
  request.then(
    () => {
      if (initialJsonRequests.get(path) === request) {
        initialJsonRequests.delete(path);
      }
    },
    () => {
      if (initialJsonRequests.get(path) === request) {
        initialJsonRequests.delete(path);
      }
    }
  );

  return request;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatDuration(minutes) {
  if (!minutes) return "Feature film";
  const hours = Math.floor(Number(minutes) / 60);
  const mins = Number(minutes) % 60;
  return hours ? `${hours}h ${mins}m` : `${mins}m`;
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

function isBookableShow(show) {
  const datePart = String(show?.show_date || "").slice(0, 10);
  const timePart = String(show?.show_time || "00:00:00").slice(0, 8);
  const date = new Date(`${datePart}T${timePart}`);
  return !Number.isNaN(date.getTime()) && date > new Date();
}

function getGenreNames(value) {
  return String(value || "")
    .split(/[,;|/]/)
    .map((genre) => genre.trim())
    .filter(Boolean);
}

/* ------------------------------------------------------------------ */
/*  MovieCard                                                         */
/* ------------------------------------------------------------------ */

function MovieCard({ movie, onBook, onRecommend, onDetails }) {
  const bookable = movie.shows?.some(isBookableShow);
  const bookableShows = movie.shows?.filter(isBookableShow) || [];
  return (
    <div className="movie-card">
      <div className="movie-poster">
        <MovieArtwork movie={movie} index={Number(movie.movie_id) || 0} />
        <span className="movie-show-count">
          {bookable ? `${bookableShows.length} available show${bookableShows.length === 1 ? "" : "s"}` : "No future shows"}
        </span>
      </div>
      <div className="movie-card-body">
        <h3 className="movie-title">{movie.title}</h3>
        <p className="movie-meta">
          {movie.genre || "Drama"} &nbsp;•&nbsp;{" "}
          {formatDuration(movie.duration)} &nbsp;•&nbsp;{" "}
          {movie.language || "Not specified"}
        </p>
        <p className="movie-release">
          {movie.release_date
            ? `Released ${formatCalendarDate(movie.release_date)}`
            : "Release date not listed"}
        </p>
        <p className="movie-description">
          {movie.description || "Choose a showtime and reserve your seats."}
        </p>
        <div className="movie-card-actions">
          <button
            className="btn-secondary"
            onClick={() => onDetails(movie)}
            type="button"
          >
            Movie details
          </button>
          {bookable ? (
            <button className="btn-primary" onClick={() => onBook(movie)}>Book Now</button>
          ) : (
            <span className="btn-unavailable" aria-label="No future showtimes">Unavailable</span>
          )}
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

function SeatMap({
  seats,
  selectedSeatIds,
  onToggleSeat,
  loading,
  error,
  onRetry,
}) {
  if (loading) {
    return <p className="seat-map-msg">Loading seats…</p>;
  }
  if (error) {
    return (
      <div className="seat-map-msg seat-map-error" role="alert">
        <p>{error}</p>
        <button className="btn-secondary" onClick={onRetry} type="button">
          Retry loading seats
        </button>
      </div>
    );
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
  seatsError,
  onRetrySeats,
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
                {show.theatre_name} — {formatCalendarDate(show.show_date)} —{" "}
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
              error={seatsError}
              onRetry={onRetrySeats}
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
          {submitting ? "Preparing…" : "Review booking"}
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
          {formatCalendarDate(booking.date)} &nbsp;•&nbsp; {formatTime(booking.show_time)}
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
        <Link className="btn-secondary" href={`/booking-confirmation/${booking.booking_id}`}>View confirmation</Link>
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
          <p className="summary-value">{formatCalendarDate(booking.show_date || booking.date)}</p>
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
  const router = useRouter();
  const [dbShows, setDbShows] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [moviesError, setMoviesError] = useState("");
  const [authUser, setAuthUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [movieSort, setMovieSort] = useState("title");
  const [detailsMovie, setDetailsMovie] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedShowId, setSelectedShowId] = useState("");
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState("");
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
  const [seatsError, setSeatsError] = useState("");
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const seatRequestId = useRef(0);
  const queryBookingHandled = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const { response, data } = await fetchInitialJson("/api/auth/me");
        if (isMounted && response.ok && data.success && data.user) {
          setAuthUser(data.user);
        } else if (isMounted && response.status !== 401) {
          setAuthError(data.error || "Unable to check your account session.");
        }
      } catch {
        if (isMounted) {
          setAuthError("Unable to reach the account service. Please try again.");
        }
      } finally {
        if (isMounted) setAuthChecked(true);
      }
    }

    loadSession();
    return () => {
      isMounted = false;
    };
  }, []);

  /* ---- Load shows on mount ---- */
  useEffect(() => {
    let isMounted = true;

    async function loadShows() {
      try {
        const { response, data } = await fetchInitialJson("/api/shows");

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

    if (!authChecked) {
      return () => {
        isMounted = false;
      };
    }

    if (!authUser) {
      return () => {
        isMounted = false;
      };
    }

    async function loadBookings() {
      try {
        const { response, data } = await fetchInitialJson("/api/bookings");
        if (response.ok && data.success && Array.isArray(data.bookings)) {
          if (isMounted) {
            setBookings(data.bookings);
            setBookingsError("");
          }
        } else if (isMounted) {
          setBookingsError(data.error || "Unable to load your bookings.");
        }
      } catch (error) {
        if (isMounted) {
          setBookingsError(error.message || "Unable to load your bookings.");
        }
      } finally {
        if (isMounted) setBookingsLoading(false);
      }
    }

    loadBookings();
    return () => {
      isMounted = false;
    };
  }, [authChecked, authUser]);

  /* ---- Deduplicate shows into unique movies ---- */
  const movies = useMemo(() => {
    const uniqueMovies = new Map();

    dbShows.forEach((show) => {
      const key = String(
        show.movie_id ?? `title:${show.movie_title || `show-${show.show_id}`}`
      );
      if (!uniqueMovies.has(key)) {
        uniqueMovies.set(key, {
          movie_id: show.movie_id,
          title: show.movie_title || "Untitled movie",
          genre: show.genre || "Drama",
          duration: Number(show.duration) || 120,
          language: show.language || "Not specified",
          release_date: show.release_date,
          show_count: 0,
          shows: [],
          description: "Select a show to see its theatre, date, time and ticket price.",
        });
      }
      uniqueMovies.get(key).show_count += 1;
      uniqueMovies.get(key).shows.push(show);
    });

    return Array.from(uniqueMovies.values());
  }, [dbShows]);

  const genreOptions = useMemo(
    () => Array.from(new Set(movies.flatMap((movie) => getGenreNames(movie.genre))))
      .sort((a, b) => a.localeCompare(b)),
    [movies]
  );
  const languageOptions = useMemo(
    () => Array.from(new Set(movies.map((movie) => movie.language).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b)),
    [movies]
  );
  const yearOptions = useMemo(
    () => Array.from(
      new Set(
        movies
          .map((movie) => String(movie.release_date || "").slice(0, 4))
          .filter((year) => /^\d{4}$/.test(year))
      )
    ).sort((a, b) => Number(b) - Number(a)),
    [movies]
  );
  const visibleMovies = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return movies
      .filter((movie) => {
        const movieYear = String(movie.release_date || "").slice(0, 4);
        return (
          (!query || movie.title.toLocaleLowerCase().includes(query)) &&
          (!genreFilter || getGenreNames(movie.genre).includes(genreFilter)) &&
          (!languageFilter || movie.language === languageFilter) &&
          (!yearFilter || movieYear === yearFilter)
        );
      })
      .sort((a, b) => {
        if (movieSort === "release_date") {
          return String(b.release_date || "").localeCompare(String(a.release_date || ""));
        }
        if (movieSort === "duration") {
          return a.duration - b.duration || a.title.localeCompare(b.title);
        }
        return a.title.localeCompare(b.title);
      });
  }, [movies, searchQuery, genreFilter, languageFilter, yearFilter, movieSort]);

  /* ---- Derived state ---- */
  const selectedShow = dbShows.find(
    (show) => String(show.show_id) === String(selectedShowId)
  );

  const availableShows = selectedMovie
    ? dbShows.filter((show) => (
        isBookableShow(show) &&
        (selectedMovie.movie_id != null && show.movie_id != null
          ? String(show.movie_id) === String(selectedMovie.movie_id)
          : show.movie_title === selectedMovie.title)
      ))
    : [];
  const detailShows = detailsMovie
    ? dbShows.filter(
        (show) => String(show.movie_id) === String(detailsMovie.movie_id) && isBookableShow(show)
      )
    : [];

  const ticketPrice = Number(selectedShow?.price || DEFAULT_TICKET_PRICE);
  const totalPrice = selectedSeatIds.length * ticketPrice;
  const canConfirm = Boolean(selectedShowId) && selectedSeatIds.length >= 1;

  /* ---- Fetch seats when show changes ---- */
  const loadSeats = useCallback(async (showId) => {
    const requestId = ++seatRequestId.current;

    if (!showId) {
      setSeats([]);
      setSelectedSeatIds([]);
      setSeatsError("");
      setSeatsLoading(false);
      return;
    }

    setSeatsLoading(true);
    setSeats([]);
    setSeatsError("");

    try {
      const response = await fetch(`/api/seats?show_id=${showId}`);
      const data = await response.json();
      if (!response.ok || !data.success || !Array.isArray(data.seats)) {
        throw new Error(data.error || "Unable to load seats for this show.");
      }

      if (requestId === seatRequestId.current) {
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
      }
    } catch (error) {
      if (requestId === seatRequestId.current) {
        setSeats([]);
        setSeatsError(error.message || "Unable to load seats for this show.");
      }
    } finally {
      if (requestId === seatRequestId.current) {
        setSeatsLoading(false);
      }
    }
  }, []);

  /* ---- Handlers ---- */

  function beginBooking(movie, showId = "") {
    setDetailsMovie(null);
    setSelectedMovie(movie);
    setSelectedShowId(showId);
    setSelectedSeatIds([]);
    setSeats([]);
    setSeatsError("");
    setStep("form");
    setLastBooking(null);
    setMoviesError("");
    if (showId) loadSeats(showId);
    setTimeout(() => {
      document.getElementById("booking-flow")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  useEffect(() => {
    if (queryBookingHandled.current || !authChecked || !dbShows.length) return;
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get("movie");
    const showId = params.get("show");
    if (!movieId || !showId) return;
    queryBookingHandled.current = true;
    const show = dbShows.find((item) => String(item.show_id) === showId && String(item.movie_id) === movieId);
    if (!show) {
      requestAnimationFrame(() => setMoviesError("That showtime is no longer available. Please select another show."));
      return;
    }
    const movie = movies.find((item) => String(item.movie_id) === movieId);
    if (movie) {
      requestAnimationFrame(() => {
        setDetailsMovie(null);
        setSelectedMovie(movie);
        setSelectedShowId(showId);
        setSelectedSeatIds([]);
        setSeats([]);
        setSeatsError("");
        setStep("form");
        setLastBooking(null);
        setMoviesError("");
        loadSeats(showId);
        document.getElementById("booking-flow")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [authChecked, dbShows, loadSeats, movies]);

  function handleBook(movie) {
    if (!movie.shows?.some(isBookableShow)) {
      setMoviesError("No future showtimes are currently available for this movie.");
      return;
    }
    if (!authUser) {
      setAuthError("Your session could not be confirmed. Please refresh and sign in again.");
      setTimeout(() => {
        document.getElementById("account")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 0);
      return;
    }

    beginBooking(movie);
  }

  function handleDetails(movie) {
    setDetailsMovie(movie);
    setTimeout(() => {
      document.getElementById("movie-details")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function handleBookDetailShow(movie, show) {
    const showId = String(show.show_id);
    if (!isBookableShow(show)) {
      setMoviesError("This showtime has already passed and is no longer bookable.");
      return;
    }
    if (!authUser) {
      setAuthError("Your session could not be confirmed. Please refresh and sign in again.");
      setTimeout(() => {
        document.getElementById("account")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 0);
      return;
    }

    beginBooking(movie, showId);
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
    setSeats([]);
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
    const query = new URLSearchParams({
      movie_id: String(selectedMovie.movie_id),
      show_id: String(selectedShow.show_id),
    });
    for (const seatId of selectedSeatIds) query.append("seat_id", String(seatId));
    router.push(`/booking-review?${query.toString()}`);
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
      <SiteNav user={authUser} />

      <header id="home" className="hero">
        <div className="hero-content">
          {moviesLoading ? (
            <>
              <h1 className="hero-heading">Find your next movie night</h1>
              <p className="hero-subtext">
                Browse the current cinema schedule and reserve your seats.
              </p>
            </>
          ) : movies[0] ? (
            <>
              <p className="hero-eyebrow">{movies[0].shows.some(isBookableShow) ? "Scheduled · Featured movie" : "MovieBook · Featured catalog title"}</p>
              <h1 className="hero-heading">{movies[0].title}</h1>
              <p className="hero-subtext">
                {movies[0].genre} · {formatDuration(movies[0].duration)} ·{" "}
                {movies[0].language}
              </p>
              <div className="hero-actions">
                <button
                  className="btn-primary hero-btn"
                  type="button"
                  onClick={() => handleBook(movies[0])}
                  disabled={!movies[0].shows.some(isBookableShow)}
                >
                  {movies[0].shows.some(isBookableShow) ? "Book tickets" : "No future shows"}
                </button>
                <button
                  className="btn-secondary hero-btn"
                  type="button"
                  onClick={() => handleDetails(movies[0])}
                >
                  Movie details
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="hero-heading">Book Your Favorite Movies</h1>
              <p className="hero-subtext">
                Browse cinema listings and choose a showtime when movies are
                available.
              </p>
              <a href="#movies" className="btn-primary hero-btn">
                Explore Movies
              </a>
            </>
          )}
        </div>
      </header>

      <section id="account" className="account-section">
        <div className="account-panel">
          <div>
            <p className="section-eyebrow">YOUR MOVIEBOOK ACCOUNT</p>
            <h2 className="account-heading">Welcome, {authUser?.name || "MovieBook member"}</h2>
            <p className="account-email">Your reservations are linked securely to your account.</p>
          </div>
          <Link className="btn-secondary" href="/account">Manage account</Link>
          {authError && <p className="account-error" role="alert">{authError}</p>}
        </div>
      </section>

      <section id="movies" className="movies-section">
        <div className="section-heading-row">
          <div>
            <p className="section-eyebrow">Choose your next movie night</p>
            <h2 className="section-heading">Now Showing</h2>
          </div>
          {!moviesLoading && (
            <span className="movie-result-count">
              {visibleMovies.length} of {movies.length} movies
            </span>
          )}
        </div>

        {moviesLoading ? (
          <div className="movies-grid" aria-label="Loading movies">
            {Array.from({ length: 3 }, (_, index) => (
              <div className="movie-skeleton" key={index} />
            ))}
          </div>
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
          <>
            <div className="movie-filters" aria-label="Filter movies">
              <label className="movie-search-field">
                <span className="visually-hidden">Search movie titles</span>
                <input
                  className="form-input"
                  type="search"
                  placeholder="Search movies"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </label>
              <label className="movie-filter-field">
                <span className="visually-hidden">Filter by genre</span>
                <select
                  className="form-select"
                  value={genreFilter}
                  onChange={(event) => setGenreFilter(event.target.value)}
                >
                  <option value="">All genres</option>
                  {genreOptions.map((genre) => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </label>
              <label className="movie-filter-field">
                <span className="visually-hidden">Filter by language</span>
                <select
                  className="form-select"
                  value={languageFilter}
                  onChange={(event) => setLanguageFilter(event.target.value)}
                >
                  <option value="">All languages</option>
                  {languageOptions.map((language) => (
                    <option key={language} value={language}>{language}</option>
                  ))}
                </select>
              </label>
              <label className="movie-filter-field">
                <span className="visually-hidden">Filter by release year</span>
                <select
                  className="form-select"
                  value={yearFilter}
                  onChange={(event) => setYearFilter(event.target.value)}
                >
                  <option value="">All years</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </label>
              <label className="movie-filter-field">
                <span className="visually-hidden">Sort movies</span>
                <select
                  className="form-select"
                  value={movieSort}
                  onChange={(event) => setMovieSort(event.target.value)}
                >
                  <option value="title">Title A–Z</option>
                  <option value="release_date">Newest release</option>
                  <option value="duration">Shortest runtime</option>
                </select>
              </label>
            </div>
            {visibleMovies.length === 0 ? (
              <div className="empty-state">
                <p>No movies match these filters.</p>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setGenreFilter("");
                    setLanguageFilter("");
                    setYearFilter("");
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="movies-grid">
                {visibleMovies.map((movie) => (
                  <MovieCard
                    key={movie.movie_id}
                    movie={movie}
                    onBook={handleBook}
                    onRecommend={handleRecommend}
                    onDetails={handleDetails}
                    shows={dbShows}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {detailsMovie && (
          <section
            className="movie-details-panel"
            id="movie-details"
            aria-labelledby="movie-details-title"
          >
            <div className="movie-details-header">
              <div>
                <p className="section-eyebrow">Movie details</p>
                <h3 id="movie-details-title">{detailsMovie.title}</h3>
              </div>
              <button
                className="btn-close"
                type="button"
                aria-label="Close movie details"
                onClick={() => setDetailsMovie(null)}
              >
                ✕
              </button>
            </div>
            <p className="movie-details-meta">
              {detailsMovie.genre} · {detailsMovie.language} ·{" "}
              {formatDuration(detailsMovie.duration)}
              {detailsMovie.release_date
                ? ` · Released ${formatCalendarDate(detailsMovie.release_date)}`
                : ""}
            </p>
            <p className="movie-description">
              Select a scheduled show below to choose seats and review the
              current ticket price.
            </p>
            <h4 className="movie-details-subheading">Available shows</h4>
            {detailShows.length === 0 ? (
              <p className="empty-state">No shows are scheduled for this movie.</p>
            ) : (
              <div className="movie-show-list">
                {detailShows.map((show) => (
                  <div className="movie-show-row" key={show.show_id}>
                    <div>
                      <strong>{show.theatre_name}</strong>
                      <span>
                        {formatCalendarDate(show.show_date)} · {formatTime(show.show_time)}
                      </span>
                    </div>
                    <button
                      className="btn-primary"
                      type="button"
                      onClick={() => handleBookDetailShow(detailsMovie, show)}
                    >
                      Select · ₹{Number(show.price)}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
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
              seatsError={seatsError}
              onRetrySeats={() => loadSeats(selectedShowId)}
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
        {!authUser && authChecked ? (
          <p className="empty-state">Sign in to view your personal booking history.</p>
        ) : bookingsLoading ? (
          <p className="empty-state">Loading bookings…</p>
        ) : bookingsError ? (
          <p className="booking-error-inline" role="alert">{bookingsError}</p>
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

      <SiteFooter />
    </>
  );
}
