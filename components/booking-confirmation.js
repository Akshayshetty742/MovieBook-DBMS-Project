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

export default function BookingConfirmation({ bookingId }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/bookings")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.bookings)) {
          throw new Error(data.error || "Unable to load booking confirmation.");
        }
        const found = data.bookings.find((item) => String(item.booking_id) === String(bookingId));
        if (!found) throw new Error("This booking was not found in your account.");
        if (active) setBooking(found);
      })
      .catch((fetchError) => {
        if (active) setError(fetchError.message || "Unable to load booking confirmation.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [bookingId]);

  if (loading) return <p className="page-state" role="status">Loading confirmation…</p>;
  if (error) return <div className="page-state page-error" role="alert"><p>{error}</p><Link href="/bookings">Back to My Bookings</Link></div>;

  return (
    <section className="confirmation-page-card">
      <span className="confirmation-success-mark" aria-hidden="true">✓</span>
      <p className="section-eyebrow">YOUR TICKET IS CONFIRMED</p>
      <h1>Enjoy the show</h1>
      <p className="confirmation-reference">Booking #{booking.booking_id}</p>
      <div className="confirmation-details">
        <div><span>Movie</span><strong>{booking.movie_title}</strong></div>
        <div><span>Cinema</span><strong>{booking.theatre_name}</strong></div>
        <div><span>Date and time</span><strong>{formatCalendarDate(booking.show_date, "long")} · {formatTime(booking.show_time)}</strong></div>
        <div><span>Seats</span><strong>{booking.seats?.length ? booking.seats.map((seat) => seat.seat_number).join(", ") : `${booking.seat_count || 0} seats`}</strong></div>
        <div><span>Booking status</span><strong>{booking.booking_status}</strong></div>
        <div><span>Total · demo payment</span><strong>₹{Number(booking.total_amount).toFixed(2)}</strong></div>
      </div>
      <p className="demo-payment-note">Payment in this project is simulated. No real payment was processed.</p>
      <div className="confirmation-page-actions"><Link className="btn-primary" href="/movies">Book another movie</Link><Link className="btn-secondary" href="/bookings">My bookings</Link></div>
    </section>
  );
}
