import { requirePageUser } from "@/lib/page-auth";
import SiteNav from "@/components/site-nav";
import MovieDetails from "@/components/movie-details";
import SiteFooter from "@/components/site-footer";

export const runtime = "nodejs";

export default async function MovieDetailsPage({ params }) {
  const user = await requirePageUser();
  const { movieId } = await params;
  if (!/^\d+$/.test(movieId)) {
    return (
      <>
        <SiteNav active="movies" user={user} />
        <main className="content-page"><div className="page-state">Invalid movie identifier.</div></main>
      </>
    );
  }
  return (
    <>
      <SiteNav active="movies" user={user} />
      <main className="content-page"><MovieDetails movieId={movieId} /></main>
      <SiteFooter />
    </>
  );
}
