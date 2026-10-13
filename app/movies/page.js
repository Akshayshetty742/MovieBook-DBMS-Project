import SiteNav from "@/components/site-nav";
import MovieListing from "@/components/movie-listing";
import SiteFooter from "@/components/site-footer";
import { requirePageUser } from "@/lib/page-auth";

export const runtime = "nodejs";

export default async function MoviesPage() {
  const user = await requirePageUser();
  return (
    <>
      <SiteNav active="movies" user={user} />
      <main className="content-page">
        <section className="page-heading">
          <p className="section-eyebrow">THE BIG SCREEN AWAITS</p>
          <h1>Explore Movies</h1>
          <p>Find a film and choose a showtime that works for you.</p>
        </section>
        <MovieListing />
      </main>
      <SiteFooter />
    </>
  );
}
