import SiteNav from "@/components/site-nav";
import SiteFooter from "@/components/site-footer";
import BookingReview from "@/components/booking-review";
import { requirePageUser } from "@/lib/page-auth";

export const runtime = "nodejs";

export default async function BookingReviewPage({ searchParams }) {
  const user = await requirePageUser();
  const query = await searchParams;
  const movieId = String(query.movie_id || "");
  const showId = String(query.show_id || "");
  const seatIds = Array.isArray(query.seat_id)
    ? query.seat_id.map(String)
    : query.seat_id
      ? [String(query.seat_id)]
      : [];
  const validIds = /^\d+$/.test(movieId) && /^\d+$/.test(showId) &&
    seatIds.length > 0 && seatIds.length <= 10 &&
    seatIds.every((id) => /^\d+$/.test(id)) &&
    new Set(seatIds).size === seatIds.length;

  return (
    <>
      <SiteNav user={user} />
      <main className="content-page booking-review-page">
        {validIds
          ? <BookingReview movieId={movieId} showId={showId} seatIds={seatIds} />
          : <div className="page-state page-error" role="alert">Booking details are incomplete. Return to the movie page and choose seats again.</div>}
      </main>
      <SiteFooter />
    </>
  );
}
