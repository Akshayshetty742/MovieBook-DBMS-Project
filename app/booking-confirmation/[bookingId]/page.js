import SiteNav from "@/components/site-nav";
import BookingConfirmation from "@/components/booking-confirmation";
import SiteFooter from "@/components/site-footer";
import { requirePageUser } from "@/lib/page-auth";

export const runtime = "nodejs";

export default async function BookingConfirmationPage({ params }) {
  const user = await requirePageUser();
  const { bookingId } = await params;
  if (!/^\d+$/.test(bookingId)) {
    return <><SiteNav user={user} /><main className="content-page"><p className="page-state page-error">Invalid booking identifier.</p></main></>;
  }
  return (
    <>
      <SiteNav active="bookings" user={user} />
      <main className="content-page">
        <BookingConfirmation bookingId={bookingId} />
      </main>
      <SiteFooter />
    </>
  );
}
