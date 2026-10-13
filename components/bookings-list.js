"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCalendarDate } from "@/lib/date-format";

function formatTime(value) {
  if (!value) return "Time not listed";
  const [hourText, minute] = String(value).split(":");
  const hour = Number(hourText);
  return Number.isFinite(hour) ? `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}` : value;
}

export default function BookingsList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/bookings")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.bookings)) {
          throw new Error(data.error || "Unable to load your bookings.");
        }
        if (active) setBookings(data.bookings);
      })
      .catch((fetchError) => {
        if (active) setError(fetchError.message || "Unable to load your bookings.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  if (loading) return <p className="page-state" role="status">Loading your bookings…</p>;
  if (error) return <p className="page-state page-error" role="alert">{error}</p>;
  if (!bookings.length) {
    return (
      <div className="page-state empty-bookings">
        <h2>No bookings yet</h2>
        <p>When you book a movie, your tickets and show details will appear here.</p>
        <Link className="btn-primary inline-action" href="/movies">Explore movies</Link>
      </div>
    );
  }

  return (
    <div className="professional-booking-list">
      {bookings.map((booking) => (
        <article className="professional-booking-card" key={booking.booking_id}>
          <div className="booking-main">
            <p className="booking-id">BOOKING #{booking.booking_id}</p>
            <h2>{booking.movie_title}</h2>
            <p className="booking-theatre">{booking.theatre_name}</p>
            <p>{formatCalendarDate(booking.show_date)} · {formatTime(booking.show_time)}</p>
            <p className="booking-seats">{booking.seats?.length ? booking.seats.map((seat) => seat.seat_number).join(", ") : `${booking.seat_count || 0} seats`}</p>
          </div>
          <div className="booking-total">
            <span className={`booking-status ${booking.booking_status === "CANCELLED" ? "booking-status-cancelled" : ""}`}>{booking.booking_status}</span>
            <strong>₹{Number(booking.total_amount).toFixed(2)}</strong>
            <Link href={`/booking-confirmation/${booking.booking_id}`}>View confirmation</Link>
          </div>
        </article>
      ))}
    </div>
  );
}
