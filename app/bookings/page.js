import SiteNav from "@/components/site-nav";
import BookingsList from "@/components/bookings-list";
import SiteFooter from "@/components/site-footer";
import { requirePageUser } from "@/lib/page-auth";

export const runtime = "nodejs";

export default async function BookingsPage() {
  const user = await requirePageUser();
  return (
    <>
      <SiteNav active="bookings" user={user} />
      <main className="content-page">
        <section className="page-heading">
          <p className="section-eyebrow">YOUR MOVIE NIGHTS</p>
          <h1>My Bookings</h1>
          <p>Your personal booking history, available only to you.</p>
        </section>
        <BookingsList />
      </main>
      <SiteFooter />
    </>
  );
}
