"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCalendarDate } from "@/lib/date-format";

function formatTime(value) {
  if (!value) return "Time not listed";
  const [hourText, minute] = String(value).split(":");
  const hour = Number(hourText);
  return Number.isFinite(hour) ? `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}` : value;
}

function formatDuration(value) {
  const minutes = Number(value);
  if (!minutes) return null;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function showIsBookable(show) {
  const date = String(show.show_date || "").slice(0, 10);
  const time = String(show.show_time || "00:00:00").slice(0, 8);
  const startsAt = new Date(`${date}T${time}`);
  return !Number.isNaN(startsAt.getTime()) && startsAt > new Date();
}

export default function BookingReview({ movieId, showId, seatIds }) {
  const router = useRouter();
  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/shows").then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.shows)) throw new Error(data.error || "Unable to load show details.");
        return data.shows;
      }),
      fetch(`/api/seats?show_id=${encodeURIComponent(showId)}`).then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.seats)) throw new Error(data.error || "Unable to verify selected seats.");
        return data.seats;
      }),
    ]).then(([shows, allSeats]) => {
      const foundShow = shows.find((item) => String(item.show_id) === String(showId) && String(item.movie_id) === String(movieId));
      if (!foundShow) throw new Error("This movie showtime is no longer available.");
      if (!showIsBookable(foundShow)) throw new Error("This showtime has already passed and is no longer bookable.");
      const chosen = allSeats.filter((seat) => seatIds.includes(String(seat.seat_id)));
      if (chosen.length !== seatIds.length) throw new Error("One or more selected seats could not be found. Return to seat selection.");
      if (chosen.some((seat) => seat.status === "booked")) throw new Error("One or more selected seats were booked by someone else. Choose available seats.");
      if (active) {
        setShow(foundShow);
        setSeats(chosen);
      }
    }).catch((loadError) => {
      if (active) setError(loadError.message || "Unable to prepare booking review.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [movieId, showId, seatIds]);

  async function confirmBooking() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show_id: Number(showId), seat_ids: seatIds.map(Number) }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.booking_id) throw new Error(data.error || "Unable to confirm this booking.");
      router.replace(`/booking-confirmation/${data.booking_id}`);
      router.refresh();
    } catch (confirmError) {
      setError(confirmError.message || "Unable to confirm this booking.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="page-state" role="status">Preparing your booking review…</p>;
  if (!show || error) {
    return (
      <div className="page-state page-error" role="alert">
        <p>{error || "Unable to review this booking."}</p>
        <button className="btn-secondary" type="button" onClick={() => router.back()}>Return to seat selection</button>
      </div>
    );
  }

  const total = Number(show.price) * seats.length;
  return (
    <section className="booking-review-card">
      <p className="section-eyebrow">FINAL CHECK</p>
      <h1>Review your booking</h1>
      <p className="review-subtitle">Confirm your movie, showtime, seats, and total before reserving.</p>
      <div className="review-detail-grid">
        <div><span>Movie</span><strong>{show.movie_title}</strong></div>
        {(show.genre || show.language || show.duration) && <div><span>Film details</span><strong>{[show.genre, show.language, formatDuration(show.duration)].filter(Boolean).join(" · ")}</strong></div>}
        <div><span>Cinema</span><strong>{show.theatre_name}</strong></div>
        <div><span>Date</span><strong>{formatCalendarDate(show.show_date, "long")}</strong></div>
        <div><span>Showtime</span><strong>{formatTime(show.show_time)}</strong></div>
        <div className="review-seats"><span>Selected seats ({seats.length})</span><strong>{seats.map((seat) => seat.seat_number).join(", ")}</strong></div>
        <div><span>Price per seat</span><strong>₹{Number(show.price).toFixed(2)}</strong></div>
      </div>
      <div className="review-total"><span>Total · simulated demo payment</span><strong>₹{total.toFixed(2)}</strong></div>
      {error && <p className="booking-error-inline" role="alert">{error}</p>}
      <div className="review-actions">
        <button className="btn-secondary" type="button" onClick={() => router.back()} disabled={submitting}>Back to seats</button>
        <button className="btn-primary" type="button" onClick={confirmBooking} disabled={submitting}>
          {submitting ? "Confirming…" : "Confirm and book"}
        </button>
      </div>
      <p className="demo-payment-note">Payment is simulated for this project. No real payment method is required.</p>
    </section>
  );
}
